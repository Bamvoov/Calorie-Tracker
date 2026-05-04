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

  // Build a strict 30 day historical calendar array ending on today
  const daysArray = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    daysArray.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="max-w-4xl mx-auto w-full pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <h1 className="text-3xl font-black mb-2 text-[#eaf2e3]">Your 30-Day Calendar</h1>
      <p className="text-[#eaf2e3]/70 mb-8 font-bold">View your historical calorie intake and meal structures in zero-gravity.</p>

      <div className="floating-card p-6 md:p-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 border border-white/60">
        {daysArray.map((dateStr) => {
          const stats = monthlyData.find(d => d.date === dateStr);
          const calories = stats ? stats.totalCalories : 0;
          const isOver = calories > targetTDEE;
          const hasData = calories > 0;

          let bgColor = "bg-white/40 border-[#264a22]/20";
          if (hasData) {
            bgColor = isOver ? "bg-red-50 border-red-200 shadow-sm" : "bg-white border-[#264a22]/30 shadow-md";
          }

          // Format date for display like "Oct 25"
          const dateObj = new Date(dateStr);
          const displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <Link
              key={dateStr}
              href={`/?date=${dateStr}`}
              className={`rounded-2xl border flex flex-col items-center justify-center p-4 transition-transform hover:scale-105 cursor-pointer ${bgColor}`}
            >
              <div className="text-xs text-[#264a22] font-black mb-2">{displayDate}</div>
              {hasData ? (
                <>
                  <div className={`text-2xl font-black ${isOver ? 'text-red-500' : 'text-[#264a22]'}`}>
                    {Math.round(calories)}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#264a22]/80 mt-1 flex items-center gap-1">
                    {isOver ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-[#264a22]" />}
                    Kcal
                  </div>
                </>
              ) : (
                <div className="text-xl text-[#264a22]/40 font-black">-</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
