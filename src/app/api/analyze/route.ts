import { NextResponse } from 'next/server';
import { findExactFoodMatch } from '@/utils/foodData';
import { analyzeImage } from '@/utils/imageAnalysis';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        
        if (!image) {
            return NextResponse.json(
                { error: '이미지가 필요합니다.' },
                { status: 400 }
            );
        }

        // 이미지 분석 수행
        const analysisResult = await analyzeImage(image);
        
        if (!analysisResult.success) {
            return NextResponse.json({
                success: false,
                message: '이미지 분석에 실패했습니다.',
                error: analysisResult.error
            });
        }

        // 분석된 음식 이름으로 데이터베이스 검색
        const foodMatch = await findExactFoodMatch(analysisResult.foodName);
        
        if (foodMatch) {
            return NextResponse.json({
                success: true,
                food: foodMatch,
                confidence: foodMatch.similarity || analysisResult.confidence
            });
        } else {
            return NextResponse.json({
                success: false,
                message: '매칭되는 음식을 찾을 수 없습니다.',
                analyzedName: analysisResult.foodName
            });
        }

    } catch (error) {
        console.error('이미지 분석 중 오류 발생:', error);
        return NextResponse.json(
            { error: '이미지 분석 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
} 