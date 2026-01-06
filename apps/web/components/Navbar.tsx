 "use client";

import React, { useState, useRef, useEffect } from 'react';
import { Wallet, ShieldCheck, ChevronDown, X } from 'lucide-react';
import { useAccount, useConnect, useDisconnect, Connector } from '@starknet-react/core';

interface NavbarProps {
  currentView: 'landing' | 'vault';
  onViewChange: (view: 'landing' | 'vault') => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  const { address, status } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isConnected = status === 'connected' && !!address;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    };

    if (showWalletMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWalletMenu]);

  const handleWalletClick = () => {
    if (isConnected) {
      setShowWalletMenu(!showWalletMenu);
      return;
    }
    setShowWalletMenu(!showWalletMenu);
  };

  const handleConnect = (connector: Connector) => {
    connect({ connector });
    setShowWalletMenu(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowWalletMenu(false);
  };

  const getConnectorName = (connector: Connector) => {
    if (connector.id === 'controller') return 'Cartridge';
    if (connector.id === 'braavos') return 'Braavos';
    if (connector.id === 'ready') return 'Ready';
    return connector.name || 'Unknown Wallet';
  };

  const displayAddress =
    address && address.length > 10
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;

  const buttonLabel = isConnected
    ? displayAddress
    : isPending
    ? 'Connecting...'
    : 'Connect Wallet';

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

        <div className="flex items-center gap-3 relative" ref={menuRef}>
          {currentView === 'vault' && (
            <div className="hidden sm:flex flex-col items-end mr-2 text-[10px] text-slate-400 font-mono">
              <span>Starknet Mainnet</span>
              <span className="text-[#10b981]">● Healthy</span>
            </div>
          )}
          <button
            onClick={handleWalletClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-700 transition-all text-sm font-medium text-white shadow-sm hover:border-slate-500 disabled:opacity-60"
            disabled={isPending}
          >
            <Wallet className="w-4 h-4 text-[#f7931a]" />
            <span className="font-mono">
              {buttonLabel}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showWalletMenu ? 'rotate-180' : ''}`} />
          </button>

          {showWalletMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              {isConnected ? (
                <>
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-xs text-slate-400 mb-1">Connected Wallet</p>
                    <p className="text-sm font-mono text-white">{displayAddress}</p>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-sm font-medium text-white">Connect Wallet</p>
                    <p className="text-xs text-slate-400 mt-1">Choose your preferred wallet</p>
                  </div>
                  <div className="py-2">
                    {connectors.map((connector) => (
                      <button
                        key={connector.id}
                        onClick={() => handleConnect(connector)}
                        disabled={isPending}
                        className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                      >
                        <span>{getConnectorName(connector)}</span>
                        {isPending && <span className="text-xs text-slate-500">Connecting...</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
