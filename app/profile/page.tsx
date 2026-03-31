"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { calculateBMR, calculateTDEE, calculateDietMetrics } from "@/lib/calorieLogic";

export default function ProfilePage() {
  const { profile, setProfile } = useStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center mt-10 text-gray-400">Loading Profile...</div>;

  return (
    <div className="max-w-xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8 gradient-text">Your Profile</h1>

      <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Target Weight (kg)</label>
            <input
              type="number"
              name="targetWeight"
              value={formData.targetWeight}
              onChange={handleChange}
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Activity Level</label>
            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
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
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/30 border border-gray-700 p-4 rounded-xl text-center">
              <p className="text-gray-400 text-sm">Maintenance TDEE</p>
              <p className="text-2xl font-bold text-gray-300">{tdee} kcal</p>
            </div>
            <div className={`border p-4 rounded-xl text-center ${dietMetrics.mode === 'maintain' ? 'bg-gray-800/30 border-gray-700' : 'bg-cyan-900/20 border-cyan-800/50'}`}>
              <p className="text-cyan-400/80 text-sm">Target Limit</p>
              <p className="text-2xl font-bold text-cyan-400">{dietMetrics.targetCalories} kcal</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
