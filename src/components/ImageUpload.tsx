import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { motion } from 'framer-motion';

type ImageUploadProps = {
  onImageSelect: (file: File) => void;
  maxSize?: number;
};

export default function ImageUpload({ onImageSelect, maxSize = 5 * 1024 * 1024 }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (file.size > maxSize) {
      setError(`파일 크기는 ${maxSize / (1024 * 1024)}MB 이하여야 합니다.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onImageSelect(file);
  }, [maxSize, onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
          transition-colors duration-200 ease-in-out`}
        {...getRootProps()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="relative w-full aspect-video">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-600">
              {isDragActive
                ? "여기에 이미지를 놓아주세요!"
                : "이미지를 드래그하거나 클릭하여 업로드하세요"}
            </p>
            <p className="text-sm text-gray-500">
              (최대 {maxSize / (1024 * 1024)}MB)
            </p>
          </div>
        )}
      </motion.div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-red-500 text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
} 