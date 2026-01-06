
export interface VaultStats {
  apyBase: number;
  apyBonus: number;
  tvlBtc: number;
  tvlUsd: number;
  sharePrice: number;
  asset: string;
}

export interface AllocationData {
  name: string;
  value: number;
  color: string;
  protocol: string;
  [key: string]: string | number;
}

export enum TransactionState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
