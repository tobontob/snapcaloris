export interface FoodItem {
    name: string;        // 식품명
    calories: number;    // 에너지(kcal)
    serving_size: string; // 영양성분함량기준량
}

export interface FoodDatabase {
    foods: FoodItem[];
}

// 음식 데이터베이스 타입
export type FoodDB = FoodItem[];

// 음식 검색 결과 타입
export interface FoodSearchResult {
    name: string;
    calories: number;
    serving_size: string;
    similarity?: number;  // 유사도 점수 (선택적)
}

export interface FoodData {
    name: string;
    calories: number;
    serving_size: string;
}

export interface ProcessedFoodData extends FoodData {
    manufacturer?: string;
    barcode?: string;
}

// 음식 인식 결과 타입
export interface FoodRecognitionResult {
    name: string;
    confidence: number;
    calories: number;
    portion: string;
    source: 'food101' | 'teachable';
} 