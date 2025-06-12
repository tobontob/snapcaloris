export interface FoodData {
  name: string;
  calories: number;
  keywords?: string[];
  portion?: string;
  cuisine?: string;
}

export const foodDatabase: { [key: string]: FoodData } = {
  "rice": {
    name: "밥",
    calories: 130,
    keywords: ["rice", "white rice", "cooked rice"],
    portion: "1공기"
  },
  "kimchi": {
    name: "김치",
    calories: 15,
    keywords: ["kimchi", "fermented cabbage"],
    portion: "100g"
  },
  "bibimbap": {
    name: "비빔밥",
    calories: 500,
    keywords: ["bibimbap", "mixed rice", "korean rice bowl"],
    portion: "1인분"
  },
  "ramen": {
    name: "라면",
    calories: 500,
    keywords: ["ramen", "ramyeon", "noodle soup", "instant noodles"],
    portion: "1봉지"
  },
  "kimbap": {
    name: "김밥",
    calories: 320,
    keywords: ["kimbap", "gimbap", "korean roll"],
    portion: "1줄"
  },
  "chicken": {
    name: "치킨",
    calories: 300,
    keywords: ["chicken", "fried chicken", "roasted chicken"],
    portion: "100g"
  },
  "pizza": {
    name: "피자",
    calories: 250,
    keywords: ["pizza", "cheese pizza"],
    portion: "1조각"
  },
  "hamburger": {
    name: "햄버거",
    calories: 400,
    keywords: ["hamburger", "burger", "cheeseburger"],
    portion: "1개"
  },
  "salad": {
    name: "샐러드",
    calories: 100,
    keywords: ["salad", "green salad", "vegetable salad"],
    portion: "1인분"
  },
  "sushi": {
    name: "초밥",
    calories: 40,
    keywords: ["sushi", "nigiri", "raw fish"],
    portion: "1피스"
  },
  "tteokbokki": {
    name: "떡볶이",
    calories: 300,
    keywords: ["tteokbokki", "rice cake", "spicy rice cake"],
    portion: "1인분"
  },
  "samgyeopsal": {
    name: "삼겹살",
    calories: 400,
    keywords: ["samgyeopsal", "pork belly", "grilled pork"],
    portion: "100g"
  },
  "jajangmyeon": {
    name: "짜장면",
    calories: 600,
    keywords: ["jajangmyeon", "black bean noodles", "chinese noodles"],
    portion: "1인분"
  },
  "curry": {
    name: "카레",
    calories: 400,
    keywords: ["curry", "curry rice", "japanese curry"],
    portion: "1인분"
  },
  "sandwich": {
    name: "샌드위치",
    calories: 300,
    keywords: ["sandwich", "bread"],
    portion: "1개"
  }
};

export function findFoodInDatabase(foodName: string): FoodData | null {
  const normalizedName = foodName.toLowerCase();
  
  // 정확한 매칭 검색
  if (foodDatabase[normalizedName]) {
    return foodDatabase[normalizedName];
  }

  // 키워드 검색
  for (const [key, food] of Object.entries(foodDatabase)) {
    if (food.keywords?.some(keyword => 
      normalizedName.includes(keyword.toLowerCase()) || 
      keyword.toLowerCase().includes(normalizedName)
    )) {
      return food;
    }
  }

  return null;
} 