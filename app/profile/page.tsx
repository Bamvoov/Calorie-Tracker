"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { calculateBMR, calculateTDEE, calculateDietMetrics } from "@/lib/calorieLogic";

export default function ProfilePage() {
  const { profile, setProfile } = useStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'api'>('profile');
  const [geminiKey, setGeminiKey] = useState("");

  const [formData, setFormData] = useState({
    height: 170,
    weight: 70,
    age: 25,
    gender: "male" as "male" | "female",
    activityLevel: "moderate" as "sedentary" | "light" | "moderate" | "active" | "very_active",
    targetWeight: 65,
  });

  const [tdee, setTdee] = useState<number | null>(null);
  const [dietMetrics, setDietMetrics] = useState<any>(null);

  useEffect(() => {
    // Fetch profile on mount
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (!data.message && !data.error) {
          setFormData({
            height: data.height,
            weight: data.weight,
            age: data.age,
            gender: data.gender,
            activityLevel: data.activityLevel,
            targetWeight: data.targetWeight,
          });
          setProfile(data);
        }
      })
      .finally(() => setFetching(false));
      
    // Fetch Gemini Key
    const key = localStorage.getItem('gemini_api_key');
    if (key) setGeminiKey(key);
  }, [setProfile]);

  useEffect(() => {
    // Calculate TDEE dynamically
    const bmr = calculateBMR(
      formData.weight,
      formData.height,
      formData.age,
      formData.gender
    );
    const calculatedTdee = calculateTDEE(bmr, formData.activityLevel);
    setTdee(calculatedTdee);
    setDietMetrics(calculateDietMetrics(formData.weight, formData.targetWeight, calculatedTdee, 500));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["height", "weight", "age", "targetWeight"].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        alert("Profile saved successfully!");
      } else {
        alert("Failed to save profile");
      }
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('gemini_api_key', geminiKey.trim());
      alert("API Key saved successfully!");
    } else {
      alert("Please enter a valid API key.");
    }
  };

  const handleRemoveApiKey = () => {
    if (confirm("Are you sure you want to remove your API key?")) {
      localStorage.removeItem('gemini_api_key');
      setGeminiKey("");
      alert("API Key removed!");
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full pt-8 relative z-10">
      <h1 className="text-3xl font-black mb-6 text-[#eaf2e3]">Your Profile</h1>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 rounded-full font-bold transition-all shadow-md ${activeTab === 'profile' ? 'bg-[#264a22] text-[#eaf2e3]' : 'bg-white/80 text-[#264a22] hover:bg-white'}`}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('api')}
          className={`px-6 py-2 rounded-full font-bold transition-all shadow-md ${activeTab === 'api' ? 'bg-[#264a22] text-[#eaf2e3]' : 'bg-white/80 text-[#264a22] hover:bg-white'}`}
        >
          API Settings
        </button>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleSubmit} className="floating-card p-6 md:p-8 space-y-6 border border-white/60 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-3 text-black font-black focus:outline-none focus:ring-2 focus:ring-[#264a22] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-3 text-black font-black focus:outline-none focus:ring-2 focus:ring-[#264a22] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-3 text-black font-black focus:outline-none focus:ring-2 focus:ring-[#264a22] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Target Weight (kg)</label>
              <input
                type="number"
                name="targetWeight"
                value={formData.targetWeight}
                onChange={handleChange}
                className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-3 text-black font-black focus:outline-none focus:ring-2 focus:ring-[#264a22] transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-3 text-black font-bold focus:outline-none focus:ring-2 focus:ring-[#264a22] transition-all"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#264a22]/70 mb-1">Activity Level</label>
              <select
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleChange}
                className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-3 text-black font-bold focus:outline-none focus:ring-2 focus:ring-[#264a22] transition-all"
              >
                <option value="sedentary">Sedentary (Little/No Exercise)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very_active">Very Active (Physical job/2x training)</option>
              </select>
            </div>
          </div>

          {tdee && dietMetrics && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#264a22]/10">
              <div className="border-2 border-[#264a22]/20 rounded-2xl p-4 flex flex-col items-center justify-center bg-white/40 shadow-inner">
                <p className="text-[10px] font-bold text-[#264a22]/70 mb-1 uppercase tracking-wider">Maintenance TDEE</p>
                <p className="text-2xl font-black text-black">{Math.round(tdee)} kcal</p>
              </div>
              <div className={`border-2 rounded-2xl p-4 flex flex-col items-center justify-center shadow-md transform transition-transform hover:scale-105 ${dietMetrics.mode === 'maintain' ? 'bg-white/60 border-[#264a22]/30' : 'bg-white/80 border-[#264a22]'}`}>
                <p className="text-[10px] font-bold text-[#264a22]/80 mb-1 uppercase tracking-wider">Target Limit</p>
                <p className="text-2xl font-black text-black">{dietMetrics.targetCalories} kcal</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#264a22] hover:bg-[#1a3317] text-[#eaf2e3] font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 border border-[#264a22]/50 text-sm"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      ) : (
        <div className="floating-card p-6 md:p-8 space-y-6 border border-white/60 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-black text-[#264a22] mb-2">Gemini API Key</h2>
            <p className="text-sm font-bold text-[#264a22]/70">Enter your Gemini API key to enable AI-powered food logging. This key is stored securely in your browser's local storage.</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#264a22]/70 mb-1">API Key</label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-white/60 border border-[#264a22]/20 rounded-xl px-3 py-3 text-black font-bold focus:outline-none focus:ring-2 focus:ring-[#264a22] transition-all"
            />
          </div>
          
          <div className="flex gap-4 pt-2">
            <button
              onClick={handleSaveApiKey}
              className="flex-1 bg-[#264a22] hover:bg-[#1a3317] text-[#eaf2e3] font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 border border-[#264a22]/50 text-sm"
            >
              Save Key
            </button>
            <button
              onClick={handleRemoveApiKey}
              className="flex-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 border border-red-200 hover:border-red-500 text-sm"
            >
              Remove Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

