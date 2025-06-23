/**
 * Bitcoin price and chart related types
 */

export interface BitcoinPriceData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  value?: number; // For compatibility
}

export interface PricePoint {
  time: number;
  price: number;
}

export interface TimeframeOption {
  value: string;
  label: string;
  minutes: number;
  days: number;
}

export interface ChartConfig {
  width: number;
  height: number;
  layout: {
    background: { color: string };
    textColor: string;
  };
  grid: {
    vertLines: { color: string };
    horzLines: { color: string };
  };
  crosshair: {
    mode: number;
  };
  timeScale: {
    timeVisible: boolean;
    secondsVisible: boolean;
    borderColor: string;
  };
}

export const TIMEFRAMES: readonly TimeframeOption[] = [
  { value: '5m', label: '5m', minutes: 5, days: 1 },
  { value: '15m', label: '15m', minutes: 15, days: 1 },
  { value: '1h', label: '1h', minutes: 60, days: 7 },
  { value: '4h', label: '4h', minutes: 240, days: 14 },
  { value: '1d', label: '1d', minutes: 1440, days: 30 },
] as const;

export const DEFAULT_TIMEFRAME = '1h';
export const BTC_PRICE_RANGE = { min: 100000, max: 110000 } as const;
