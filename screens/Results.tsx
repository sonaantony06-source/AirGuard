
import React from 'react';
import { FootprintResult, ReductionTip } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ResultsProps {
  result: FootprintResult | null;
  onBack: () => void;
}

const TIPS: ReductionTip[] = [
  { id: '1', title: 'Switch to LED Bulbs', description: 'Reduce lighting impact by up to 75%.', impact: '-0.2T', icon: 'lightbulb' },
  { id: '2', title: 'Smart AC Scheduling', description: 'Optimize usage based on occupancy.', impact: '-0.5T', icon: 'thermostat' },
  { id: '3', title: 'Commute Greener', description: 'Cycle or use transit 2 days/week.', impact: '-0.8T', icon: 'directions_bike' },
];

const Results: React.FC<ResultsProps> = ({ result, onBack }) => {
  if (!result) return null;

  const data = [
    { name: 'AC Usage', value: result.breakdown.acUsage, color: '#3b82f6' },
    { name: 'Gas Emissions', value: result.breakdown.gasEmissions, color: '#60a5fa' },
    { name: 'Energy Source', value: result.breakdown.energySource, color: '#93c5fd' },
  ];

  // Determine status based on totalTons
  const getStatus = (tons: number) => {
    if (tons < 2.0) return { label: 'Eco Guardian', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (tons < 4.0) return { label: 'Active Reducer', color: 'text-primary', bg: 'bg-primary/10' };
    return { label: 'High Impact', color: 'text-rose-500', bg: 'bg-rose-50' };
  };

  const status = getStatus(result.totalTons);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fbff]">
      <header className="flex items-center p-4 justify-between sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white">
        <button 
          onClick={onBack}
          className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-800">arrow_back_ios_new</span>
        </button>
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Analysis Report</h2>
        <button className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100">
          <span className="material-symbols-outlined text-primary">ios_share</span>
        </button>
      </header>

      <div className="flex-1 pb-10">
        {/* Massive Impact Hero Section */}
        <section className="relative pt-12 pb-16 px-6 overflow-hidden">
          {/* Decorative background "CO2" text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[18rem] font-black text-slate-100 select-none pointer-events-none z-0 opacity-50">
            CO2
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className={`mb-6 px-5 py-1.5 rounded-full border shadow-sm ${status.bg} border-white/50 backdrop-blur-md`}>
              <span className={`text-[11px] font-black uppercase tracking-widest ${status.color}`}>
                {status.label} Status
              </span>
            </div>

            <div className="relative flex items-center justify-center group">
              {/* Outer Glow/Ring */}
              <div className="absolute inset-0 -m-8 bg-gradient-to-tr from-primary/20 via-blue-100 to-transparent rounded-full blur-3xl opacity-60 animate-pulse"></div>
              
              <div className="flex flex-col items-center relative">
                <div className="flex items-baseline gap-1">
                  <h1 className="text-[10rem] font-black leading-none tracking-tighter bg-gradient-to-b from-pale-blue-900 via-primary to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
                    {result.totalTons}
                  </h1>
                  <span className="text-4xl font-black text-slate-300 -ml-2 mb-4">T</span>
                </div>
                <div className="mt-[-2rem] flex flex-col items-center">
                  <p className="text-slate-800 font-bold text-xl tracking-tight">Annual Carbon Footprint</p>
                  <p className="text-slate-400 text-xs font-semibold mt-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    Estimated per year
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Breakdown Cards */}
        <div className="px-6 space-y-6">
          <section className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Source Distribution</h3>
              <div className="size-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined">analytics</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-10">
              <div className="size-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black text-slate-300 uppercase leading-none">Total</span>
                  <span className="text-xl font-black text-slate-800">100%</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                {data.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* National Comparison Bar */}
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold">Relative Performance</h3>
              <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                Performing Better than 82%
              </div>
            </div>
            
            <div className="relative h-3 bg-white/10 rounded-full mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-transparent opacity-20"></div>
              {/* Average Marker */}
              <div className="absolute left-[75%] -top-1 h-5 w-0.5 bg-white/30">
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white/50 whitespace-nowrap uppercase tracking-widest">Global Avg (16T)</span>
              </div>
              {/* User Marker */}
              <div className="absolute left-[18%] top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-primary shadow-2xl shadow-primary/40 border-[3px] border-white flex items-center justify-center scale-110">
                <span className="material-symbols-outlined text-[18px] text-white">person</span>
              </div>
            </div>

            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              <span>Low</span>
              <span>Med</span>
              <span>High</span>
            </div>
          </section>

          {/* Reduction Tips */}
          <section className="pt-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800">Next Steps</h3>
              <button className="text-primary text-[11px] font-black uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-xl">View All Action Plan</button>
            </div>
            <div className="grid gap-4">
              {TIPS.map(tip => (
                <div key={tip.id} className="group flex items-center gap-5 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95">
                  <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <span className="material-symbols-outlined text-2xl">{tip.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm text-slate-800">{tip.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">{tip.description}</p>
                  </div>
                  <div className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    {tip.impact}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 p-6 bg-gradient-to-t from-[#f8fbff] via-[#f8fbff] to-transparent">
        <button 
          onClick={onBack}
          className="w-full py-5 rounded-3xl bg-slate-900 text-white font-black text-base shadow-2xl shadow-slate-900/40 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <span>Complete Review</span>
          <span className="material-symbols-outlined text-xl">verified</span>
        </button>
      </div>
    </div>
  );
};

export default Results;
