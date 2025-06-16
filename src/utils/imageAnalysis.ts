export async function analyzeImage(image: File): Promise<{
  success: boolean;
  foodName?: string;
  confidence?: number;
  error?: string;
}> {
  // 실제 AI 분석 로직을 여기에 구현해야 합니다.
  // 임시로 성공 결과를 반환합니다.
  return {
    success: true,
    foodName: '샘플음식',
    confidence: 0.95,
  };
} 