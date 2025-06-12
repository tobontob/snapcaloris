import { motion } from "framer-motion";

export default function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-40"
    >
      <div className="animate-spin rounded-full h-16 w-16 sm:h-12 sm:w-12 border-4 border-blue-400 border-t-transparent mb-8"></div>
      <div className="text-2xl sm:text-lg font-semibold text-white drop-shadow-lg mb-2 text-center">
        AI가 열심히 음식 사진을 분석하고 있어요!
      </div>
      <div className="text-lg sm:text-base text-blue-100 text-center">
        조금만 기다려 주세요, 맛있는 결과를 준비 중입니다 🍔🍕
      </div>
    </motion.div>
  );
} 