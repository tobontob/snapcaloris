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
  'rice': { name: '밥', calories: 300, cuisine: '한식' },
  'bowl': { name: '비빔밥', calories: 600, cuisine: '한식' },
  'kimchi': { name: '김치', calories: 15, cuisine: '한식' },
  'soup': { name: '국물요리', calories: 300, cuisine: '한식' },
  'noodle': { name: '국수', calories: 400, cuisine: '한식' },
  
  // 양식
  'burger': { name: '햄버거', calories: 550, cuisine: '양식' },
  'hamburger': { name: '햄버거', calories: 550, cuisine: '양식' },
  'pizza': { name: '피자', calories: 266, cuisine: '양식' },
  'pasta': { name: '파스타', calories: 400, cuisine: '양식' },
  'steak': { name: '스테이크', calories: 450, cuisine: '양식' },
  'sandwich': { name: '샌드위치', calories: 350, cuisine: '양식' },
  
  // 중식
  'chinese': { name: '중식', calories: 500, cuisine: '중식' },
  'noodles': { name: '짜장면', calories: 785, cuisine: '중식' },
  'fried rice': { name: '볶음밥', calories: 500, cuisine: '중식' },
  'dumpling': { name: '만두', calories: 400, cuisine: '중식' },
  
  // 일식
  'sushi': { name: '스시', calories: 350, cuisine: '일식' },
  'ramen': { name: '라멘', calories: 450, cuisine: '일식' },
  'tempura': { name: '텐푸라', calories: 450, cuisine: '일식' },
  'japanese': { name: '일식', calories: 400, cuisine: '일식' },
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
    const predictions = await loadedModel.classify(image, 10); // 상위 10개 결과로 증가
    
    // 디버깅을 위해 예측 결과 출력
    console.log('MobileNet 예측 결과:', predictions);
    
    // 가장 높은 신뢰도를 가진 음식 찾기
    let bestMatch: FoodInfo | null = null;
    let highestConfidence = 0;

    for (const prediction of predictions) {
      const className = prediction.className.toLowerCase();
      console.log('분석 중인 클래스:', className);
      
      // 예측된 클래스의 각 단어에 대해 매칭 시도
      const words = className.split(/[\s,]+/);
      for (const word of words) {
        for (const [key, value] of Object.entries(foodDatabase)) {
          if (word.includes(key) || key.includes(word)) {
            const confidence = prediction.probability;
            console.log('매칭된 음식:', key, '신뢰도:', confidence);
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
    }

    // 매칭되는 음식을 찾지 못한 경우
    if (!bestMatch) {
      console.log('매칭되는 음식을 찾지 못했습니다.');
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