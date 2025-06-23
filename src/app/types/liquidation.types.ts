/**
 * Liquidation data types and interfaces
 */

export interface LiquidationData {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  time: number;
  value: number; // USD value of liquidation
}

export interface LiquidationStats {
  total24h: number;
  longLiqs24h: number;
  shortLiqs24h: number;
  largestLiq24h: LiquidationData | null;
  topExchanges: ExchangeVolume[];
}

export interface ExchangeVolume {
  name: string;
  volume: number;
}

export interface HeatmapBucket {
  label: string;
  value: number;
  intensity: number;
  count: number;
}

export type LiquidationSide = 'long' | 'short';

export const EXCHANGES = ['Binance', 'OKX', 'Bybit', 'BitMEX', 'dYdX'] as const;

export const LIQUIDATION_CONFIG = {
  UPDATE_INTERVAL: 30000, // 30 seconds
  HEATMAP_BUCKETS: 12, // 12 5-minute buckets for 1 hour
  BUCKET_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  MAX_LIQUIDATIONS: 100,
  VOLATILITY_CHANCE: 0.1, // 10% chance of volatility spike
} as const;
