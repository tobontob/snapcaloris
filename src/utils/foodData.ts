import { FoodData, ProcessedFoodData } from '@/types/food';

let foodDataCache: FoodData[] | null = null;
let processedFoodDataCache: ProcessedFoodData[] | null = null;

// 음식 데이터 로드
export async function loadFoodData(): Promise<FoodData[]> {
    if (foodDataCache) {
        return foodDataCache;
    }

    try {
        const response = await fetch('/data/food_db.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        foodDataCache = data;
        return data;
    } catch (error) {
        console.error('음식 데이터 로드 실패:', error);
        return [];
    }
}

// 가공식품 데이터 로드
export async function loadProcessedFoodData(): Promise<ProcessedFoodData[]> {
    if (processedFoodDataCache) {
        return processedFoodDataCache;
    }

    try {
        const response = await fetch('/data/processed_food_db.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        processedFoodDataCache = data;
        return data;
    } catch (error) {
        console.error('가공식품 데이터 로드 실패:', error);
        return [];
    }
}

// 음식 검색 함수
export function searchFoods(foods: FoodData[], query: string): FoodData[] {
    const searchResults: FoodData[] = [];
    const searchQuery = query.toLowerCase();

    for (const food of foods) {
        if (food.name.toLowerCase().includes(searchQuery)) {
            searchResults.push(food);
        }
    }

    return searchResults;
}

// 칼로리 범위로 음식 검색
export function searchFoodsByCalories(foods: FoodData[], minCalories: number, maxCalories: number): FoodData[] {
    return foods
        .filter(food => food.calories >= minCalories && food.calories <= maxCalories);
}

// 음식 이름으로 정확히 매칭하는 함수
export async function findExactFoodMatch(foodName: string): Promise<FoodData | ProcessedFoodData | null> {
    try {
        if (!foodName || typeof foodName !== 'string') {
            return null;
        }
        // 일반 음식 데이터에서 검색
        const foodData = await loadFoodData();
        const foodMatch = foodData.find(food => 
            typeof food.name === 'string' && food.name.toLowerCase() === foodName.toLowerCase()
        );
        
        if (foodMatch) {
            return foodMatch;
        }

        // 가공식품 데이터에서 검색
        const processedFoodData = await loadProcessedFoodData();
        const processedMatch = processedFoodData.find(food => 
            typeof food.name === 'string' && food.name.toLowerCase() === foodName.toLowerCase()
        );

        return processedMatch || null;
    } catch (error) {
        console.error('음식 검색 중 오류 발생:', error);
        return null;
    }
}

export async function searchFoodData(query: string): Promise<(FoodData | ProcessedFoodData)[]> {
    try {
        const foodData = await loadFoodData();
        const processedFoodData = await loadProcessedFoodData();
        
        const searchTerm = query.toLowerCase();
        
        const foodResults = foodData.filter(food => 
            food.name.toLowerCase().includes(searchTerm)
        );
        
        const processedResults = processedFoodData.filter(food => 
            food.name.toLowerCase().includes(searchTerm)
        );
        
        return [...foodResults, ...processedResults];
    } catch (error) {
        console.error('음식 검색 중 오류 발생:', error);
        return [];
    }
} 