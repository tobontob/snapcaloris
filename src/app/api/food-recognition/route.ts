import { NextResponse } from 'next/server';

const CLARIFAI_USER_ID = 'clarifai';
const CLARIFAI_APP_ID = 'main';
const DEFAULT_MODEL_ID = 'food-item-recognition';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base64Image } = body;

    if (!base64Image) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 });
    }

    const CLARIFAI_PAT = process.env.NEXT_PUBLIC_CLARIFAI_PAT;
    const CUSTOM_MODEL_ID = process.env.NEXT_PUBLIC_CUSTOM_MODEL_ID;
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

    // Clarifai 기본 모델 요청
    const defaultModelPromise = fetch(
      `https://api.clarifai.com/v2/models/${DEFAULT_MODEL_ID}/outputs`,
      requestOptions
    ).then(async (res) => {
      const result = await res.json();
      return {
        ok: res.ok,
        predictions: result.outputs?.[0]?.data?.concepts?.map((concept: any) => ({
          name: concept.name,
          probability: concept.value,
          source: 'clarifai'
        })) || [],
        error: result.status?.description
      };
    });

    // 커스텀 모델 요청 (ID가 있을 때만)
    let customModelPromise = Promise.resolve({ ok: false, predictions: [], error: null });
    if (CUSTOM_MODEL_ID) {
      customModelPromise = fetch(
        `https://api.clarifai.com/v2/models/${CUSTOM_MODEL_ID}/outputs`,
        requestOptions
      ).then(async (res) => {
        const result = await res.json();
        return {
          ok: res.ok,
          predictions: result.outputs?.[0]?.data?.concepts?.map((concept: any) => ({
            name: concept.name,
            probability: concept.value,
            source: 'custom'
          })) || [],
          error: result.status?.description
        };
      });
    }

    // 두 모델 결과 병렬 요청
    const [defaultResult, customResult] = await Promise.all([defaultModelPromise, customModelPromise]);

    // 에러 처리: 둘 다 실패 시
    if (!defaultResult.ok && !customResult.ok) {
      return NextResponse.json({ error: defaultResult.error || customResult.error || 'Clarifai API 호출 실패' }, { status: 500 });
    }

    // 결과 합치기 및 확률순 정렬
    const allPredictions = [...defaultResult.predictions, ...customResult.predictions]
      .sort((a, b) => b.probability - a.probability);

    if (!allPredictions.length) {
      return NextResponse.json({ error: '음식을 인식할 수 없습니다.' }, { status: 400 });
    }

    return NextResponse.json({ predictions: allPredictions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Clarifai API 호출 실패' }, { status: 500 });
  }
} 