"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Bot, PlusSquare } from "lucide-react";
import { useStore } from "@/lib/store";

export default function LogFoodPage() {
  const [input, setInput] = useState("");
  const [mealType, setMealType] = useState("snack");
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const router = useRouter();

  const { foodCache, addFoodCache } = useStore();

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    if (!key) {
      router.push('/setup');
    }
  }, [router]);

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const cacheKey = input.trim().toLowerCase();

    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const res = await fetch("/api/log-food", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-Key": apiKey
        },
        body: JSON.stringify({ foodInput: input, mealType, logDate }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Estimation failed");
      }

      setResult(data);
      setInput("");
      alert("Food logged successfully!");
    } catch (err: any) {
      setError(err.message || "Something went wrong estimating calories.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full pt-8">
      <h1 className="text-3xl font-black mb-2 text-[#eaf2e3]">Log Food with AI</h1>
      <p className="text-[#eaf2e3]/70 mb-8 font-bold">Type what you ate (e.g., "2 boiled eggs and 1 slice toast") and let AI do the rest.</p>

      <form onSubmit={handleEstimate} className="floating-card-2 p-6 md:p-8 mb-8 border border-white/60 relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
             <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Date</label>
             <input
               type="date"
               value={logDate}
               onChange={(e) => setLogDate(e.target.value)}
               disabled={loading}
               className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-3 text-black font-bold focus:outline-none focus:ring-2 focus:ring-[#264a22] transition-all"
             />
          </div>
          <div>
             <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Meal</label>
             <select
               value={mealType}
               onChange={(e) => setMealType(e.target.value)}
               disabled={loading}
               className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-3 text-black font-bold focus:outline-none focus:ring-2 focus:ring-[#264a22] transition-all appearance-none"
             >
               <option value="breakfast">Breakfast</option>
               <option value="lunch">Lunch</option>
               <option value="dinner">Dinner</option>
               <option value="snack">Snack</option>
             </select>
          </div>
        </div>

        <div className="relative mb-6">
          <label className="block text-xs font-bold text-[#264a22]/70 mb-1">What did you eat?</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="E.g. A bowl of oatmeal with berries and a coffee..."
            className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-4 py-4 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#264a22] resize-none h-32 transition-all shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={loading || input.trim().length === 0 ? true : undefined}
          className="w-full bg-[#264a22] hover:bg-[#1a3317] text-[#eaf2e3] font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-[#264a22]/50 shadow-lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
          {loading ? "Estimating..." : "Estimate & Save with AI"}
        </button>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold text-center shadow-sm">
            {error}
          </div>
        )}
      </form>

      {result && (
        <div className="floating-card p-6 md:p-8 border border-[#264a22]/20 slide-in-bottom animate-in fade-in duration-300 relative z-10 bg-white/40 backdrop-blur-md">
          <h2 className="text-xl font-black mb-4 text-[#264a22] flex items-center gap-2">
            <PlusSquare className="w-6 h-6" /> Saved Successfully!
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-white/80 rounded-xl flex justify-between items-center text-lg shadow-sm border border-[#264a22]/10">
              <span className="text-[#264a22]/70 font-bold text-sm">Total Estimated</span>
              <span className="font-black text-black">{result.result.calories} kcal</span>
            </div>
            {result.raw?.items && (
              <div className="pt-2 border-t border-[#264a22]/10">
                <p className="text-[10px] text-[#264a22]/60 mb-2 uppercase font-bold tracking-wider">Breakdown</p>
                <div className="space-y-2">
                  {result.raw.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm text-[#264a22]">
                      <span className="font-bold">{item.name}</span>
                      <span className="font-black text-black">{item.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs font-bold text-[#264a22]/50 mt-6 text-center">
              *Calories are AI estimated and may not be 100% accurate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
