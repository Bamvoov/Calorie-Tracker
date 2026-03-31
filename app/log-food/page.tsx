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
    
    // Check if we already logged this EXACT query recently strictly in this session
    // (Wait, actually we should let them log the same food twice if they eat it again, 
    // so cache is for preventing re-hitting the API just for estimation if they haven't saved it.
    // For simplicity MVP we will hit the API directly but allow saving the result.)

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
    <div className="max-w-xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2 gradient-text">Log Food with AI</h1>
      <p className="text-gray-400 mb-8">Type what you ate (e.g., "2 boiled eggs and 1 slice toast") and let AI do the rest.</p>

      <form onSubmit={handleEstimate} className="glass p-6 rounded-2xl mb-8 border border-gray-800 shadow-2xl">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
             <label className="block text-sm text-gray-400 mb-1">Date</label>
             <input
               type="date"
               value={logDate}
               onChange={(e) => setLogDate(e.target.value)}
               disabled={loading}
               className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
             />
          </div>
          <div>
             <label className="block text-sm text-gray-400 mb-1">Meal</label>
             <select
               value={mealType}
               onChange={(e) => setMealType(e.target.value)}
               disabled={loading}
               className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 appearance-none"
             >
               <option value="breakfast">Breakfast</option>
               <option value="lunch">Lunch</option>
               <option value="dinner">Dinner</option>
               <option value="snack">Snack</option>
             </select>
          </div>
        </div>

        <div className="relative mb-4">
          <label className="block text-sm text-gray-400 mb-1">What did you eat?</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="What did you eat today?"
            className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none h-32"
          />
        </div>

        <button
          type="submit"
          disabled={loading || input.trim().length === 0 ? true : undefined}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
          {loading ? "Estimating..." : "Estimate & Save with AI"}
        </button>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>

      {result && (
        <div className="glass p-6 rounded-2xl border border-green-500/20 shadow-xl slide-in-bottom animate-in fade-in duration-300">
          <h2 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
            <PlusSquare className="w-5 h-5" /> Saved Successfully!
          </h2>
          <div className="space-y-3">
            <div className="p-4 bg-black/30 rounded-lg flex justify-between items-center text-lg">
              <span className="text-gray-300">Total Estimated</span>
              <span className="font-bold text-white">{result.result.calories} kcal</span>
            </div>
            {result.raw?.items && (
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Breakdown</p>
                <div className="space-y-2">
                  {result.raw.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm text-gray-400">
                      <span>{item.name}</span>
                      <span>{item.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-600 mt-4 text-center">
              *Calories are AI estimated and may not be 100% accurate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
