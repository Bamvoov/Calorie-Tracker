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

    // Prisma SQLite grouping is limited sometimes with dates, but since we have logDate as YYYY-MM-DD
    // we can easily group by it for calendar data
    const logs = await prisma.foodLog.groupBy({
      by: ['logDate'],
      where: {
        userId: user.id
      },
      _sum: {
        calories: true
      },
      orderBy: {
        logDate: 'desc'
      },
      take: 31 // get last 31 days mapped out
    });

    const formattedData = logs.map(d => ({
      date: d.logDate,
      totalCalories: d._sum?.calories || 0
    }));

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error('Failed to fetch monthly logs:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
