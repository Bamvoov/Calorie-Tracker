import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload: any = token ? await verifyToken(token) : null;
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ totalCalories: 0, logs: [] }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      return NextResponse.json({ totalCalories: 0, logs: [] });
    }

    const logs = await prisma.foodLog.findMany({
      where: {
        userId: user.id,
        logDate: dateStr,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);

    return NextResponse.json({ totalCalories, logs, date: dateStr });
  } catch (error) {
    console.error('Failed to fetch daily logs:', error);
    return NextResponse.json({ error: 'Failed to fetch daily logs' }, { status: 500 });
  }
}
