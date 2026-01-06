
import { AllocationData } from './types';

export const COLORS = {
  bitcoin: '#f7931a',
  starknet: '#4e5ee4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  slate: '#1e293b'
};

export const ALLOCATION_STRATEGY: AllocationData[] = [
  { name: 'Base Lending', value: 80, color: COLORS.bitcoin, protocol: 'Vesu' },
  { name: 'Yield-on-Yield', value: 15, color: COLORS.starknet, protocol: 'Ekubo' },
  { name: 'Safety Buffer', value: 5, color: '#64748b', protocol: 'Liquidity Reserve' }
];

export const RISKS = [
  {
    title: 'Principal Preservation',
    description: '100% of your deposited BTC principal is kept in the base lending market. Only interest is used for secondary LP strategies.',
    icon: '🛡️'
  },
  {
    title: 'No Liquidation Risk',
    description: 'We do not take any loans against your collateral. This is a pure yield-aggregation strategy.',
    icon: '⚓'
  },
  {
    title: 'Protocol Risk',
    description: 'Funds are subject to the security of Vesu and Ekubo smart contracts on Starknet.',
    icon: '⛓️'
  }
];
