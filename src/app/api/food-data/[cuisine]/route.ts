import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: Request,
  { params }: { params: { cuisine: string } }
) {
  try {
    const cuisine = params.cuisine;
    const filePath = path.join(process.cwd(), 'data', `${cuisine}-foods.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading food data:', error);
    return NextResponse.json({ error: 'Failed to load food data' }, { status: 500 });
  }
} 