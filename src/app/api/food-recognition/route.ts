import { NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs-node';

// Food-101 모델 로드
let food101Model: tf.GraphModel | null = null;

async function loadFood101Model() {
  if (!food101Model) {
    food101Model = await tf.loadGraphModel('file:///models/food101/model.json');
  }
  return food101Model;
}

// Teachable Machine 모델 로드
let teachableModel: tf.GraphModel | null = null;

async function loadTeachableModel() {
  if (!teachableModel) {
    teachableModel = await tf.loadGraphModel('file:///models/teachable/model.json');
  }
  return teachableModel;
}

// 이미지 전처리 함수
async function preprocessImage(base64Image: string) {
  // base64 이미지를 텐서로 변환
  const imageBuffer = Buffer.from(base64Image, 'base64');
  const image = await tf.node.decodeImage(imageBuffer);
  
  // 이미지 크기 조정 및 정규화
  const resized = tf.image.resizeBilinear(image, [224, 224]);
  const normalized = resized.div(255.0);
  
  // 배치 차원 추가
  const batched = normalized.expandDims(0);
  
  return batched;
}

// Food-101 모델로 예측
export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: '이미지가 제공되지 않았습니다.' }, { status: 400 });
    }

    // 이미지 전처리
    const preprocessedImage = await preprocessImage(image);
    
    // Food-101 모델 로드
    const model = await loadFood101Model();
    
    // 예측
    const predictions = await model.predict(preprocessedImage) as tf.Tensor;
    const results = await predictions.data();
    
    // 결과 정리
    const food101Results = Array.from(results).map((confidence, index) => ({
      label: `food_${index}`, // 실제 라벨로 대체 필요
      confidence: confidence
    })).sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // 상위 5개 결과만 반환
    
    return NextResponse.json({ predictions: food101Results });
  } catch (error: any) {
    console.error('Food-101 예측 중 오류:', error);
    return NextResponse.json(
      { error: error.message || 'Food-101 예측 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 