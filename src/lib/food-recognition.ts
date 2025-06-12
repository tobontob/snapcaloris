import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as mobilenet from '@tensorflow-models/mobilenet';

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

// 음식 데이터베이스 확장 및 키워드 매핑 개선
const foodDatabase = {
  // 한식
  'bibimbap': { 
    name: '비빔밥', 
    calories: 600, 
    cuisine: '한식',
    keywords: ['bowl', 'rice', 'mixed', 'korean', 'vegetables', 'bibimbap']
  },
  'kimchi': { 
    name: '김치', 
    calories: 15, 
    cuisine: '한식',
    keywords: ['kimchi', 'fermented', 'cabbage', 'korean']
  },
  'bulgogi': {
    name: '불고기',
    calories: 450,
    cuisine: '한식',
    keywords: ['beef', 'bulgogi', 'korean', 'grilled', 'meat']
  },
  
  // 중식
  'jajangmyeon': {
    name: '짜장면',
    calories: 785,
    cuisine: '중식',
    keywords: ['noodles', 'black bean', 'chinese', 'jajangmyeon', 'pasta', 'spaghetti', 'sauce']
  },
  'tangsuyuk': {
    name: '탕수육',
    calories: 500,
    cuisine: '중식',
    keywords: ['sweet', 'sour', 'pork', 'chinese', 'fried', 'meat']
  },
  'mapatofu': {
    name: '마파두부',
    calories: 300,
    cuisine: '중식',
    keywords: ['tofu', 'mapo', 'chinese', 'spicy']
  },
  
  // 양식
  'hamburger': {
    name: '햄버거',
    calories: 550,
    cuisine: '양식',
    keywords: ['burger', 'hamburger', 'beef', 'sandwich', 'bun', 'meat']
  },
  'pizza': {
    name: '피자',
    calories: 266,
    cuisine: '양식',
    keywords: ['pizza', 'cheese', 'italian', 'bread', 'tomato']
  },
  'pasta': {
    name: '파스타',
    calories: 400,
    cuisine: '양식',
    keywords: ['pasta', 'spaghetti', 'noodle', 'italian', 'sauce']
  },
  'steak': {
    name: '스테이크',
    calories: 450,
    cuisine: '양식',
    keywords: ['steak', 'beef', 'grilled', 'meat']
  },
  
  // 일식
  'sushi': {
    name: '스시',
    calories: 350,
    cuisine: '일식',
    keywords: ['sushi', 'japanese', 'raw', 'fish', 'rice']
  },
  'ramen': {
    name: '라멘',
    calories: 450,
    cuisine: '일식',
    keywords: ['ramen', 'noodle', 'soup', 'japanese', 'broth']
  },
  'tempura': {
    name: '텐푸라',
    calories: 450,
    cuisine: '일식',
    keywords: ['tempura', 'fried', 'japanese', 'batter']
  }
};

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

// File 객체를 HTMLImageElement로 변환하는 유틸리티 함수
async function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';  // CORS 이슈 방지
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        // 이미지가 로드되면 해당 이미지 반환
        resolve(img);
      };
      img.onerror = (error) => {
        console.error('이미지 로드 실패:', error);
        reject(error);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (error) => {
      console.error('파일 읽기 실패:', error);
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

// 이미지를 분석하여 음식을 인식하는 함수
export async function classifyFood(imageFile: File): Promise<FoodInfo> {
  try {
    const loadedModel = await loadModel();
    if (!loadedModel) {
      throw new Error('모델 로드 실패');
    }
    
    const image = await createImageFromFile(imageFile);
    
    if (!image.complete || !image.naturalHeight) {
      throw new Error('이미지 로드 실패');
    }

    console.log('이미지 크기:', image.width, 'x', image.height);
    
    try {
      const predictions = await loadedModel.classify(image, 10);
      console.log('MobileNet 예측 결과:', predictions);
      
      if (!predictions || predictions.length === 0) {
        throw new Error('예측 결과 없음');
      }

      let bestMatch: FoodInfo | null = null;
      let highestScore = 0;

      // 모든 예측 결과의 클래스명을 하나의 문자열로 결합
      const allPredictions = predictions
        .map(p => p.className.toLowerCase())
        .join(' ');
      console.log('통합된 예측 결과:', allPredictions);

      // 각 음식에 대해 키워드 매칭 점수 계산
      for (const [foodId, foodData] of Object.entries(foodDatabase)) {
        let score = 0;
        let matchedKeywords = [];

        // 각 키워드에 대해 매칭 확인
        for (const keyword of foodData.keywords) {
          if (allPredictions.includes(keyword)) {
            score += 1;
            matchedKeywords.push(keyword);
          }
        }

        // 개별 예측 결과의 신뢰도를 고려한 가중치 부여
        for (const prediction of predictions) {
          const predictionClass = prediction.className.toLowerCase();
          for (const keyword of foodData.keywords) {
            if (predictionClass.includes(keyword)) {
              score += prediction.probability;
            }
          }
        }

        if (matchedKeywords.length > 0) {
          console.log(`${foodData.name} 매칭 결과:`, {
            score,
            matchedKeywords
          });
        }

        // 최소 매칭 임계값 (0.5) 이상인 경우에만 고려
        if (score > highestScore && score > 0.5) {
          highestScore = score;
          bestMatch = {
            name: foodData.name,
            calories: foodData.calories,
            confidence: Math.round((score / (foodData.keywords.length + 1)) * 100),
            cuisine: foodData.cuisine,
            portion: "1인분"
          };
        }
      }

      if (!bestMatch) {
        console.log('매칭되는 음식을 찾지 못했습니다.');
        console.log('최상위 예측:', predictions[0]);
        return {
          name: "알 수 없는 음식",
          calories: 0,
          confidence: 0,
          portion: "알 수 없음"
        };
      }

      console.log('최종 선택된 음식:', bestMatch);
      return bestMatch;
    } catch (error) {
      console.error('이미지 분석 실패:', error);
      throw error;
    }
  } catch (error) {
    console.error('Food classification error:', error);
    throw new Error('음식 인식 중 오류가 발생했습니다.');
  }
}

export function calculatePortionCalories(baseCalories: number, portionSize: number) {
  // portionSize는 1이 기본 1인분
  return Math.round(baseCalories * portionSize);
} 