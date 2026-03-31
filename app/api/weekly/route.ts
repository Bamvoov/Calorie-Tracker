import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ data: [] });
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await prisma.foodLog.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
    });

    // Group by day name (e.g., 'Mon', 'Tue')
    const groupedData: Record<string, number> = {};
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      groupedData[dayName] = 0;
    }

    logs.forEach(log => {
      const dayName = log.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
      if (groupedData[dayName] !== undefined) {
        groupedData[dayName] += log.calories;
      }
    });

    const result = Object.entries(groupedData).map(([day, calories]) => ({ day, calories }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch weekly logs:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly data' }, { status: 500 });
  }
}
