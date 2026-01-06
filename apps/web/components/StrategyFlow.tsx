
import React from 'react';
import { ArrowRight, ArrowDown, Database, Landmark, TrendingUp, RefreshCw } from 'lucide-react';

const StrategyFlow: React.FC = () => {
  return (
    <div className="p-8 glass-card rounded-2xl relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-8 text-center">How Your BTC Earns Yield</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-2xl gap-8">
          {/* Step 1: Input */}
          <div className="flex flex-col items-center group">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-3 group-hover:border-[#f7931a] transition-colors">
              <Database className="w-8 h-8 text-slate-400 group-hover:text-[#f7931a]" />
            </div>
            <span className="text-sm font-medium">BTC Deposit</span>
          </div>

          <ArrowRight className="hidden md:block w-6 h-6 text-slate-600" />
          <ArrowDown className="md:hidden w-6 h-6 text-slate-600" />

          {/* Step 2: Base Yield */}
          <div className="flex flex-col items-center group relative">
            <div className="absolute -top-4 right-0 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded border border-blue-500/30">Vesu</div>
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-3 group-hover:border-blue-400 transition-colors">
              <Landmark className="w-8 h-8 text-slate-400 group-hover:text-blue-400" />
            </div>
            <span className="text-sm font-medium">Lending Pool</span>
            <span className="text-[10px] text-slate-500">Base Interest Earned</span>
          </div>

          <ArrowRight className="hidden md:block w-6 h-6 text-slate-600" />
          <ArrowDown className="md:hidden w-6 h-6 text-slate-600" />

          {/* Step 3: Yield Recycling */}
          <div className="flex flex-col items-center group relative">
            <div className="absolute -top-4 right-0 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded border border-purple-500/30">Ekubo</div>
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-3 group-hover:border-purple-400 transition-colors">
              <TrendingUp className="w-8 h-8 text-slate-400 group-hover:text-purple-400" />
            </div>
            <span className="text-sm font-medium">BTC/USDC LP</span>
            <span className="text-[10px] text-slate-500">Yield Compounding</span>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 bg-slate-800/50 px-6 py-3 rounded-full border border-slate-700/50">
          <RefreshCw className="w-4 h-4 text-[#f7931a] animate-spin-slow" />
          <span className="text-sm text-slate-300">Interest is harvested and compounded back to BTC daily</span>
        </div>
      </div>
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#f7931a]/5 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
    </div>
  );
};

export default StrategyFlow;
