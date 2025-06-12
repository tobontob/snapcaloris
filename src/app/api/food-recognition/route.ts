import { NextResponse } from 'next/server';

const CLARIFAI_USER_ID = 'clarifai';
const CLARIFAI_APP_ID = 'main';
const MODEL_ID = 'food-item-recognition';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base64Image } = body;

    if (!base64Image) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 });
    }

    const CLARIFAI_PAT = process.env.NEXT_PUBLIC_CLARIFAI_PAT;
    if (!CLARIFAI_PAT) {
      return NextResponse.json({ error: 'Clarifai API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

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

    const response = await fetch(
      `https://api.clarifai.com/v2/models/${MODEL_ID}/outputs`,
      requestOptions
    );
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: result.status?.description || 'Clarifai API 호출 실패' }, { status: 500 });
    }

    const predictions = result.outputs?.[0]?.data?.concepts?.map((concept: any) => ({
      name: concept.name,
      probability: concept.value
    })) || [];

    if (!predictions.length) {
      return NextResponse.json({ error: '음식을 인식할 수 없습니다.' }, { status: 400 });
    }

    return NextResponse.json({ predictions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Clarifai API 호출 실패' }, { status: 500 });
  }
} 