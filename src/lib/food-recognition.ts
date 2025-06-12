import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Clarifai 응답 타입 정의
interface ClarifaiResponse {
  status: {
    code: number;
    description: string;
  };
  outputs: Array<{
    data: {
      concepts: Array<{
        name: string;
        value: number;
      }>;
    };
  }>;
}

const CLARIFAI_API_KEY = process.env.NEXT_PUBLIC_CLARIFAI_PAT || process.env.NEXT_PUBLIC_CLARIFAI_API_KEY;
const FOOD_MODEL_ID = 'bd367be194cf45149e75f01d59f77ba7';

// TensorFlow 백엔드 초기화
async function initializeTensorFlow() {
  try {
    // WebGL 백엔드를 우선적으로 사용
    await tf.setBackend('webgl');
  } catch (e) {
    console.warn('WebGL 백엔드 초기화 실패, CPU 백엔드로 전환합니다:', e);
    try {
      // WebGL이 실패하면 CPU 백엔드 사용
      await tf.setBackend('cpu');
    } catch (e) {
      console.error('TensorFlow 백엔드 초기화 실패:', e);
      throw new Error('TensorFlow 초기화에 실패했습니다.');
    }
  }
  console.log('사용 중인 TensorFlow 백엔드:', tf.getBackend());
}

// Food-101 데이터셋 기반의 기본 음식 데이터베이스
const commonFoodDatabase = {
  // 한식
  'bibimbap': {
    name: '비빔밥',
    calories: 600,
    cuisine: '한식',
    keywords: ['rice', 'bowl', 'bibimbap', 'korean', 'mixed rice', 'vegetables', 'egg', 'gochujang', 'sesame oil'],
    synonyms: ['mixed rice', 'korean rice bowl', 'vegetable rice']
  },
  'kimchi': {
    name: '김치',
    calories: 15,
    cuisine: '한식',
    keywords: ['kimchi', 'fermented', 'cabbage', 'korean', 'spicy', 'napa cabbage', 'radish', 'garlic'],
    synonyms: ['fermented vegetables', 'korean pickle']
  },
  'bulgogi': {
    name: '불고기',
    calories: 450,
    cuisine: '한식',
    keywords: ['bulgogi', 'korean', 'beef', 'grilled', 'marinated', 'soy sauce', 'sesame', 'garlic'],
    synonyms: ['korean bbq', 'marinated beef', 'grilled meat']
  },

  // 중식
  'jajangmyeon': {
    name: '짜장면',
    calories: 785,
    cuisine: '중식',
    keywords: ['noodles', 'black bean sauce', 'chinese', 'jajangmyeon', 'pork', 'vegetables', 'onion'],
    synonyms: ['black bean noodles', 'chinese noodles', 'korean chinese food']
  },
  'mapo_tofu': {
    name: '마파두부',
    calories: 300,
    cuisine: '중식',
    keywords: ['tofu', 'mapo', 'chinese', 'spicy', 'pork', 'sauce', 'sichuan', 'bean curd'],
    synonyms: ['spicy tofu', 'sichuan tofu']
  },

  // 양식
  'hamburger': {
    name: '햄버거',
    calories: 550,
    cuisine: '양식',
    keywords: ['burger', 'hamburger', 'beef', 'bun', 'cheese', 'lettuce', 'tomato', 'patty', 'sandwich'],
    synonyms: ['cheeseburger', 'beef burger', 'burger sandwich']
  },
  'pizza': {
    name: '피자',
    calories: 266,
    cuisine: '양식',
    keywords: ['pizza', 'cheese', 'tomato sauce', 'italian', 'bread', 'mozzarella', 'pepperoni', 'crust'],
    synonyms: ['cheese pizza', 'italian pizza', 'flatbread']
  },
  'pasta': {
    name: '파스타',
    calories: 400,
    cuisine: '양식',
    keywords: ['pasta', 'spaghetti', 'noodle', 'italian', 'sauce', 'tomato', 'cream', 'garlic'],
    synonyms: ['spaghetti', 'noodles', 'italian noodles']
  },
  'steak': {
    name: '스테이크',
    calories: 450,
    cuisine: '양식',
    keywords: ['steak', 'beef', 'grilled', 'meat', 'medium rare', 'well done', 'ribeye', 'sirloin'],
    synonyms: ['beef steak', 'grilled steak', 'meat steak']
  },

  // 일식
  'sushi': {
    name: '스시',
    calories: 350,
    cuisine: '일식',
    keywords: ['sushi', 'japanese', 'raw fish', 'rice', 'seaweed', 'wasabi', 'roll', 'nigiri'],
    synonyms: ['japanese sushi', 'sushi roll', 'raw fish']
  },
  'ramen': {
    name: '라멘',
    calories: 450,
    cuisine: '일식',
    keywords: ['ramen', 'noodle soup', 'japanese', 'broth', 'noodles', 'pork', 'egg', 'seaweed'],
    synonyms: ['japanese noodles', 'noodle soup', 'soup noodles']
  }
};

// 전체 음식 데이터베이스를 저장할 변수
let fullFoodDatabase: Record<string, any> = { ...commonFoodDatabase };
let isDatabaseLoaded = false;

// 음식 데이터베이스를 동적으로 로드하는 함수
async function loadFullDatabase() {
  if (isDatabaseLoaded) return;

  try {
    // 데이터 청크를 순차적으로 로드
    const chunks = ['korean', 'chinese', 'japanese', 'western'];
    for (const chunk of chunks) {
      const response = await fetch(`/api/food-data/${chunk}`);
      const data = await response.json();
      fullFoodDatabase = { ...fullFoodDatabase, ...data };
    }
    isDatabaseLoaded = true;
    console.log('전체 음식 데이터베이스 로드 완료');
  } catch (error) {
    console.error('음식 데이터베이스 로드 실패:', error);
    // 기본 데이터베이스만 사용
  }
}

let model: mobilenet.MobileNet | null = null;

export async function loadModel() {
  if (!model) {
    // TensorFlow 백엔드 초기화
    await initializeTensorFlow();
    
    try {
      model = await mobilenet.load({
        version: 2,
        alpha: 1.0,
      });
      console.log('MobileNet 모델 로드 완료');
    } catch (e) {
      console.error('MobileNet 모델 로드 실패:', e);
      throw new Error('이미지 인식 모델 로드에 실패했습니다.');
    }
  }
  return model;
}

export interface FoodInfo {
  name: string;
  calories: number;
  confidence: number;
  portion?: string;
  cuisine?: string;
}

interface FoodData {
  name: string;
  calories: number;
  cuisine: string;
  keywords: string[];
}

// 음식 데이터베이스
const foodDatabase: Record<string, FoodData> = {
  'bibimbap': {
    name: '비빔밥',
    calories: 600,
    cuisine: '한식',
    keywords: ['rice', 'bowl', 'bibimbap', 'korean', 'mixed rice', 'vegetables']
  },
  'jajangmyeon': {
    name: '짜장면',
    calories: 785,
    cuisine: '중식',
    keywords: ['noodles', 'black bean sauce', 'chinese', 'jajangmyeon']
  },
  'hamburger': {
    name: '햄버거',
    calories: 550,
    cuisine: '양식',
    keywords: ['burger', 'hamburger', 'beef', 'sandwich', 'bun', 'meat']
  },
  // ... 나머지 음식 데이터 ...
};

// 데이터베이스에서 음식 찾기 함수
function findFoodInDatabase(foodName: string): FoodData | null {
  const normalizedName = foodName.toLowerCase();
  
  // 전체 데이터베이스에서 검색
  for (const [key, foodData] of Object.entries(fullFoodDatabase)) {
    const keywords = [...(foodData.keywords || []), key.toLowerCase()];
    if (keywords.some(keyword => normalizedName.includes(keyword))) {
      return foodData;
    }
  }
  
  return null;
}

export async function classifyFood(imageFile: File): Promise<FoodInfo> {
  try {
    // File을 base64로 변환
    const base64Image = await fileToBase64(imageFile);
    
    // Clarifai API 호출
    const response = await fetch(`https://api.clarifai.com/v2/models/${FOOD_MODEL_ID}/outputs`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${CLARIFAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: [
          {
            data: {
              image: {
                base64: base64Image.split(',')[1] // Remove data:image/jpeg;base64, prefix
              }
            }
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('API 호출 실패');
    }

    const result = await response.json();
    
    if (!result.outputs?.[0]?.data?.concepts) {
      throw new Error('API 응답 형식 오류');
    }

    const concepts = result.outputs[0].data.concepts;
    console.log('Clarifai 예측 결과:', concepts);

    if (!concepts || concepts.length === 0) {
      return {
        name: "알 수 없는 음식",
        calories: 0,
        confidence: 0,
        portion: "알 수 없음"
      };
    }

    // 가장 높은 신뢰도를 가진 음식 찾기
    let bestMatch: FoodInfo | null = null;
    let highestConfidence = 0;

    for (const concept of concepts) {
      const foodName = concept.name.toLowerCase();
      const confidence = concept.value;

      // 데이터베이스에서 매칭되는 음식 찾기
      for (const [key, foodData] of Object.entries(fullFoodDatabase)) {
        const keywords = [...(foodData.keywords || []), key.toLowerCase()];
        if (keywords.some(keyword => foodName.includes(keyword))) {
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = {
              name: foodData.name,
              calories: foodData.calories,
              confidence: Math.round(confidence * 100),
              cuisine: foodData.cuisine,
              portion: "1인분"
            };
          }
        }
      }
    }

    if (!bestMatch) {
      // Clarifai가 인식한 첫 번째 음식 사용
      const topConcept = concepts[0];
      return {
        name: topConcept.name,
        calories: 0,
        confidence: Math.round(topConcept.value * 100),
        portion: "알 수 없음"
      };
    }

    return bestMatch;
  } catch (error) {
    console.error('Food classification error:', error);
    throw new Error('음식 인식 중 오류가 발생했습니다.');
  }
}

// File을 base64로 변환하는 유틸리티 함수
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function calculatePortionCalories(baseCalories: number, portionSize: number) {
  // portionSize는 1이 기본 1인분
  return Math.round(baseCalories * portionSize);
} 