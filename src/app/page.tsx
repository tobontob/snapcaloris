'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ImageUpload from '@/components/ImageUpload';
import { classifyFood, type FoodInfo } from '@/lib/food-recognition';

export default function Home() {
  const [foodInfo, setFoodInfo] = useState<FoodInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await classifyFood(file);
      setFoodInfo(result);
    } catch (err) {
      setError('음식을 분석하는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
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

        <div className="max-w-2xl mx-auto space-y-8">
          <ImageUpload onImageSelect={handleImageSelect} />

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">음식을 분석하고 있습니다...</p>
            </motion.div>
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

          {foodInfo && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                분석 결과
              </h2>
              <div className="space-y-3">
                <p className="text-lg">
                  <span className="font-medium">음식:</span>{' '}
                  <span className="text-blue-600">{foodInfo.name}</span>
                </p>
                <p className="text-lg">
                  <span className="font-medium">양:</span>{' '}
                  <span className="text-purple-600">{foodInfo.portion}</span>
                </p>
                <p className="text-lg">
                  <span className="font-medium">칼로리:</span>{' '}
                  <span className="text-blue-600">{foodInfo.calories} kcal</span>
                </p>
                <p className="text-sm text-gray-500">
                  정확도: {Math.round(foodInfo.probability * 100)}%
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
} 