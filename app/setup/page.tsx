"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if key already exists
    const existingKey = localStorage.getItem('gemini_api_key');
    if (existingKey) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    
    setLoading(true);
    // Securely store in localStorage (only accessible by client)
    localStorage.setItem('gemini_api_key', apiKey.trim());
    
    // Redirect to dashboard
    router.push('/');
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-lg space-y-8 glass p-8 md:p-10 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px]">
          <Key className="w-32 h-32 text-cyan-500" />
        </div>

        <div className="mx-auto w-16 h-16 bg-cyan-900/30 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
          <Key className="w-8 h-8 text-cyan-400" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
          Connect Gemini AI
        </h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          To use the AI food tracking features, please provide your Google Gemini API Key. 
          Your key is stored <strong>locally in your browser</strong> and is never saved to our database.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <input
              type="password"
              required
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-center font-mono text-lg"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-medium text-white bg-cyan-600 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Save & Continue'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 pt-6 border-t border-gray-800">
          Don&apos;t have one?{' '}
          <a rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors" href="https://aistudio.google.com/app/apikey" target="_blank">
            Get a free API key from Google AI Studio
          </a>
        </p>
      </div>
    </div>
  );
}
