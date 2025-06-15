import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { findFoodInDatabase, type FoodData } from './food-database';
import * as tf from '@tensorflow/tfjs';

// 음식 인식 결과 타입 정의
export interface FoodRecognitionResult {
  name: string;
  confidence: number;
  calories: number;
  portion: string;
  source: 'food101' | 'teachable';
}

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

    // 이미지 -> 텐서 변환
    let input = tf.browser.fromPixels(img).toFloat();
    input = tf.image.resizeBilinear(input, [224, 224]);
    input = input.div(255.0);
    input = input.expandDims(0); // 배치 차원 추가

    // 예측
    let predictions: tf.Tensor;
    if ('predict' in food101Model) {
      predictions = (food101Model as tf.GraphModel).predict(input) as tf.Tensor;
    } else {
      predictions = (food101Model as tf.LayersModel).predict(input) as tf.Tensor;
    }
    const data = await predictions.data();
    tf.dispose([input, predictions]);

    // 라벨 불러오기
    const labels = await getFood101Labels();

    // 결과 매핑 (음식명 적용, null 안전 처리)
    const results = Array.from(data).map((confidence, index) => ({
      name: labels ? labels[index] ?? `food_${index}` : `food_${index}`,
      confidence: confidence,
      calories: 0,
      portion: '',
      source: 'food101' as const
    })).sort((a, b) => b.confidence - a.confidence).slice(0, 5);

    return results;
  } catch (error) {
    console.error('Food-101 예측 중 오류:', error);
    return [];
  }
}

// Teachable Machine 라벨 자동 로딩 함수
let teachableLabels: string[] | null = null;
async function getTeachableLabels() {
  if (!teachableLabels) {
    teachableLabels = await fetch('/models/teachable/metadata.json')
      .then(res => res.json())
      .then(meta => meta.labels);
  }
  return teachableLabels;
}

// Teachable Machine 모델로 예측
let teachableModel: tf.GraphModel | tf.LayersModel | null = null;
async function predictWithTeachable(base64Image: string): Promise<FoodRecognitionResult[]> {
  try {
    if (!teachableModel) {
      await initializeTensorFlow();
      try {
        const modelPath = `${window.location.origin}/models/teachable/model.json`;
        console.log('Teachable Machine 모델 로드 시도:', modelPath);
        teachableModel = await loadModelAuto(modelPath);
        console.log('Teachable Machine 모델 로드 성공:', teachableModel);
      } catch (error) {
        console.error('Teachable Machine 모델 로드 실패:', error);
        throw new Error('Teachable Machine 모델을 로드할 수 없습니다.');
      }
    }
    // base64 -> 이미지 엘리먼트로 변환
    const img = await loadImageFromBase64(base64Image);
    // 전처리: 반드시 224x224로 리사이즈
    let input = tf.browser.fromPixels(img).toFloat();
    input = tf.image.resizeBilinear(input, [224, 224]);
    input = input.div(tf.scalar(255));
    input = input.expandDims(0); // 배치 차원 추가
    // 예측
    const prediction = (teachableModel as tf.LayersModel).predict(input) as tf.Tensor;
    const data = await prediction.data();
    tf.dispose([input, prediction]);
    // 라벨 동적 매핑
    const labels = await getTeachableLabels();
    const results = Array.from(data).map((confidence, index) => ({
      name: labels ? labels[index] ?? `class_${index}` : `class_${index}`,
      confidence: confidence,
      calories: 0,
      portion: '',
      source: 'teachable' as const
    })).sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    return results;
  } catch (error) {
    console.error('Teachable Machine 예측 중 오류:', error);
    throw new Error('Teachable Machine 예측 중 오류가 발생했습니다.');
  }
}

// 두 모델의 결과를 통합
export async function recognizeFood(base64Image: string): Promise<FoodRecognitionResult[]> {
  try {
    // Food-101 먼저 실행
    const food101Results = await predictWithFood101(base64Image);
    // Teachable Machine 그 다음 실행
    const teachableResults = await predictWithTeachable(base64Image);
    // 결과 통합 및 정렬
    const combinedResults = [...food101Results, ...teachableResults]
      .sort((a, b) => b.confidence - a.confidence);
    return combinedResults;
  } catch (error) {
    console.error('음식 인식 중 오류:', error);
    return [];
  }
}

export function calculatePortionCalories(baseCalories: number, portionSize: number) {
  // portionSize는 1이 기본 1인분
  return Math.round(baseCalories * portionSize);
}