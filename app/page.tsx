"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { calculateBMR, calculateTDEE, calculateDietMetrics } from "@/lib/calorieLogic";
import { ChevronLeft, ChevronRight, X, PlusCircle, Activity, Compass, Clock } from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [profile, setProfile] = useState<any>(null);
  const [dailyData, setDailyData] = useState<{ totalCalories: number; logs: any[] }>({ totalCalories: 0, logs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    if (!key) {
      router.push('/setup');
    }
  }, [router]);

  const fetchDailyData = async () => {
    try {
      const dailyRes = await fetch(`/api/daily?date=${selectedDate}`).then(r => r.json());
      setDailyData(dailyRes);
    } catch (e: unknown) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/profile").then(res => res.json()),
      fetch(`/api/daily?date=${selectedDate}`).then(res => res.json())
    ]).then(([profileData, dailyRes]) => {
      if (!profileData.error && profileData.id) {
        setProfile(profileData);
      }
      if (dailyRes && typeof dailyRes.totalCalories === 'number') {
        setDailyData(dailyRes);
      }
    }).finally(() => setLoading(false));
  }, [selectedDate]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this food item?")) return;
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      await fetch(`/api/log-food?id=${id}`, { 
        method: 'DELETE',
        headers: { 'X-Gemini-Key': apiKey }
      });
      fetchDailyData(); // Refresh the list without breaking the profile load
    } catch (e: unknown) {
      alert("Failed to delete log.");
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDate = d.toISOString().split('T')[0];
    router.push(`/?date=${newDate}`);
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center text-gray-500 animate-pulse text-lg">Loading Dashboard...</div>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-4 gradient-text">Welcome to AI Calorie Tracker</h1>
        <p className="text-gray-400 mb-8 max-w-md">Let&apos;s get your profile set up to calculate your daily goals.</p>
        <Link href="/profile" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/20">
          Setup Profile
        </Link>
        <button 
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
          }}
          className="mt-4 text-gray-500 hover:text-white transition-colors"
        >
          Log Out
        </button>
      </div>
    );
  }

  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  // Use precisely 500 kcal default target unless logic specifies otherwise.
  const dietMetrics = calculateDietMetrics(profile.weight, profile.targetWeight, tdee, 500);

  const consumed = dailyData.totalCalories;
  const remaining = Math.max(0, dietMetrics.targetCalories - consumed);
  const percentage = Math.min(100, Math.round((consumed / dietMetrics.targetCalories) * 100));
  const isSurplus = consumed > dietMetrics.targetCalories;
  const surplusAmountTracker = Math.abs(dietMetrics.targetCalories - consumed);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const logsByMeal = mealTypes.reduce((acc, meal) => {
    acc[meal] = dailyData.logs.filter(log => (log.mealType || 'snack') === meal);
    return acc;
  }, {} as Record<string, any[]>);

  // Formatting date for simple reading
  const dateObj = new Date(selectedDate);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const displayDateStr = isToday ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header and Controls */}
      <div className="flex justify-between items-center glass p-4 rounded-2xl border border-gray-800">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold gradient-text min-w-[150px] text-center">{displayDateStr}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors" disabled={isToday} style={{ opacity: isToday ? 0.3 : 1 }}>
            <ChevronRight className="w-6 h-6" />
          </button>
          <button 
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="p-2 ml-2 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            title="Log Out"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-gray-800 shadow-2xl grid md:grid-cols-2 gap-8 items-center">
        <div className="flex justify-center relative">
          <div className="w-48 h-48 rounded-full flex items-center justify-center"
            style={{ background: `conic-gradient(${isSurplus ? '#ef4444' : '#10b981'} ${percentage}%, #1f2229 ${percentage}%)` }}
          >
            <div className="w-40 h-40 bg-[#0f1115] rounded-full flex flex-col items-center justify-center p-2 text-center absolute">
              <span className="text-3xl font-bold text-white">{Math.round(consumed)}</span>
              <span className="text-xs text-gray-400 mt-1">/ {dietMetrics.targetCalories} kcal</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${isSurplus ? 'bg-red-900/20 text-red-500' : 'bg-green-900/20 text-green-500'}`}>
              <div className="text-sm font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {isSurplus ? 'Over Target' : 'Under Limit'}
              </div>
              <div className="text-2xl font-bold">{Math.round(surplusAmountTracker)} <span className="text-sm">kcal</span></div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-800/30 flex-1 border border-gray-700/50">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Compass className="w-3 h-3" />
                Remaining
              </div>
              <div className="text-3xl font-bold text-cyan-400">{Math.round(remaining)} <span className="text-sm">kcal</span></div>
            </div>
          </div>

          {/* Goal Insight UI logic block */}
          {dietMetrics.mode !== 'maintain' && (
             <div className="w-full bg-cyan-900/10 p-4 rounded-2xl border border-cyan-900/50 text-center">
               <div className="text-sm text-cyan-400/80 mb-1 flex items-center justify-center gap-2">
                 <Clock className="w-4 h-4" /> 
                 Time to {dietMetrics.mode === 'loss' ? 'Goal Weight' : 'Build Target'}
               </div>
               <div className="text-xl font-bold text-cyan-400">~{dietMetrics.daysRequired} Days</div>
               <div className="text-xs text-gray-500 mt-1">Based on {dietMetrics.targetCalories} cal strict daily {dietMetrics.mode === 'loss' ? 'deficit' : 'surplus'}</div>
             </div>
          )}
        </div>
      </div>

      {/* Structuring Meals */}
      <div className="space-y-6">
        {mealTypes.map((meal) => {
          const mealLogs = logsByMeal[meal];
          const totalMealCalories = mealLogs.reduce((sum, log) => sum + log.calories, 0);

          return (
            <div key={meal} className="glass rounded-3xl overflow-hidden border border-gray-800 shadow-lg">
              <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
                <h2 className="text-xl font-bold text-gray-200 capitalize tracking-wide">{meal}</h2>
                <div className="text-cyan-400 font-bold">{Math.round(totalMealCalories)} kcal</div>
              </div>
              
              <div className="p-6 space-y-4">
                {mealLogs.length === 0 ? (
                  <div className="text-center text-gray-500 py-4 italic text-sm">No food logged for this meal yet.</div>
                ) : (
                  mealLogs.map((log) => {
                    // Determine if the foodName is a flat string or our JSON AI items format
                    let itemsToDisplay = [{ name: log.foodName, calories: log.calories }];
                    if (log.estimated) {
                      try {
                         const parsed = JSON.parse(log.foodName);
                         if (Array.isArray(parsed)) itemsToDisplay = parsed;
                      } catch (e: unknown) {
                         // Fallback to flat string if not JSON
                      }
                    }

                    return (
                      <div key={log.id} className="group relative bg-black/30 rounded-xl p-4 flex justify-between items-center border border-gray-800/50 hover:border-gray-700 transition-all">
                        <div className="space-y-1 w-full pr-8">
                          {itemsToDisplay.map((item, idx) => (
                             <div key={idx} className="flex justify-between items-center text-sm md:text-base">
                               <span className="text-gray-300">{item.name}</span>
                               <span className="text-gray-400 text-sm">{Math.round(item.calories)} kcal</span>
                             </div>
                          ))}
                        </div>
                        
                        {/* Delete Button - Appears on hover */}
                        <button 
                          onClick={() => handleDelete(log.id)}
                          className="absolute right-3 p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })
                )}

                <Link
                  href={`/log-food?mealType=${meal}&date=${selectedDate}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-cyan-500/80 hover:text-cyan-400 border border-dashed border-white/10 hover:border-cyan-500/50 py-3 rounded-xl transition-all text-sm font-medium cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Add to {meal}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex h-[80vh] items-center justify-center text-gray-500 animate-pulse text-lg">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
