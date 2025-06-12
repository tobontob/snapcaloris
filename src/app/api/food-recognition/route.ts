import { NextResponse } from 'next/server';

const CLARIFAI_PAT = process.env.CLARIFAI_PAT;
const CLARIFAI_USER_ID = 'clarifai';
const CLARIFAI_APP_ID = 'main';
// food-items-v1-detection 모델 사용
const MODEL_ID = 'food-item-v1-recognition';
const MODEL_VERSION_ID = '1d5fd481e0cf4826aa72ec3ff049e044';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base64Image } = body;

    if (!base64Image) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 });
    }

    if (!CLARIFAI_PAT) {
      return NextResponse.json({ error: 'Clarifai API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    // base64 데이터에서 실제 이미지 데이터만 추출
    const imageData = base64Image.split(',')[1] || base64Image;

    const raw = JSON.stringify({
      "user_app_id": {
        "user_id": CLARIFAI_USER_ID,
        "app_id": CLARIFAI_APP_ID
      },
      "inputs": [
        {
          "data": {
            "image": {
              "base64": imageData
            }
          }
        }
      ]
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Key ' + CLARIFAI_PAT
      },
      body: raw
    };

    console.log('Clarifai API 호출 시작...');
    const response = await fetch(
      `https://api.clarifai.com/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`,
      requestOptions
    );
    console.log('Clarifai API 호출 완료');

    const result = await response.json();
    console.log('Clarifai 응답:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(result.status?.description || 'Clarifai API 호출 실패');
    }

    const predictions = result.outputs?.[0]?.data?.concepts?.map((concept: any) => ({
      name: concept.name,
      probability: concept.value
    })) || [];

    return NextResponse.json({ predictions });

  } catch (error: any) {
    console.error('음식 인식 에러:', error);
    return NextResponse.json(
      { error: error.message || 'Clarifai API 호출 실패' },
      { status: 500 }
    );
  }
} 