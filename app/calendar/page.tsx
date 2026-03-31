"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { calculateBMR, calculateTDEE, calculateDietMetrics } from "@/lib/calorieLogic";

export default function CalendarPage() {
  const [profile, setProfile] = useState<any>(null);
  const [targetTDEE, setTargetTDEE] = useState<number>(2000);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate an array for the last 30 days dynamically
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/monthly").then((r) => r.json()),
    ]).then(([profileData, monthlyRes]) => {
      if (profileData && profileData.id) {
        setProfile(profileData);
        const bmr = calculateBMR(profileData.weight, profileData.height, profileData.age, profileData.gender);
        const tdee = calculateTDEE(bmr, profileData.activityLevel);
        const dietMetrics = calculateDietMetrics(profileData.weight, profileData.targetWeight, tdee, 500);
        setTargetTDEE(dietMetrics.targetCalories);
      }
      if (monthlyRes && monthlyRes.data) {
        setMonthlyData(monthlyRes.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-20 text-gray-500 animate-pulse">Loading Calendar...</div>;

  // Build a strict 30 day historical calendar array ending on today
  const daysArray = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    daysArray.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold mb-2 gradient-text">Your 30-Day Calendar</h1>
      <p className="text-gray-400 mb-8">View your historical calorie intake and meal structures.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
        {daysArray.map((dateStr) => {
          const stats = monthlyData.find(d => d.date === dateStr);
          const calories = stats ? stats.totalCalories : 0;
          const isOver = calories > targetTDEE;
          const hasData = calories > 0;

          let bgColor = "bg-gray-900/40 border-gray-800";
          if (hasData) {
            bgColor = isOver ? "bg-red-900/20 border-red-500/50" : "bg-green-900/20 border-green-500/50";
          }

          // Format date for display like "Oct 25"
          const dateObj = new Date(dateStr);
          const displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <Link
              key={dateStr}
              href={`/?date=${dateStr}`}
              className={`glass p-4 rounded-xl border flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer ${bgColor}`}
            >
              <div className="text-sm text-gray-400 font-medium mb-2">{displayDate}</div>
              {hasData ? (
                <>
                  <div className={`text-xl font-bold ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                    {Math.round(calories)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 flex items-center gap-1">
                    {isOver ? <AlertCircle className="w-3 h-3 text-red-500" /> : <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    Kcal
                  </div>
                </>
              ) : (
                <div className="text-lg text-gray-600 font-bold">-</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
