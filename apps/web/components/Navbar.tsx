
import React from 'react';
import { Wallet, ShieldCheck, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'vault';
  onViewChange: (view: 'landing' | 'vault') => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button 
          onClick={() => onViewChange('landing')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="bg-[#f7931a] p-1.5 rounded-lg shadow-[0_0_15px_rgba(247,147,26,0.3)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Stack<span className="text-[#f7931a]">BTC</span></span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => onViewChange('landing')}
            className={`text-sm font-medium transition-colors ${currentView === 'landing' ? 'text-[#f7931a]' : 'text-slate-300 hover:text-white'}`}
          >
            Home
          </button>
          <button 
            onClick={() => onViewChange('vault')}
            className={`text-sm font-medium transition-colors ${currentView === 'vault' ? 'text-[#f7931a]' : 'text-slate-300 hover:text-white'}`}
          >
            Vaults
          </button>
          <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Docs</a>
        </div>

        <div className="flex items-center gap-3">
          {currentView === 'vault' && (
            <div className="hidden sm:flex flex-col items-end mr-2 text-[10px] text-slate-400 font-mono">
              <span>Starknet Mainnet</span>
              <span className="text-[#10b981]">● Healthy</span>
            </div>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-700 transition-all text-sm font-medium text-white shadow-sm hover:border-slate-500">
            <Wallet className="w-4 h-4 text-[#f7931a]" />
            <span className="font-mono">0x4f...92a1</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
