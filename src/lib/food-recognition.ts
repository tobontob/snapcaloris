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

export async function classifyFood(imageElement: HTMLImageElement) {
  try {
    const model = await loadModel();
    const predictions = await model.classify(imageElement, 5);
    
    // 예측 결과를 분석하여 가장 적합한 음식 찾기
    const foodPredictions = predictions.map(pred => {
      const foodName = pred.className.toLowerCase();
      const confidence = pred.probability;
      
      // 데이터베이스에서 가장 유사한 음식 찾기
      const matchedFood = Object.entries(foodDatabase).find(([name]) => 
        foodName.includes(name.toLowerCase())
      );

      return matchedFood 
        ? { 
            name: matchedFood[0],
            ...matchedFood[1],
            confidence
          }
        : null;
    }).filter(Boolean);

    return foodPredictions[0] || {
      name: '알 수 없는 음식',
      calories: 0,
      cuisine: '미분류',
      confidence: 0
    };
  } catch (error) {
    console.error('Food classification error:', error);
    throw new Error('음식을 인식하는 중 오류가 발생했습니다.');
  }
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