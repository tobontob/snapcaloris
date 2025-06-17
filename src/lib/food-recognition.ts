import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { findFoodInDatabase, type FoodData } from './food-database';
import * as tf from '@tensorflow/tfjs';
import { findExactFoodMatch } from '@/utils/foodData';
import { FoodRecognitionResult } from '@/types/food';

// Teachable Machine 클래스 목록
const TEACHABLE_CLASSES = [
  "떡볶이", "햄버거", "라면", "우동", "짜장면", "짬뽕", "피자", "냉면", "비빔밥", "삼겹살"
];

// Food-101 모델 응답 타입
interface Food101Response {
  predictions: {
    label: string;
    confidence: number;
    calories: number;
    portion: string;
  }[];
}

// Teachable Machine 모델 응답 타입
interface TeachableResponse {
  predictions: {
    label: string;
    confidence: number;
    calories: number;
    portion: string;
  }[];
}

const CLARIFAI_API_KEY = process.env.NEXT_PUBLIC_CLARIFAI_PAT || process.env.NEXT_PUBLIC_CLARIFAI_API_KEY;
const FOOD_MODEL_ID = 'bd367be194cf45149e75f01d59f77ba7';
const CUSTOM_MODEL_ID = process.env.NEXT_PUBLIC_CUSTOM_MODEL_ID || '';

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
  source?: string;
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

// base64 문자열을 HTMLImageElement로 변환하는 유틸리티 함수
async function loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
  });
}

// 모델 포맷 자동 감지 및 로딩 함수
async function loadModelAuto(modelPath: string): Promise<tf.GraphModel | tf.LayersModel> {
  // model.json을 먼저 fetch해서 format 확인
  const res = await fetch(modelPath, { cache: 'no-store' });
  if (!res.ok) throw new Error('model.json을 불러올 수 없습니다.');
  const json = await res.json();
  if (json.format === 'graph-model') {
    return await tf.loadGraphModel(modelPath, { fromTFHub: false });
  } else if (json.format === 'layers-model' || json.modelTopology) {
    // format이 없고 modelTopology가 있으면 layers-model로 간주
    return await tf.loadLayersModel(modelPath);
  } else {
    throw new Error('지원하지 않는 모델 포맷입니다: ' + json.format);
  }
}

// Food-101 라벨 캐싱 및 불러오기 함수
let food101Labels: string[] | null = null;
async function getFood101Labels() {
  if (!food101Labels) {
    food101Labels = await fetch('/models/food101/labels.json').then(res => res.json());
  }
  return food101Labels;
}

// Food-101 모델로 예측
let food101Model: tf.GraphModel | tf.LayersModel | null = null;
async function predictWithFood101(base64Image: string): Promise<FoodRecognitionResult[]> {
  try {
    if (!food101Model) {
      await initializeTensorFlow();
      try {
        const modelPath = `${window.location.origin}/models/food101/model.json`;
        console.log('Food-101 모델 로드 시도:', modelPath);
        food101Model = await loadModelAuto(modelPath);
        console.log('Food-101 모델 로드 성공:', food101Model);
      } catch (error) {
        console.error('Food-101 모델 로드 실패:', error);
        throw new Error('Food-101 모델을 로드할 수 없습니다.');
      }
    }

    // base64 -> 이미지 엘리먼트로 변환
    const img = new Image();
    img.src = base64Image;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('이미지 로드 실패'));
    });
    console.log('Food-101 이미지 로드 완료:', img.width, 'x', img.height);

    // 이미지 -> 텐서 변환 및 전처리
    let input = tf.browser.fromPixels(img).toFloat();
    input = tf.image.resizeBilinear(input, [224, 224]);
    
    // 이미지 정규화 (ImageNet 평균값과 표준편차 사용)
    const mean = tf.tensor1d([0.485, 0.456, 0.406]);
    const std = tf.tensor1d([0.229, 0.224, 0.225]);
    input = input.div(255.0);
    input = input.sub(mean).div(std);
    input = input.expandDims(0); // 배치 차원 추가
    
    console.log('Food-101 입력 텐서 shape:', input.shape);

    // 예측
    let predictions: tf.Tensor;
    if ('predict' in food101Model) {
      console.log('Food-101 GraphModel 예측 시작');
      predictions = (food101Model as tf.GraphModel).predict(input) as tf.Tensor;
    } else {
      console.log('Food-101 LayersModel 예측 시작');
      predictions = (food101Model as tf.LayersModel).predict(input) as tf.Tensor;
    }
    console.log('Food-101 예측 텐서 shape:', predictions.shape);

    // 예측 결과 처리
    const data = await predictions.data();
    console.log('Food-101 예측 데이터 (원본):', data);
    
    // 최대값을 찾아 정규화
    const maxValue = Math.max(...Array.from(data));
    const normalizedData = Array.from(data).map(value => value / maxValue);
    console.log('Food-101 예측 데이터 (정규화 후):', normalizedData);
    
    tf.dispose([input, predictions]);

    // 라벨 불러오기
    const labels = await getFood101Labels();
    console.log('Food-101 라벨 로드 완료:', labels);
    if (!labels || labels.length === 0) {
      throw new Error('Food-101 라벨을 불러올 수 없습니다.');
    }

    // 예측 결과와 라벨 매핑 (상위 5개 인덱스만 추출)
    const topIndices = normalizedData
      .map((confidence, index) => ({ confidence, index }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    const results = topIndices.map(({ confidence, index }) => ({
      name: labels[index] ?? `food_${index}`,
      confidence,
      calories: 0,
      portion: '',
      source: 'food101' as const
    }));

    console.log('Food-101 최종 예측 결과:', results);

    if (results.length === 0) {
      throw new Error('Food-101 예측 결과가 없습니다.');
    }

    return results;
  } catch (error) {
    console.error('Food-101 예측 중 오류:', error);
    throw new Error('Food-101 예측 중 오류가 발생했습니다.');
  }
}

// Teachable Machine 모델
let teachableModel: tf.LayersModel | null = null;

// 모델 초기화 함수
async function initializeTeachableModel() {
    if (!teachableModel) {
        try {
            console.log('Teachable Machine 모델 로드 시도');
            const modelPath = `${window.location.origin}/models/teachable/model.json`;
            teachableModel = await tf.loadLayersModel(modelPath);
            console.log('Teachable Machine 모델 로드 성공:', teachableModel);
        } catch (error) {
            console.error('Teachable Machine 모델 로드 실패:', error);
            throw new Error('Teachable Machine 모델을 로드할 수 없습니다.');
        }
    }
    return teachableModel;
}

// Teachable Machine 모델로 예측
async function predictWithTeachableMachine(imageElement: HTMLImageElement): Promise<FoodRecognitionResult[]> {
    try {
        console.log('Teachable Machine 예측 시작');
        
        // 모델 초기화 확인
        if (!teachableModel) {
            await initializeTeachableModel();
        }
        
        if (!teachableModel) {
            throw new Error('Teachable Machine 모델이 초기화되지 않았습니다.');
        }
        
        // 이미지를 텐서로 변환
        const imageTensor = tf.browser.fromPixels(imageElement)
            .resizeBilinear([224, 224])
            .expandDims(0)
            .toFloat()
            .div(255.0);

        // 예측 수행
        const predictions = await teachableModel.predict(imageTensor) as tf.Tensor;
        const predictionArray = await predictions.array() as number[][];
        
        // 텐서 메모리 해제
        tf.dispose([imageTensor, predictions]);

        // 예측 결과를 클래스 이름과 함께 매핑
        const results = predictionArray[0].map((confidence, index) => ({
            name: TEACHABLE_CLASSES[index],
            confidence,
            calories: 0, // DB 매칭 없이 0으로 고정
            portion: '정보 없음',
            source: 'teachable' as const
        }));

        // 신뢰도 기준으로 정렬
        const sortedResults = results.sort((a, b) => b.confidence - a.confidence);

        // 상위 5개 결과만 선택
        const topResults = sortedResults.slice(0, 5);

        console.log('Teachable Machine 예측 성공:', topResults);
        return topResults;

    } catch (error) {
        console.error('Teachable Machine 예측 중 오류 발생:', error);
        throw error;
    }
}

// 두 모델의 결과를 통합
export async function recognizeFood(imageElement: HTMLImageElement): Promise<FoodRecognitionResult[]> {
    try {
        // Teachable Machine으로 예측
        const teachableResults = await predictWithTeachableMachine(imageElement);
        console.log('Teachable Machine 예측 성공:', teachableResults);
        
        if (teachableResults.length === 0) {
            throw new Error('음식 인식 결과가 없습니다.');
        }
        
        return teachableResults;
    } catch (error) {
        console.error('Teachable Machine 예측 실패:', error);
        throw new Error('음식 인식에 실패했습니다.');
    }
}

export function calculatePortionCalories(baseCalories: number, portionSize: number) {
  // portionSize는 1이 기본 1인분
  return Math.round(baseCalories * portionSize);
}