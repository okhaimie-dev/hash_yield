import React, { useState } from "react";
import { TransactionState } from "../types";
import { useWalletBalance, useVaultShares, useDeposit, useWithdraw } from "../hooks";

interface DepositCardProps {
  sharePrice: number;
}

const DepositCard: React.FC<DepositCardProps> = ({ sharePrice }) => {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  // Fetch user balances
  const { data: walletBalance = 0, isLoading: isLoadingBalance } = useWalletBalance();
  // Vault shares available for future use (e.g., showing user's share balance)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: vaultShares = 0 } = useVaultShares();

  // Transaction mutations
  const deposit = useDeposit();
  const withdraw = useWithdraw();

  const estimatedShares = amount ? parseFloat(amount) / sharePrice : 0;

  // Determine transaction state based on active mutation
  const activeMutation = activeTab === "deposit" ? deposit : withdraw;
  const txState = activeMutation.isPending
    ? TransactionState.LOADING
    : activeMutation.isSuccess
      ? TransactionState.SUCCESS
      : TransactionState.IDLE;

  const handleAction = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    if (activeTab === "deposit") {
      deposit.mutate(
        { amount },
        {
          onSuccess: () => {
            setTimeout(() => {
              deposit.reset();
              setAmount("");
            }, 3000);
          },
        }
      );
    } else {
      withdraw.mutate(
        { amount },
        {
          onSuccess: () => {
            setTimeout(() => {
              withdraw.reset();
              setAmount("");
            }, 3000);
          },
        }
      );
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border-slate-700 shadow-2xl relative overflow-hidden">
      {/* Tabs */}
      <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "deposit"
              ? "bg-[#f7931a] text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "withdraw"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400">Amount to {activeTab}</span>
          <span className="text-slate-400">
            Balance:{" "}
            {isLoadingBalance ? (
              <span>Loading...</span>
            ) : (
              <button
                className="text-[#f7931a] hover:underline"
                onClick={() => setAmount(walletBalance.toString())}
              >
                {walletBalance.toFixed(6)} BTC
              </button>
            )}
          </span>
        </div>

        <div className="relative group">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={txState === TransactionState.LOADING}
            className="w-full bg-slate-900/50 border-2 border-slate-800 focus:border-[#f7931a] outline-none rounded-xl px-4 py-5 text-2xl font-bold transition-all placeholder:text-slate-700"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-lg flex items-center gap-2 pr-3">
              <div className="w-6 h-6 rounded-full bg-[#f7931a] flex items-center justify-center text-[10px] font-bold">
                ₿
              </div>
              <span className="text-sm font-bold">BTC</span>
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800/50 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">You will receive</span>
            <span className="text-white font-medium">
              {estimatedShares.toFixed(6)} sBTC Shares
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Current Share Price</span>
            <span className="text-white font-medium">
              1 sBTC = {sharePrice.toFixed(4)} BTC
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleAction}
          disabled={!amount || txState === TransactionState.LOADING}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            !amount
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : txState === TransactionState.LOADING
                ? "bg-slate-700 text-slate-400 cursor-wait"
                : txState === TransactionState.SUCCESS
                  ? "bg-emerald-500 text-white"
                  : "bg-[#f7931a] hover:bg-[#e08517] text-white shadow-xl hover:shadow-[#f7931a]/20 active:scale-[0.98]"
          }`}
        >
          {txState === TransactionState.LOADING ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              Confirming Transaction...
            </>
          ) : txState === TransactionState.SUCCESS ? (
            "Transaction Complete!"
          ) : activeTab === "deposit" ? (
            "Stake BTC"
          ) : (
            "Unstake BTC"
          )}
        </button>

        <p className="text-[10px] text-center text-slate-500 px-4">
          By depositing, you agree to the StackBTC terms of service. No lock-up
          period, withdrawal available anytime.
        </p>
      </div>

      {/* ERC-4626 Metadata Tooltip Area */}
      <div className="mt-8 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
        <span className="flex items-center gap-1">
          <ShieldCheckIcon className="w-3 h-3" /> Non-Custodial
        </span>
        <span className="flex items-center gap-1">
          <CodeIcon className="w-3 h-3" /> ERC-4626
        </span>
        <span className="flex items-center gap-1">
          <ZapIcon className="w-3 h-3" /> Starknet-Native
        </span>
      </div>
    </div>
  );
};

type IconProps = React.SVGProps<SVGSVGElement>;

const ShieldCheckIcon = (props: IconProps) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const CodeIcon = (props: IconProps) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);
const ZapIcon = (props: IconProps) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default DepositCard;
