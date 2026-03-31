import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload: any = token ? await verifyToken(token) : null;
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: 'No profile found' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ message: 'No profile found' }, { status: 404 });

    // Hide passwordHash from the client
    const { passwordHash, ...profile } = user;
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload: any = token ? await verifyToken(token) : null;
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { height, weight, age, gender, activityLevel, targetWeight } = data;

    const existing = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { height: Number(height), weight: Number(weight), age: Number(age), gender, activityLevel, targetWeight: Number(targetWeight) },
      });
      const { passwordHash, ...profile } = updated;
      return NextResponse.json(profile);
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error in profile POST:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
