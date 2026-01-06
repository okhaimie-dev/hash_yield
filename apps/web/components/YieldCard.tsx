
import React from 'react';
import { Info, ExternalLink } from 'lucide-react';

interface YieldCardProps {
  baseApy: number;
  bonusApy: number;
}

const YieldCard: React.FC<YieldCardProps> = ({ baseApy, bonusApy }) => {
  const totalApy = baseApy + bonusApy;

  return (
    <div className="glass-card rounded-2xl p-6 overflow-hidden relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
            Projected Net APY
            <Info className="w-3.5 h-3.5" />
          </h3>
          <p className="text-4xl font-bold text-white mt-1">{(totalApy).toFixed(2)}%</p>
        </div>
        <div className="bg-[#f7931a]/10 text-[#f7931a] text-xs font-bold px-3 py-1.5 rounded-full border border-[#f7931a]/20 uppercase tracking-wider">
          Compounding
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-slate-300">Vesu Lending (Base)</span>
          </div>
          <span className="font-mono text-white">{baseApy.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <span className="text-slate-300">Ekubo Yield Recycling</span>
          </div>
          <span className="font-mono text-[#10b981]">+ {bonusApy.toFixed(2)}%</span>
        </div>
        
        <div className="pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Total Strategy APY</span>
            <span className="font-bold text-white">{(totalApy).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <button className="w-full mt-6 py-2.5 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-slate-800/30 hover:bg-slate-800 rounded-lg">
        View Strategy Contracts <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
};

export default YieldCard;
