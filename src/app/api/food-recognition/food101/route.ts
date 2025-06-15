import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ message: '이제 프론트엔드에서 tfjs로 직접 예측하세요.' }, { status: 200 });
} 