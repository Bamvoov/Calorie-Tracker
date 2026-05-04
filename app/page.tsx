"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { calculateBMR, calculateTDEE, calculateDietMetrics } from "@/lib/calorieLogic";
import { ChevronLeft, ChevronRight, X, Apple, Flame, User, Hexagon, Calendar as CalIcon, Trash2, Loader2 } from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [profile, setProfile] = useState<any>(null);
  const [dailyData, setDailyData] = useState<{ totalCalories: number; logs: any[] }>({ totalCalories: 0, logs: [] });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDaySummary, setShowDaySummary] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('today');

  // New State for "Log Food" widget
  const [foodText, setFoodText] = useState("");
  const [mealType, setMealType] = useState("Snack");
  const [isLogging, setIsLogging] = useState(false);

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

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDate = d.toISOString().split('T')[0];
    router.push(`/?date=${newDate}`);
  };

  const handleDeleteFood = async (id: string) => {
    if (!confirm("Are you sure you want to delete this food log?")) return;
    try {
      const res = await fetch(`/api/log-food?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDailyData(prev => ({
          ...prev,
          totalCalories: prev.totalCalories - (prev.logs.find(l => l.id === id)?.calories || 0),
          logs: prev.logs.filter(l => l.id !== id)
        }));
      } else {
        alert("Failed to delete log");
      }
    } catch (e) {
      alert("Error deleting log");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/profile').then(r => r.json()),
      fetch(`/api/daily?date=${selectedDate}`).then(r => r.json()),
      fetch('/api/monthly').then(r => r.json())
    ]).then(([profileData, dailyRes, monthlyRes]) => {
      if (!profileData.error && profileData.id) {
        setProfile(profileData);
      }
      if (dailyRes && typeof dailyRes.totalCalories === 'number') {
        setDailyData(dailyRes);
      }
      if (monthlyRes && monthlyRes.data) {
        setMonthlyData(monthlyRes.data);
      }
    }).finally(() => setLoading(false));
  }, [selectedDate]);

  if (!loading && !profile) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center floating-card p-12 max-w-xl mx-auto mt-20">
        <h1 className="text-4xl font-black mb-4 text-[#264a22]">Welcome to Antigravity</h1>
        <p className="text-[#264a22]/70 mb-8 max-w-md font-bold">Let&apos;s get your profile set up to calculate your daily goals in the void.</p>
        <Link href="/profile" className="bg-[#264a22] hover:bg-[#1a3317] text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg">
          Setup Profile
        </Link>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="mt-6 text-[#264a22]/50 hover:text-red-500 font-bold transition-colors"
        >
          Log Out
        </button>
      </div>
    );
  }

  const safeProfile = profile || { weight: 70, height: 170, age: 25, gender: 'male', activityLevel: 'moderate', targetWeight: 65 };

  const bmr = calculateBMR(safeProfile.weight, safeProfile.height, safeProfile.age, safeProfile.gender);
  const tdee = calculateTDEE(bmr, safeProfile.activityLevel);
  const dietMetrics = calculateDietMetrics(safeProfile.weight, safeProfile.targetWeight, tdee, 500);

  // Calculate Weekly Consumed
  let weeklyConsumed = 0;
  const currentSelectedDate = new Date(selectedDate);
  const startOfWeek = new Date(currentSelectedDate);
  startOfWeek.setDate(currentSelectedDate.getDate() - currentSelectedDate.getDay()); // Sunday

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = monthlyData.find(m => m.date === dateStr);
    if (dayData) {
      weeklyConsumed += dayData.totalCalories;
    }
  }

  const baseConsumed = viewMode === 'today' ? (dailyData.totalCalories || 0) : weeklyConsumed;
  const baseTarget = viewMode === 'today' ? dietMetrics.targetCalories : dietMetrics.targetCalories * 7;

  const remaining = Math.max(0, baseTarget - baseConsumed);
  const percentage = Math.min(100, Math.round((baseConsumed / baseTarget) * 100));

  const proteinTarget = Math.round((baseTarget * 0.3) / 4);
  const carbsTarget = Math.round((baseTarget * 0.4) / 4);
  const fatsTarget = Math.round((baseTarget * 0.3) / 9);

  const eatenCarbs = Math.round((baseConsumed * 0.4) / 4);
  const eatenProtein = Math.round((baseConsumed * 0.3) / 4);
  const eatenFats = Math.round((baseConsumed * 0.3) / 9);

  const dateObj = new Date(selectedDate);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIndex = dateObj.getDay();

  // Generate 30 day calendar data ending on today
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const dateStr = d.toISOString().split('T')[0];

    // Check if we have logs for this date
    const stats = monthlyData.find(m => m.date === dateStr);
    const hasData = stats ? stats.totalCalories > 0 : false;

    return {
      dateStr,
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }),
      isToday: i === 29, // The last element is today
      hasData
    };
  });

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-1000">

      {/* Left Column: Good Morning Widget */}
      <div className="w-full lg:w-5/12 flex flex-col gap-6">
        <div className="floating-card p-6 md:p-8 flex flex-col h-full relative overflow-hidden">
          {/* Subtle gradient orb inside card */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/40 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center border-2 border-white/80 shadow-sm backdrop-blur-sm">
                <User className="text-[#264a22]/70 w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-[#264a22]/60 font-bold tracking-wider uppercase">{isToday ? 'Today' : dateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}</div>
                <h1 className="text-3xl font-black text-[#264a22] leading-tight">What you Have Been Eating??</h1>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center text-[#264a22]/60 hover:text-red-500 transition-colors border border-white/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-center my-6 z-10">
            <div className="bg-white/60 backdrop-blur-md rounded-full p-1 shadow-inner flex items-center border border-white/50">
              <button 
                onClick={() => setViewMode('today')}
                className={`px-6 py-2 rounded-full text-sm font-black transition-all ${viewMode === 'today' ? 'bg-black text-white shadow-md' : 'text-[#264a22]/70 hover:text-black'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setViewMode('weekly')}
                className={`px-6 py-2 rounded-full text-sm font-black transition-all ${viewMode === 'weekly' ? 'bg-black text-white shadow-md' : 'text-[#264a22]/70 hover:text-black'}`}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-lg border border-white/60 flex flex-col justify-between relative z-10">
            <div className="flex justify-between items-center -mx-2">
              <button onClick={() => changeDate(-7)} className="p-1 hover:bg-[#264a22]/10 rounded-full transition-colors text-[#264a22] shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex justify-between items-center flex-1 px-2">
                {weekDays.map((day, idx) => {
                  const isSelected = idx === todayIndex;
                  const targetDate = new Date(dateObj);
                  targetDate.setDate(targetDate.getDate() - todayIndex + idx);
                  const targetDateStr = targetDate.toISOString().split('T')[0];

                  return (
                    <button
                      key={idx}
                      onClick={() => router.push(`/?date=${targetDateStr}`)}
                      className={`flex flex-col items-center justify-center w-10 h-14 rounded-full transition-all hover:scale-105 ${isSelected ? 'bg-black text-white shadow-xl scale-110' : 'text-[#264a22]/80 hover:bg-[#264a22]/5'}`}
                    >
                      <span className="text-[10px] font-bold mb-1">{day}</span>
                      <span className="text-sm font-black">{targetDate.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              <button onClick={() => changeDate(7)} className="p-1 hover:bg-[#264a22]/10 rounded-full transition-colors text-[#264a22] shrink-0">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex justify-center items-end h-40 my-8">
              <svg className="absolute w-72 h-36" viewBox="0 0 100 50">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#d2ded0" strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#264a22" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${Math.PI * 40}`} strokeDashoffset={`${Math.PI * 40 * (1 - percentage / 100)}`} className="transition-all duration-1000 ease-out drop-shadow-md" />
              </svg>

              <div className="absolute w-full flex justify-between bottom-0 px-2">
                <div className="flex flex-col items-center">
                  <Apple className="w-6 h-6 text-[#264a22] mb-1 drop-shadow-sm" fill="currentColor" />
                  <span className="font-black text-lg text-black">{Math.round(baseConsumed)}</span>
                  <span className="text-[10px] text-[#264a22]/70 font-bold uppercase tracking-wider">Eaten</span>
                </div>

                <div className="flex flex-col items-center mb-2">
                  <span className="text-4xl font-black text-black drop-shadow-sm">{baseTarget}</span>
                  <span className="text-xs text-[#264a22]/70 font-black uppercase tracking-wider">Cals</span>
                </div>

                <div className="flex flex-col items-center">
                  <Flame className="w-6 h-6 text-[#264a22] mb-1 drop-shadow-sm" fill="currentColor" />
                  <span className="font-black text-lg text-black">{Math.round(remaining)}</span>
                  <span className="text-[10px] text-[#264a22]/70 font-bold uppercase tracking-wider">Burned</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm border-b-4 border-[#264a22]/20 relative overflow-hidden group hover:border-[#264a22] transition-colors">
                <span className="text-xs text-[#264a22]/60 font-bold mb-1">Carbs</span>
                <span className="text-base font-black text-black">{eatenCarbs}<span className="text-xs font-bold text-[#264a22]/60">/{carbsTarget}g</span></span>
              </div>
              <div className="bg-white/80 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm border-b-4 border-[#264a22] relative overflow-hidden">
                <span className="text-xs text-[#264a22]/60 font-bold mb-1">Proteins</span>
                <span className="text-base font-black text-black">{eatenProtein}<span className="text-xs font-bold text-[#264a22]/60">/{proteinTarget}g</span></span>
              </div>
              <div className="bg-white/80 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm border-b-4 border-[#264a22]/20 relative overflow-hidden group hover:border-[#264a22] transition-colors">
                <span className="text-xs text-[#264a22]/60 font-bold mb-1">Fats</span>
                <span className="text-base font-black text-black">{eatenFats}<span className="text-xs font-bold text-[#264a22]/60">/{fatsTarget}g</span></span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDaySummary(true)}
            className="w-full mt-6 bg-[#264a22] hover:bg-[#1a3317] text-[#eaf2e3] font-black py-4 rounded-2xl shadow-xl transition-transform active:scale-95 flex justify-center items-center gap-2 text-sm z-10 border border-[#264a22]/50"
          >
            ✨ View My Day Summary
          </button>
        </div>
      </div>

      {/* Right Column: Grid of Widgets */}
      <div className="w-full lg:w-7/12 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Log Food Widget */}
        <div className="floating-card-2 p-6 flex flex-col bg-[#eaf2e3]">
          <h2 className="text-xl font-black text-[#264a22] mb-4">Log Food with AI</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Date</label>
              <input type="date" className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-[#264a22]" defaultValue={selectedDate} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Meal</label>
              <select className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-[#264a22]" value={mealType} onChange={e => setMealType(e.target.value)}>
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </select>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-bold text-[#264a22]/70 mb-1">What did you eat?</label>
            <textarea
              className="w-full flex-1 min-h-[100px] bg-white/60 border border-[#264a22]/20 rounded-xl px-4 py-3 text-black font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#264a22] shadow-inner"
              placeholder="E.g. A bowl of oatmeal with berries and a coffee..."
              value={foodText}
              onChange={e => setFoodText(e.target.value)}
            ></textarea>
          </div>
          <button
            onClick={async () => {
              if (!foodText.trim() || isLogging) return;
              setIsLogging(true);
              try {
                const apiKey = localStorage.getItem('gemini_api_key') || '';
                const res = await fetch("/api/log-food", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-Gemini-Key": apiKey },
                  body: JSON.stringify({ foodInput: foodText, mealType: mealType.toLowerCase(), logDate: selectedDate }),
                });
                if (res.ok) {
                  setFoodText("");
                  fetchDailyData(); // Refresh the data to update macros/arc
                } else {
                  const errorData = await res.json();
                  alert(errorData.error || "Failed to log food.");
                }
              } catch (e) {
                alert("Failed to log food.");
              } finally {
                setIsLogging(false);
              }
            }}
            disabled={!foodText.trim() || isLogging}
            className="w-full mt-4 bg-[#264a22] hover:bg-[#1a3317] text-[#eaf2e3] font-black py-3 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 text-sm border border-[#264a22]/50"
          >
            {isLogging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Apple className="w-4 h-4" />}
            {isLogging ? "Estimating..." : "Estimate & Save with AI"}
          </button>
        </div>

        {/* 3D Box / Particle Area Widget */}
        <div className="floating-card p-6 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#eaf2e3] to-[#d2ded0]/50 border border-white/40">
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none mix-blend-overlay"></div>
          <div className="absolute w-full h-full animate-[spin_60s_linear_infinite] flex items-center justify-center opacity-20 pointer-events-none">
            <div className="w-64 h-64 border-[0.5px] border-[#264a22] rounded-full rotate-45"></div>
            <div className="absolute w-64 h-64 border-[0.5px] border-[#264a22] rounded-full -rotate-45"></div>
          </div>
          <div className="relative z-10 animate-[float_4s_ease-in-out_infinite] drop-shadow-2xl">
            <Hexagon className="w-40 h-40 text-[#264a22]/40" strokeWidth={0.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Hexagon className="w-32 h-32 text-[#264a22]/60 rotate-12" strokeWidth={0.5} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Hexagon className="w-24 h-24 text-[#264a22]/80 -rotate-12" strokeWidth={1} />
            </div>
          </div>
        </div>

        {/* 30-Day Calendar Widget */}
        <div className="floating-card-2 p-6 flex flex-col bg-[#eaf2e3]">
          <div className="flex items-center gap-2 mb-4">
            <CalIcon className="w-5 h-5 text-[#264a22]" />
            <h2 className="text-xl font-black text-[#264a22]">Your 30-Day Calendar</h2>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-1 flex-1 content-start">
            {calendarDays.map((cd, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 ${cd.isToday ? 'bg-black border-black text-white shadow-md' : cd.hasData ? 'bg-white border-[#264a22]/30 text-[#264a22] shadow-sm' : 'bg-white/40 border-[#264a22]/20 text-[#264a22]/40'}`}>
                <span className={`text-[8px] font-bold leading-none ${cd.isToday ? 'text-white' : 'text-[#264a22]/70'}`}>{cd.month} {cd.day}</span>
                <span className="text-xs font-black mt-1 leading-none">{cd.hasData ? '✓' : '-'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Stats Widget */}
        <div className="floating-card p-6 flex flex-col bg-[#eaf2e3]">
          <h2 className="text-xl font-black text-[#264a22] mb-4">Profile Insights</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#264a22]/70 px-1 mb-1">Height (cm)</label>
              <div className="bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-2 text-black font-black flex justify-between">
                {safeProfile.height} <span className="text-[#264a22]/40">↕</span>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#264a22]/70 px-1 mb-1">Weight (kg)</label>
              <div className="bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-2 text-black font-black flex justify-between">
                {safeProfile.weight} <span className="text-[#264a22]/40">↕</span>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#264a22]/70 px-1 mb-1">Age</label>
              <div className="bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-2 text-black font-black">
                {safeProfile.age}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#264a22]/70 px-1 mb-1">Target (kg)</label>
              <div className="bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-2 text-black font-black flex justify-between">
                {safeProfile.targetWeight} <span className="text-[#264a22]/40">↕</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="border-2 border-[#264a22]/20 rounded-2xl p-3 flex flex-col items-center justify-center bg-white/40 shadow-inner">
              <span className="text-[10px] font-bold text-[#264a22]/70 mb-1">Maintenance TDEE</span>
              <span className="text-xl font-black text-black">{Math.round(tdee)} kcal</span>
            </div>
            <div className="border-2 border-[#264a22] rounded-2xl p-3 flex flex-col items-center justify-center bg-white/80 shadow-md transform hover:scale-105 transition-transform">
              <span className="text-[10px] font-bold text-[#264a22]/70 mb-1">Target Limit</span>
              <span className="text-xl font-black text-black">{dietMetrics.targetCalories} kcal</span>
            </div>
          </div>

          <Link href="/profile" className="w-full mt-4 bg-[#264a22] hover:bg-[#1a3317] text-[#eaf2e3] font-black py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 text-sm border border-[#264a22]/50">
            Edit Profile
          </Link>
        </div>

      </div>

      {/* Day Summary Modal */}
      {showDaySummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#eaf2e3] w-full max-w-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-[#264a22]/10 flex justify-between items-center bg-white/40">
              <h2 className="text-2xl font-black text-[#264a22]">Daily Summary</h2>
              <button onClick={() => setShowDaySummary(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#264a22] hover:bg-red-50 hover:text-red-500 shadow-sm transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {dailyData.logs.length === 0 ? (
                <div className="text-center py-12 text-[#264a22]/50 font-bold">No meals logged for this day yet.</div>
              ) : (
                ['breakfast', 'lunch', 'dinner', 'snack'].map(meal => {
                  const mealLogs = dailyData.logs.filter(log => (log.mealType || 'snack') === meal);
                  if (mealLogs.length === 0) return null;

                  return (
                    <div key={meal} className="bg-white/80 rounded-2xl p-4 shadow-sm border border-[#264a22]/10">
                      <h3 className="font-black text-lg text-[#264a22] capitalize mb-3 border-b border-[#264a22]/10 pb-2">{meal}</h3>
                      <div className="space-y-4">
                        {mealLogs.map(log => {
                          const c = Math.round(log.calories);
                          const carbs = Math.round((c * 0.4) / 4);
                          const protein = Math.round((c * 0.3) / 4);
                          const fats = Math.round((c * 0.3) / 9);

                          let displayName = log.foodName;
                          try {
                            const parsed = JSON.parse(log.foodName);
                            if (Array.isArray(parsed)) {
                              displayName = parsed.map((item: any) => item.name).join(', ');
                            }
                          } catch (e) { }

                          return (
                            <div key={log.id} className="flex justify-between items-center border-b border-[#264a22]/5 pb-3 last:border-0 last:pb-0">
                              <div className="flex-1 pr-4">
                                <p className="font-bold text-black text-sm leading-tight">{displayName}</p>
                                <div className="flex gap-3 text-[10px] font-bold text-[#264a22]/60 mt-1">
                                  <span>C: {carbs}g</span>
                                  <span>P: {protein}g</span>
                                  <span>F: {fats}g</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-3">
                                <div>
                                  <span className="font-black text-black text-lg">{c}</span>
                                  <span className="text-[10px] text-[#264a22]/70 font-bold ml-1">kcal</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteFood(log.id)}
                                  className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                  title="Delete food log"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen font-sans w-full flex justify-center perspective-1000">
      <Suspense fallback={<div className="flex h-[80vh] items-center justify-center text-white animate-pulse text-lg">Loading Antigravity Engine...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

