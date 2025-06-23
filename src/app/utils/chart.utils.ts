/**
 * Chart-specific utility functions
 */

import { BitcoinPriceData, TimeframeOption, TIMEFRAMES } from '../types/bitcoin.types';
import { SimplifiedTweet, TweetMarker } from '../types/twitter.types';

/**
 * Find the closest price point for a given timestamp
 */
export const findClosestPrice = (
  data: BitcoinPriceData[], 
  targetTime: number
): number => {
  if (data.length === 0) return 104379; // Current BTC price from Binance

  const closest = data.reduce((prev, curr) => 
    Math.abs(curr.time - targetTime) < Math.abs(prev.time - targetTime) 
      ? curr 
      : prev
  );

  return closest.close;
};

/**
 * Convert tweets to chart markers with price mapping
 */
export const createTweetMarkers = (
  tweets: SimplifiedTweet[], 
  chartData: BitcoinPriceData[],
  timeframe: string
): TweetMarker[] => {
  if (!chartData.length || !tweets.length) return [];

  const timeframeInfo = TIMEFRAMES.find(tf => tf.value === timeframe);
  if (!timeframeInfo) return [];

  const chartStartTime = Math.min(...chartData.map(d => d.time));
  const chartEndTime = Math.max(...chartData.map(d => d.time));
  const chartDuration = chartEndTime - chartStartTime;
  return tweets
    .map((tweet, index) => {
      const tweetTime = Math.floor(new Date(tweet.created_at).getTime() / 1000);
      
      // Validate tweet time
      if (isNaN(tweetTime) || tweetTime <= 0) {
        console.warn('Invalid tweet date:', tweet.created_at);
        return null;
      }
      
      // For short timeframes, distribute tweets across visible range
      let adjustedTime: number;
      if (timeframeInfo.minutes <= 60) { // For 5m, 15m, 1h
        const spreadDuration = Math.min(chartDuration * 0.8, 24 * 60 * 60); // Max 24h spread
        adjustedTime = chartEndTime - (index * spreadDuration / tweets.length);
      } else {
        adjustedTime = tweetTime;
      }

      // Ensure time is within chart bounds
      adjustedTime = Math.max(chartStartTime, Math.min(adjustedTime, chartEndTime));
      
      const price = findClosestPrice(chartData, adjustedTime);

      return {
        time: adjustedTime,
        price,
        tweet
      };
    })
    .filter((marker): marker is NonNullable<typeof marker> => marker !== null) // Filter out invalid times
    .sort((a, b) => a.time - b.time);
};

/**
 * Generate historical price data for given timeframe
 */
export const generateHistoricalData = (
  timeframe: string, 
  days: number,
  basePrice: number = 104379
): BitcoinPriceData[] => {
  const timeframeInfo = TIMEFRAMES.find(tf => tf.value === timeframe);
  if (!timeframeInfo) return [];
  const intervalMs = timeframeInfo.minutes * 60 * 1000;
  const totalPoints = Math.min(200, Math.floor((days * 24 * 60 * 60 * 1000) / intervalMs)); // Limit points
  const data: BitcoinPriceData[] = [];
  
  let currentPrice = basePrice;
  const now = Date.now();
  const startTime = now - (totalPoints * intervalMs);
  for (let i = 0; i < totalPoints; i++) {
    const time = Math.floor((startTime + (i * intervalMs)) / 1000); // Convert to seconds for chart
    
    // Add realistic price movement
    const volatility = 0.002; // 0.2% max change per interval
    const change = (Math.random() - 0.5) * 2 * volatility;
    const priceChange = currentPrice * change;
    
    // Apply mean reversion to keep price in realistic range
    const targetPrice = basePrice;
    const meanReversion = (targetPrice - currentPrice) * 0.001;
    
    currentPrice += priceChange + meanReversion;    // Ensure price stays in reasonable range
    currentPrice = Math.max(100000, Math.min(110000, currentPrice));
    
    const open = i === 0 ? currentPrice : data[i - 1]?.close ?? currentPrice;
    const high = Math.max(open, currentPrice) + (Math.random() * 100);
    const low = Math.min(open, currentPrice) - (Math.random() * 100);
    
    data.push({
      time,
      open,
      high,
      low,
      close: currentPrice,
      value: currentPrice
    });
  }

  return data;
};

/**
 * Update the last candle with new price data
 */
export const updateLastCandle = (
  data: BitcoinPriceData[], 
  newPrice: number
): BitcoinPriceData[] => {
  if (data.length === 0) return data;

  const updatedData = [...data];
  const lastCandle = { ...updatedData[updatedData.length - 1] };
  
  lastCandle.close = newPrice;
  lastCandle.high = Math.max(lastCandle.high, newPrice);
  lastCandle.low = Math.min(lastCandle.low, newPrice);
  lastCandle.value = newPrice;
  
  updatedData[updatedData.length - 1] = lastCandle;
  
  return updatedData;
};

/**
 * Get chart configuration for lightweight-charts
 */
export const getChartConfig = (width: number, height: number) => ({
  width,
  height,
  layout: {
    background: { color: '#1e222d' },
    textColor: '#d1d4dc',
  },
  grid: {
    vertLines: { color: '#2a2e39' },
    horzLines: { color: '#2a2e39' },
  },
  crosshair: {
    mode: 1, // Normal crosshair mode
  },
  timeScale: {
    timeVisible: true,
    secondsVisible: false,
    borderColor: '#485158',
  },
  rightPriceScale: {
    borderColor: '#485158',
  },
});
