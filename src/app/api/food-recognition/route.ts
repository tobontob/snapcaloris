import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { base64Image } = data;

    // 입력 데이터 검증
    if (!base64Image) {
      console.error('이미지 데이터가 없습니다.');
      return NextResponse.json(
        { error: '이미지 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // base64 데이터 추출
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) {
      console.error('잘못된 base64 이미지 형식입니다.');
      return NextResponse.json(
        { error: '잘못된 이미지 형식입니다.' },
        { status: 400 }
      );
    }

    const PAT = process.env.NEXT_PUBLIC_CLARIFAI_PAT;
    if (!PAT) {
      console.error('Clarifai API 키가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Clarifai API 설정
    const USER_ID = 'clarifai';
    const APP_ID = 'main';
    const MODEL_ID = 'food-item-recognition';
    const MODEL_VERSION_ID = '1d5fd481e0cf4826aa72ec3ff049e044';
    
    const raw = JSON.stringify({
      "user_app_id": {
        "user_id": USER_ID,
        "app_id": APP_ID
      },
      "inputs": [
        {
          "data": {
            "image": {
              "base64": base64Data
            }
          }
        }
      ]
    });

    console.log('Clarifai API 요청 준비:', {
      modelId: MODEL_ID,
      modelVersionId: MODEL_VERSION_ID,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Key ${PAT}`,
      }
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Key ${PAT}`,
        'Content-Type': 'application/json'
      },
      body: raw
    };

    const response = await fetch(
      `https://api.clarifai.com/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`,
      requestOptions
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Clarifai API 에러:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      return NextResponse.json(
        { 
          error: '음식 인식 API 호출 실패', 
          details: errorData,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Clarifai API 응답:', result);

    if (!result.outputs?.[0]?.data?.concepts) {
      console.error('잘못된 API 응답 형식:', result);
      return NextResponse.json(
        { error: '잘못된 API 응답 형식' },
        { status: 500 }
      );
    }

    // 결과 데이터 정제
    const concepts = result.outputs[0].data.concepts;
    const topPredictions = concepts
      .filter((concept: any) => concept.value > 0.5)  // 50% 이상의 확률만 선택
      .map((concept: any) => ({
        name: concept.name,
        probability: Math.round(concept.value * 100) / 100
      }));

    return NextResponse.json({ predictions: topPredictions });
  } catch (error) {
    console.error('음식 인식 처리 중 오류:', error);
    return NextResponse.json(
      { error: '음식 인식 중 오류가 발생했습니다.', details: error },
      { status: 500 }
    );
  }
} 