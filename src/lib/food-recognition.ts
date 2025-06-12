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

// 음식 데이터베이스 확장
const foodDatabase = {
  // 한식
  'bibimbap': { name: '비빔밥', calories: 600, cuisine: '한식' },
  'kimchi': { name: '김치', calories: 15, cuisine: '한식' },
  'kimchi fried rice': { name: '김치볶음밥', calories: 500, cuisine: '한식' },
  'bulgogi': { name: '불고기', calories: 450, cuisine: '한식' },
  'korean soup': { name: '국물요리', calories: 300, cuisine: '한식' },
  
  // 양식
  'hamburger': { name: '햄버거', calories: 550, cuisine: '양식' },
  'pizza': { name: '피자', calories: 266, cuisine: '양식' },
  'pasta': { name: '파스타', calories: 400, cuisine: '양식' },
  'steak': { name: '스테이크', calories: 450, cuisine: '양식' },
  
  // 중식
  'noodle': { name: '짜장면', calories: 785, cuisine: '중식' },
  'fried rice': { name: '볶음밥', calories: 500, cuisine: '중식' },
  'dumpling': { name: '만두', calories: 400, cuisine: '중식' },
  
  // 일식
  'sushi': { name: '스시', calories: 350, cuisine: '일식' },
  'ramen': { name: '라멘', calories: 450, cuisine: '일식' },
  'tempura': { name: '텐푸라', calories: 450, cuisine: '일식' },
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

// 이미지를 분석하여 음식을 인식하는 함수
export async function classifyFood(imageFile: File): Promise<FoodInfo> {
  try {
    // 모델 로드
    const loadedModel = await loadModel();
    
    // File을 이미지로 변환
    const image = await createImageFromFile(imageFile);
    
    // 이미지 분석
    const predictions = await loadedModel.classify(image, 5);
    
    // 가장 높은 신뢰도를 가진 음식 찾기
    let bestMatch: FoodInfo | null = null;
    let highestConfidence = 0;

    for (const prediction of predictions) {
      const className = prediction.className.toLowerCase();
      // 예측된 클래스명에서 음식을 찾기
      for (const [key, value] of Object.entries(foodDatabase)) {
        if (className.includes(key)) {
          const confidence = prediction.probability;
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = {
              name: value.name,
              calories: value.calories,
              confidence: confidence,
              cuisine: value.cuisine,
              portion: "1인분"
            };
          }
        }
      }
    }

    // 매칭되는 음식을 찾지 못한 경우
    if (!bestMatch) {
      return {
        name: "알 수 없는 음식",
        calories: 0,
        confidence: 0,
        portion: "알 수 없음"
      };
    }

    return bestMatch;
  } catch (error) {
    console.error('Food classification error:', error);
    throw new Error('음식 인식 중 오류가 발생했습니다.');
  }
}

// File 객체를 HTMLImageElement로 변환하는 유틸리티 함수
async function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function calculatePortionCalories(baseCalories: number, portionSize: number) {
  // portionSize는 1이 기본 1인분
  return Math.round(baseCalories * portionSize);
} 