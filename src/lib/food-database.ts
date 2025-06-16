export interface FoodData {
  name: string;
  calories: number;
  keywords?: string[];
  portion?: string;
  cuisine?: string;
}

export const foodDatabase: FoodData[] = [
  // 한식
  { name: '비빔밥', calories: 560, portion: '1그릇(400g)', cuisine: '한식' },
  { name: '불고기', calories: 310, portion: '100g', cuisine: '한식' },
  { name: '김치찌개', calories: 210, portion: '1그릇(300g)', cuisine: '한식' },
  { name: '된장찌개', calories: 180, portion: '1그릇(300g)', cuisine: '한식' },
  { name: '삼겹살', calories: 518, portion: '100g', cuisine: '한식' },
  { name: '잡채', calories: 250, portion: '1접시(200g)', cuisine: '한식' },
  { name: '떡볶이', calories: 350, portion: '1인분(200g)', cuisine: '한식' },
  { name: '갈비탕', calories: 430, portion: '1그릇(500g)', cuisine: '한식' },
  { name: '김밥', calories: 320, portion: '1줄', cuisine: '한식' },
  { name: '냉면', calories: 460, portion: '1그릇(500g)', cuisine: '한식' },
  // 양식
  { name: '스파게티', calories: 370, portion: '1접시(250g)', cuisine: '양식' },
  { name: '피자', calories: 266, portion: '1조각(107g)', cuisine: '양식' },
  { name: '햄버거', calories: 295, portion: '1개', cuisine: '양식' },
  { name: '샐러드', calories: 150, portion: '1접시(200g)', cuisine: '양식' },
  { name: '스테이크', calories: 400, portion: '150g', cuisine: '양식' },
  { name: '감자튀김', calories: 312, portion: '100g', cuisine: '양식' },
  // 중식
  { name: '짜장면', calories: 700, portion: '1그릇(600g)', cuisine: '중식' },
  { name: '짬뽕', calories: 600, portion: '1그릇(600g)', cuisine: '중식' },
  { name: '탕수육', calories: 350, portion: '100g', cuisine: '중식' },
  { name: '마파두부', calories: 200, portion: '1접시(200g)', cuisine: '중식' },
  { name: '볶음밥', calories: 520, portion: '1그릇(400g)', cuisine: '중식' },
  // 일식
  { name: '초밥', calories: 350, portion: '10개(200g)', cuisine: '일식' },
  { name: '우동', calories: 420, portion: '1그릇(500g)', cuisine: '일식' },
  { name: '라멘', calories: 500, portion: '1그릇(550g)', cuisine: '일식' },
  { name: '돈까스', calories: 450, portion: '1인분(200g)', cuisine: '일식' },
  { name: '규동', calories: 600, portion: '1그릇(400g)', cuisine: '일식' },
  // 기타
  { name: '샌드위치', calories: 250, portion: '1개', cuisine: '기타' },
  { name: '치킨', calories: 246, portion: '100g', cuisine: '기타' },
  { name: '아이스크림', calories: 207, portion: '100g', cuisine: '기타' },
  { name: '도넛', calories: 452, portion: '1개', cuisine: '기타' },
  { name: '핫도그', calories: 290, portion: '1개', cuisine: '기타' },
];

export function findFoodInDatabase(name: string): FoodData | undefined {
  return foodDatabase.find(
    (item) => name.replace(/\s/g, '').includes(item.name.replace(/\s/g, ''))
  );
} 