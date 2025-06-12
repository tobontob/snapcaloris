'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ImageUpload from '@/components/ImageUpload';
import { classifyFood, type FoodInfo } from '@/lib/food-recognition';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function Home() {
  const [foodInfo, setFoodInfo] = useState<FoodInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedImage(URL.createObjectURL(file));
      const result = await classifyFood(file);
      setFoodInfo(result);
    } catch (err) {
      setError('음식을 분석하는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 말풍선 위치와 스타일을 모바일/데스크탑에 맞게 개선
  const balloonPositions = useMemo(() => {
    // 이미지 기준 상대 위치 (상, 하, 좌, 우 가장자리, 중심부 피함)
    return [
      { top: '8%', left: '50%', transform: 'translate(-50%, 0)', zIndex: 10 }, // 칼로리(상단)
      { bottom: '8%', left: '55%', transform: 'translate(-50%, 0)', zIndex: 10 }, // 음식명(하단)
      { top: '50%', left: '8%', transform: 'translate(0, -50%)', zIndex: 10 }, // 음식량(좌측)
      { top: '60%', right: '8%', transform: 'translate(0, -50%)', zIndex: 10 }, // 정확도(우측)
    ];
  }, [foodInfo]);

  // 만화 스타일 말풍선 (꼬리 포함, 그림자, 테두리 강조, 더 둥글게)
  const balloonStyles = [
    'px-6 py-3 text-xl sm:text-base bg-yellow-200 shadow-xl rounded-full border-4 border-yellow-400 comic-balloon before:content-[""] before:absolute before:bottom-[-18px] before:left-1/2 before:-translate-x-1/2 before:w-6 before:h-6 before:bg-yellow-200 before:rounded-br-full before:border-b-4 before:border-r-4 before:border-yellow-400', // 칼로리(상단)
    'px-5 py-2 text-lg sm:text-sm bg-blue-200 shadow-xl rounded-full border-4 border-blue-400 comic-balloon before:content-[""] before:absolute before:top-[-18px] before:left-1/2 before:-translate-x-1/2 before:w-6 before:h-6 before:bg-blue-200 before:rounded-tl-full before:border-t-4 before:border-l-4 before:border-blue-400', // 음식명(하단)
    'px-4 py-2 text-base sm:text-xs bg-purple-200 shadow-xl rounded-full border-4 border-purple-400 comic-balloon before:content-[""] before:absolute before:top-1/2 before:right-[-18px] before:-translate-y-1/2 before:w-6 before:h-6 before:bg-purple-200 before:rounded-tr-full before:border-t-4 before:border-r-4 before:border-purple-400', // 음식량(좌측)
    'px-3 py-1 text-sm sm:text-xs bg-green-200 shadow-xl rounded-full border-4 border-green-400 comic-balloon before:content-[""] before:absolute before:top-1/2 before:left-[-18px] before:-translate-y-1/2 before:w-6 before:h-6 before:bg-green-200 before:rounded-bl-full before:border-b-4 before:border-l-4 before:border-green-400', // 정확도(우측)
  ];

  // 업로드 초기화 핸들러
  const handleReset = () => {
    setFoodInfo(null);
    setSelectedImage(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 py-12 px-4 overflow-x-hidden">
      {isLoading && <LoadingOverlay />}
      <div className="max-w-4xl mx-auto overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            CaloriSnap
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            음식 사진을 업로드하면 AI가 자동으로 음식을 인식하고 칼로리를 계산해드립니다!
          </p>
        </motion.div>
        <div className="max-w-2xl mx-auto space-y-8 overflow-x-hidden">
          {/* 업로드 박스: 분석 결과가 없을 때만 표시 */}
          {!(foodInfo && selectedImage && !isLoading) && (
            <ImageUpload onImageSelect={handleImageSelect} />
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-100 text-red-700 rounded-lg text-center"
            >
              {error}
            </motion.div>
          )}
          {/* 분석 결과: 업로드 박스 대신 표시 */}
          {foodInfo && selectedImage && !isLoading && (
            <div className="relative w-full flex flex-col items-center justify-center mt-8 overflow-x-hidden">
              <div className="relative w-80 h-80 sm:w-48 sm:h-48 md:w-80 md:h-80 max-w-full mx-auto overflow-x-visible">
                {/* 음식 이미지 */}
                <img
                  src={selectedImage}
                  alt={foodInfo.name}
                  className="object-contain w-full h-full rounded-2xl border-4 border-white shadow-xl max-w-full"
                  style={{ background: '#fff' }}
                />
                {/* 만화 스타일 말풍선들 */}
                {/* 칼로리 */}
                <div
                  className={`absolute ${balloonStyles[0]} flex items-center justify-center`} 
                  style={balloonPositions[0]}
                >
                  {foodInfo.calories} kcal
                </div>
                {/* 음식명 */}
                <div
                  className={`absolute ${balloonStyles[1]} flex items-center justify-center`} 
                  style={balloonPositions[1]}
                >
                  {foodInfo.name}
                </div>
                {/* 음식량 */}
                <div
                  className={`absolute ${balloonStyles[2]} flex items-center justify-center`} 
                  style={balloonPositions[2]}
                >
                  {foodInfo.portion}
                </div>
                {/* 정확도 */}
                <div
                  className={`absolute ${balloonStyles[3]} flex items-center justify-center`} 
                  style={balloonPositions[3]}
                >
                  정확도 {Math.round(foodInfo.probability * 100)}%
                </div>
              </div>
              {/* 다른 음식 칼로리 측정하기 버튼 */}
              <button
                onClick={handleReset}
                className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border-4 border-white outline-none focus:ring-4 focus:ring-blue-200 sm:px-5 sm:py-2 sm:text-base"
              >
                🍽️ 다른 음식 칼로리 측정하기
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 