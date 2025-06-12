import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// 한식, 중식, 일식, 양식 음식 데이터베이스
const foodDatabase = {
  // 실제 구현시 더 많은 음식 데이터 추가 필요
  '비빔밥': { calories: 600, cuisine: '한식' },
  '김치찌개': { calories: 350, cuisine: '한식' },
  '짜장면': { calories: 785, cuisine: '중식' },
  '마파두부': { calories: 420, cuisine: '중식' },
  '스시': { calories: 350, cuisine: '일식' },
  '라멘': { calories: 450, cuisine: '일식' },
  '피자': { calories: 266, cuisine: '양식' }, // 1조각 기준
  '파스타': { calories: 400, cuisine: '양식' },
};

let model: mobilenet.MobileNet | null = null;

export async function loadModel() {
  if (!model) {
    model = await mobilenet.load({
      version: 2,
      alpha: 1.0,
    });
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

// 임시로 음식을 인식하는 함수입니다.
// 실제 구현에서는 ML 모델이나 외부 API를 사용하여 구현해야 합니다.
export async function classifyFood(imageFile: File): Promise<FoodInfo> {
  // 실제 구현에서는 이미지를 분석하여 결과를 반환해야 합니다.
  // 현재는 테스트를 위한 더미 데이터를 반환합니다.
  await new Promise(resolve => setTimeout(resolve, 2000)); // 분석 시간 시뮬레이션

  return {
    name: "김치볶음밥",
    calories: 500,
    confidence: 0.95,
    portion: "1인분 (300g)"
  };
}

export function calculatePortionCalories(baseCalories: number, portionSize: number) {
  // portionSize는 1이 기본 1인분
  return Math.round(baseCalories * portionSize);
}

export type FoodInfo = {
  name: string;
  calories: number;
  cuisine: string;
  confidence: number;
}; 