import React, { useState } from 'react';
import { classifyFood, FoodInfo } from '@/lib/food-recognition';
import Image from 'next/image';

export default function FoodRecognition() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [foodInfo, setFoodInfo] = useState<FoodInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);
      setFoodInfo(null);

      // 이미지 미리보기 설정
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);

      // 음식 인식 수행
      const result = await classifyFood(file);
      setFoodInfo(result);

    } catch (error: any) {
      setError(error.message || '음식 인식 중 오류가 발생했습니다.');
      console.error('음식 인식 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-2xl mx-auto">
      <div className="w-full">
        <label 
          htmlFor="imageUpload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">클릭하여 이미지 업로드</span>
            </p>
            <p className="text-xs text-gray-500">PNG, JPG (MAX. 10MB)</p>
          </div>
          <input
            id="imageUpload"
            type="file"
            className="hidden"
            accept="image/png, image/jpeg"
            onChange={handleImageUpload}
          />
        </label>
      </div>

      {isLoading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">음식을 분석하고 있습니다...</p>
        </div>
      )}

      {error && (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {selectedImage && !isLoading && !error && (
        <div className="w-full">
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={selectedImage}
              alt="Selected food"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {foodInfo && !isLoading && !error && (
        <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">분석 결과</h3>
          <div className="space-y-2">
            <p className="text-lg">
              <span className="font-semibold">음식:</span> {foodInfo.name}
            </p>
            <p className="text-lg">
              <span className="font-semibold">정확도:</span> {Math.round(foodInfo.probability * 100)}%
            </p>
            <p className="text-lg">
              <span className="font-semibold">칼로리:</span> {foodInfo.calories > 0 ? `${foodInfo.calories}kcal` : '정보 없음'}
            </p>
            <p className="text-lg">
              <span className="font-semibold">기준 분량:</span> {foodInfo.portion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 