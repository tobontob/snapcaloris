import pandas as pd
import json
from pathlib import Path
import sys
import os
import traceback

def convert_excel_to_json(excel_path, output_path):
    try:
        print(f"\n=== 변환 시작: {excel_path.name} ===")
        print(f"현재 작업 디렉토리: {os.getcwd()}")
        print(f"엑셀 파일 경로: {excel_path}")
        print(f"엑셀 파일 존재 여부: {os.path.exists(excel_path)}")
        
        if not os.path.exists(excel_path):
            raise FileNotFoundError(f"엑셀 파일을 찾을 수 없습니다: {excel_path}")
        
        # 엑셀 파일 읽기
        print("엑셀 파일 읽는 중...")
        df = pd.read_excel(excel_path)
        
        print(f"데이터 행 수: {len(df)}")
        print(f"컬럼 목록: {df.columns.tolist()}")
        
        # 데이터 정제
        print("데이터 정제 중...")
        food_data = []
        for _, row in df.iterrows():
            food_item = {
                "name": str(row.get("식품명", "")).strip(),
                "calories": float(row.get("에너지(kcal)", 0)),
                "serving_size": str(row.get("영양성분함량기준량", "")).strip()
            }
            food_data.append(food_item)
        
        # 출력 디렉토리 생성
        print(f"출력 디렉토리 생성: {output_path.parent}")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # JSON 파일로 저장
        print(f"JSON 파일 저장 중: {output_path}")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(food_data, f, ensure_ascii=False, indent=2)
            
        print(f"변환 완료: {len(food_data)}개의 항목이 저장되었습니다.")
        print(f"=== 변환 종료: {excel_path.name} ===\n")
        
    except Exception as e:
        print(f"\n에러 발생: {str(e)}")
        print("상세 에러 정보:")
        traceback.print_exc()
        raise

def main():
    try:
        # 현재 스크립트의 디렉토리 경로
        script_dir = Path(__file__).parent
        project_root = script_dir.parent
        
        # 입력 파일 경로
        food_db_path = project_root / "data" / "20250408_음식DB.xlsx"
        processed_food_db_path = project_root / "data" / "20250327_가공식품DB_147999건.xlsx"
        
        # 출력 파일 경로
        output_dir = project_root / "public" / "data"
        
        print("\n=== 변환 프로그램 시작 ===")
        print(f"프로젝트 루트 디렉토리: {project_root}")
        print(f"입력 파일 경로:")
        print(f"- 음식 DB: {food_db_path}")
        print(f"- 가공식품 DB: {processed_food_db_path}")
        print(f"출력 디렉토리: {output_dir}")
        
        # 각 엑셀 파일을 JSON으로 변환
        convert_excel_to_json(food_db_path, output_dir / "food_db.json")
        convert_excel_to_json(processed_food_db_path, output_dir / "processed_food_db.json")
        
        print("\n모든 변환이 완료되었습니다.")
        print("=== 프로그램 종료 ===\n")
        
    except Exception as e:
        print(f"\n프로그램 실행 중 에러 발생: {str(e)}")
        print("상세 에러 정보:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 