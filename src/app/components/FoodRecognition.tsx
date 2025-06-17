import React, { useState } from 'react';
import { recognizeFood, FoodRecognitionResult } from '@/lib/food-recognition';
import Image from 'next/image';

type FoodInfo = FoodRecognitionResult;

export default function FoodRecognition() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foodInfo, setFoodInfo] = useState<FoodInfo | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setFoodInfo(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // 파일을 base64로 변환
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          // base64 문자열을 HTMLImageElement로 변환
          const img = new window.Image();
          img.src = base64Image;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          const results = await recognizeFood(img);
          
          if (results.length > 0) {
            const bestMatch = results[0];
            setFoodInfo(bestMatch);
          } else {
            setError('음식을 인식할 수 없습니다. 다른 이미지를 시도해보세요.');
          }
        } catch (error: any) {
          setError(error.message || '음식 인식 중 오류가 발생했습니다.');
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setError('이미지 파일을 읽는 중 오류가 발생했습니다.');
        setIsLoading(false);
      };
    } catch (error: any) {
      setError(error.message || '음식 인식 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center justify-center w-full">
          <label
            htmlFor="food-image"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-4 text-gray-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭
              </p>
              <p className="text-xs text-gray-500">PNG, JPG 또는 JPEG (최대 10MB)</p>
            </div>
            <input
              id="food-image"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {previewUrl && (
          <div className="mt-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedFile || isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? '분석 중...' : '음식 분석하기'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {foodInfo && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">분석 결과</h2>
          <div className="space-y-2">
            <p className="text-lg">
              <span className="font-semibold">음식 이름:</span> {foodInfo.name}
            </p>
            <p className="text-lg">
              <span className="font-semibold">정확도:</span>{' '}
              {(foodInfo.confidence * 100).toFixed(1)}%
            </p>
            <p className="text-lg">
              <span className="font-semibold">칼로리:</span>{' '}
              {foodInfo.calories > 0 ? `${foodInfo.calories}kcal` : '정보 없음'}
            </p>
            <p className="text-lg">
              <span className="font-semibold">기준 분량:</span> {foodInfo.portion}
            </p>
            <p className="text-lg">
              <span className="font-semibold">인식 모델:</span>{' '}
              {foodInfo.source === 'food101' ? 'Food-101 모델' : 'Teachable Machine 모델'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 