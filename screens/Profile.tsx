
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onBack }) => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    // Accessing aistudio from window with type assertion to avoid duplicate declaration errors.
    // Assume window.aistudio.hasSelectedApiKey() and window.aistudio.openSelectKey() are pre-configured.
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
      try {
        const selected = await aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } catch (err) {
        console.error("Error checking API key status:", err);
      }
    }
  };

  const handleManageAccount = async () => {
    // Accessing aistudio from window with type assertion to avoid duplicate declaration errors.
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        // Assume success as per platform guidelines to avoid race conditions.
        setHasApiKey(true);
      } catch (err) {
        console.error("Error opening API key selection:", err);
      }
    } else {
      alert("Account management is only available in the AirGuard cloud environment.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Google Bar */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-slate-800">arrow_back</span>
        </button>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-400">Google</span>
          <span className="font-black text-slate-800 tracking-tight">Account</span>
        </div>
        <div className="size-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${hasApiKey ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                <span className="material-symbols-outlined text-[14px]">{hasApiKey ? 'verified' : 'priority_high'}</span>
                <span className="text-[9px] font-black uppercase tracking-tighter">{hasApiKey ? 'Key Linked' : 'Set API Key'}</span>
             </div>
          </div>

          <div className="relative mb-6">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="size-24 rounded-full border-4 border-white shadow-xl object-cover"
            />
            <div className="absolute bottom-0 right-0 size-8 bg-primary rounded-full border-4 border-white flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xs">edit</span>
            </div>
          </div>
          <h2 className="text-xl font-black text-slate-800">{user.name}</h2>
          <p className="text-slate-400 text-sm font-medium mb-6">{user.email}</p>
          
          <button 
            onClick={handleManageAccount}
            className="w-full max-w-[240px] px-6 py-3 rounded-full border-2 border-slate-100 text-slate-700 text-xs font-black hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            Manage Account & Keys
          </button>
          
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 text-[9px] text-primary/60 hover:text-primary font-bold uppercase tracking-widest flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[12px]">payments</span>
            Billing Documentation
          </a>
        </div>

        {/* Direct Gmail Context */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gmail Integration</h3>
            <span className="material-symbols-outlined text-slate-300 text-sm">info</span>
          </div>
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-5 flex items-center gap-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="size-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined fill-icon">mail</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Weekly Summary Sent</p>
                <p className="text-[10px] text-slate-400">Sent to alex.rivera@gmail.com</p>
              </div>
              <span className="text-[10px] font-bold text-slate-300">2h ago</span>
            </div>
            <div className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">mark_email_unread</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">View Carbon Alerts</p>
                <p className="text-[10px] text-slate-400">Open Gmail App</p>
              </div>
              <span className="material-symbols-outlined text-slate-300 text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
            </div>
          </div>
        </section>

        {/* Security & Activity */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Privacy & Security</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-emerald-200 transition-all cursor-pointer">
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined">security</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Safety Check</p>
                <p className="text-[9px] text-slate-400 leading-tight mt-1">Grounded data protection active</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-blue-200 transition-all cursor-pointer">
              <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined">sync</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Data Sync</p>
                <p className="text-[9px] text-slate-400 leading-tight mt-1">Cross-device air guard enabled</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 sticky bottom-0 bg-slate-50">
        <button className="w-full py-5 rounded-[2rem] bg-slate-900 text-white font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-lg">logout</span>
          Sign out of Google
        </button>
      </div>
    </div>
  );
};

export default Profile;
