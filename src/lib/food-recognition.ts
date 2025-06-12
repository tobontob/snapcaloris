import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { findFoodInDatabase, type FoodData } from './food-database';
import * as tf from '@tensorflow/tfjs';

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
  probability: number;
  calories: number;
  portion: string;
}

// File을 base64로 변환하는 유틸리티 함수
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('이미지 변환 실패'));
      }
    };
    reader.onerror = () => reject(new Error('이미지 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

export async function classifyFood(imageFile: File): Promise<FoodInfo> {
  try {
    // 파일 크기 검증
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > MAX_FILE_SIZE) {
      throw new Error('이미지 크기가 10MB를 초과합니다.');
    }

    // 파일 형식 검증
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(imageFile.type)) {
      throw new Error('지원하지 않는 이미지 형식입니다. (JPEG 또는 PNG만 가능)');
    }

    // 이미지를 base64로 변환
    console.log('이미지 변환 시작...');
    const base64Image = await fileToBase64(imageFile);
    console.log('이미지 변환 완료');

    // API 요청
    console.log('API 요청 시작...');
    const response = await fetch('/api/food-recognition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image }),
    });

    const result = await response.json();
    console.log('API 응답:', result);

    if (!response.ok) {
      throw new Error(result.error || 'API 호출 실패');
    }

    if (!result.predictions?.length) {
      throw new Error('이미지에서 음식을 찾을 수 없습니다. 다른 이미지를 시도해보세요.');
    }

    // 가장 높은 확률의 예측 결과 가져오기
    const bestMatch = result.predictions[0];
    
    // 데이터베이스에서 음식 정보 찾기
    const foodInfo = findFoodInDatabase(bestMatch.name);
    
    if (!foodInfo) {
      return {
        name: bestMatch.name,
        probability: bestMatch.probability,
        calories: 0,
        portion: '알 수 없음'
      };
    }

    return {
      name: foodInfo.name,
      probability: bestMatch.probability,
      calories: foodInfo.calories,
      portion: foodInfo.portion || '1인분'
    };

  } catch (error: any) {
    console.error('음식 인식 중 오류:', error);
    throw new Error(error.message || '음식 인식 중 오류가 발생했습니다.');
  }
}

export function calculatePortionCalories(baseCalories: number, portionSize: number) {
  // portionSize는 1이 기본 1인분
  return Math.round(baseCalories * portionSize);
}