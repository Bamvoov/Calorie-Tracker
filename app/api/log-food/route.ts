import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { estimateCalories } from '@/lib/gemini';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429 });
    }

    const token = request.cookies.get('token')?.value;
    const payload: any = token ? await verifyToken(token) : null;
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { foodInput, mealType, logDate } = await request.json();
    const apiKey = request.headers.get('x-gemini-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key missing from headers' }, { status: 400 });
    }

    if (!foodInput) {
      return NextResponse.json({ error: 'Food input is required' }, { status: 400 });
    }

    const finalMealType = mealType || 'snack';
    const finalLogDate = logDate || new Date().toISOString().split('T')[0];

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please log in again.' }, { status: 400 });
    }

    const result = await estimateCalories(foodInput, apiKey);

    if (!result || !result.items || result.items.length === 0) {
      return NextResponse.json({ error: 'Failed to estimate calories properly or invalid response.' }, { status: 400 });
    }

    let totalCalories = result.total_calories || result.items.reduce((sum: number, item: any) => sum + item.calories, 0);
    const rawItems = result.items.map((item: any) => ({ name: item.name, calories: item.calories }));

    const logEntry = await prisma.foodLog.create({
      data: {
        userId: user.id,
        foodName: JSON.stringify(rawItems),
        calories: totalCalories,
        mealType: finalMealType.toLowerCase(),
        logDate: finalLogDate,
        estimated: true,
      },
    });

    return NextResponse.json({ result: logEntry, raw: result });
  } catch (error: any) {
    console.error('Error logging food:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload: any = token ? await verifyToken(token) : null;
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const log = await prisma.foodLog.findUnique({ where: { id } });
    if (!log || log.userId !== payload.userId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
    }

    await prisma.foodLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete food log:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

