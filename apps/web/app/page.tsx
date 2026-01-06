"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Info,
  Lock,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import Navbar from "../components/Navbar";
import DepositCard from "../components/DepositCard";
import YieldCard from "../components/YieldCard";
import StrategyFlow from "../components/StrategyFlow";
import { ALLOCATION_STRATEGY, RISKS } from "../constants";

export default function Home() {
  const [view, setView] = useState<"landing" | "vault">("landing");

  const vaultStats = {
    apyBase: 3.2,
    apyBonus: 1.65,
    tvlBtc: 84.52,
    tvlUsd: 5_410_290,
    sharePrice: 1.0421,
    asset: "WBTC",
  };

  const LandingPage = () => (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full hero-glow pointer-events-none -z-10"></div>
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-8 text-xs font-bold tracking-widest text-[#f7931a] uppercase">
            <Zap className="w-3 h-3 fill-current" /> Starknet Native Yield
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 bg-clip-text text-transparent bg-linear-to-b from-white to-slate-400">
            Bitcoin Yield <br /> Without Compromise.
          </h1>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
            StackBTC is the first non-custodial yield vault for Starknet that
            puts your BTC to work using risk-isolated strategies.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setView("vault")}
              className="w-full sm:w-auto px-8 py-4 bg-[#f7931a] hover:bg-[#e08517] text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(247,147,26,0.2)] flex items-center justify-center gap-2 group"
            >
              Launch Vault{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-xl font-bold text-lg transition-all">
              Read Docs
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Total TVL", value: "84.5 BTC" },
            { label: "Avg APY", value: "4.85%" },
            { label: "Vaults", value: "01" },
            { label: "Security Score", value: "98/100" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-mono font-bold text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">
          Designed for Bitcoin Sovereignty
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-3xl group hover:border-[#f7931a]/30 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-4">Non-Custodial</h3>
            <p className="text-slate-400 leading-relaxed">
              Your assets never leave the Starknet ecosystem. Smart contract
              enforced withdrawals ensure you are always in control.
            </p>
          </div>
          <div className="glass-card p-8 rounded-3xl group hover:border-[#f7931a]/30 transition-colors">
            <div className="w-12 h-12 bg-[#f7931a]/10 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-[#f7931a]" />
            </div>
            <h3 className="text-xl font-bold mb-4">Yield-on-Yield</h3>
            <p className="text-slate-400 leading-relaxed">
              We leverage Vesu&apos;s lending yield and recycle interest into
              Ekubo&apos;s LP pools to maximize your Bitcoin growth.
            </p>
          </div>
          <div className="glass-card p-8 rounded-3xl group hover:border-[#f7931a]/30 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-4">Risk Isolation</h3>
            <p className="text-slate-400 leading-relaxed">
              100% of your principal is kept in the base lending pool. We only
              put your accumulated interest at risk for extra yield.
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  const VaultDashboard = () => (
    <div className="animate-fade-in">
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4 uppercase tracking-widest">
              <button
                onClick={() => setView("landing")}
                className="hover:text-slate-300"
              >
                Home
              </button>
              <span className="text-slate-800">/</span>
              <span className="text-[#f7931a]">BTC Yield Stack</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              BTC Yield Stack Vault
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Earn compounded BTC yield without selling or leveraging your
              Bitcoin. Principal is kept in low-risk lending while interest is
              recycled into yield-on-yield strategies.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="glass-card px-6 py-3 rounded-2xl border-slate-800">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                Total TVL
              </span>
              <span className="text-2xl font-bold font-mono text-white">
                {vaultStats.tvlBtc} BTC
              </span>
            </div>
            <div className="glass-card px-6 py-3 rounded-2xl border-slate-800">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                Risk Rating
              </span>
              <span className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Low
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <StrategyFlow />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                Allocation Breakdown
                <Info className="w-4 h-4 text-slate-500 cursor-help" />
              </h3>
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ALLOCATION_STRATEGY}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ALLOCATION_STRATEGY.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Health
                  </span>
                  <span className="text-xl font-bold text-emerald-400">
                    100%
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {ALLOCATION_STRATEGY.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-slate-400">
                        {item.name} ({item.protocol})
                      </span>
                    </div>
                    <span className="font-mono text-white font-bold">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <YieldCard
              baseApy={vaultStats.apyBase}
              bonusApy={vaultStats.apyBonus}
            />
          </div>

          <div className="glass-card rounded-2xl p-8 border-l-4 border-l-emerald-500">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Security &amp; Risk Boundary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {RISKS.map((risk) => (
                <div key={risk.title} className="flex gap-4">
                  <div className="text-2xl mt-1">{risk.icon}</div>
                  <div>
                    <h4 className="font-bold text-slate-200 mb-1">
                      {risk.title}
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {risk.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <DepositCard sharePrice={vaultStats.sharePrice} />
          <div className="mt-6 bg-[#f7931a]/5 border border-[#f7931a]/10 rounded-2xl p-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#f7931a] shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-[#f7931a] mb-1">
                  Vault Mechanism
                </h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Our algorithm ensures that only yield is deployed to
                  higher-risk strategies. Your deposited BTC stays in the
                  primary lending market for maximum security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-[#f7931a]/30">
      <Navbar currentView={view} onViewChange={setView} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === "landing" ? <LandingPage /> : <VaultDashboard />}
      </main>

      <footer className="mt-24 border-t border-slate-900 py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-8 opacity-50">
            <Shield className="w-5 h-5 text-[#f7931a]" />
            <span className="text-lg font-bold">StackBTC</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm mb-10">
            <a href="#" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Discord
            </a>
            <a href="#" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Audit Report
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Whitepaper
            </a>
          </div>
          <p className="text-slate-600 text-xs">
            © 2024 StackBTC Protocol. Audited &amp; Secured on Starknet.
          </p>
        </div>
      </footer>
    </div>
  );
}
