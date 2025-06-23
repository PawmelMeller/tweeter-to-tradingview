/**
 * Mock data generation utilities for liquidations
 */

import { LiquidationData, EXCHANGES, LIQUIDATION_CONFIG } from '../types/liquidation.types';
import { randomInRange, weightedRandom } from './formatters.utils';

export class MockLiquidationGenerator {
  private static instance: MockLiquidationGenerator;
  private mockData: LiquidationData[] = [];

  private constructor() {
    this.generateInitialData();
  }

  static getInstance(): MockLiquidationGenerator {
    if (!MockLiquidationGenerator.instance) {
      MockLiquidationGenerator.instance = new MockLiquidationGenerator();
    }
    return MockLiquidationGenerator.instance;
  }

  /**
   * Generate initial 24h liquidation data
   */
  private generateInitialData(): void {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Generate realistic liquidation patterns for the last 24 hours
    for (let i = 0; i < 50; i++) {
      const time = now - Math.random() * oneDay;
      const liquidation = this.createRealisticLiquidation(time);
      this.mockData.push(liquidation);
    }

    // Sort by time, newest first
    this.mockData.sort((a, b) => b.time - a.time);
  }

  /**
   * Create a realistic liquidation with proper size distribution
   */
  private createRealisticLiquidation(time: number): LiquidationData {
    const basePrice = randomInRange(102000, 106000);
    
    // Add some price volatility based on time
    const volatility = Math.sin(time / (1000 * 60 * 60)) * 500; // Hourly volatility
    const price = basePrice + volatility + randomInRange(-1000, 1000);
    
    const isLong = Math.random() > 0.45; // Slightly more longs (typical in bull market)
    
    // Realistic liquidation sizes with weighted distribution
    const sizeWeights = [0.02, 0.06, 0.17, 0.35, 0.40]; // Massive, Large, Medium, Small, Tiny
    const sizeMultipliers = [200, 50, 10, 3, 1];
    const sizeCategory = weightedRandom(sizeWeights);
    const sizeMultiplier = sizeMultipliers[sizeCategory];
    
    const size = randomInRange(0.1, 2) * sizeMultiplier;

    return {
      symbol: 'BTC',
      side: isLong ? 'long' : 'short',
      size,
      price,
      time,
      value: size * price
    };
  }

  /**
   * Generate fresh liquidation data with recent updates
   */
  generateFreshData(): LiquidationData[] {
    // Add some new recent liquidations to keep it fresh
    const now = Date.now();
    const recentCount = Math.floor(Math.random() * 3) + 1; // 1-3 new liquidations

    for (let i = 0; i < recentCount; i++) {
      const time = now - Math.random() * 600000; // Within last 10 minutes
      const liquidation = this.createRealisticLiquidation(time);
      this.mockData.unshift(liquidation);
    }

    // Add volatility patterns occasionally
    this.maybeAddVolatilitySpike();

    // Keep only last 100 liquidations
    if (this.mockData.length > LIQUIDATION_CONFIG.MAX_LIQUIDATIONS) {
      this.mockData = this.mockData.slice(0, LIQUIDATION_CONFIG.MAX_LIQUIDATIONS);
    }

    return [...this.mockData];
  }

  /**
   * Simulate market volatility with liquidation clusters
   */
  private maybeAddVolatilitySpike(): void {
    const shouldAddVolatility = Math.random() < LIQUIDATION_CONFIG.VOLATILITY_CHANCE;
    
    if (!shouldAddVolatility) return;

    const now = Date.now();
    const isMarketDump = Math.random() > 0.5;
    const basePrice = randomInRange(102000, 106000);
    const volatilityCount = Math.floor(randomInRange(5, 15));
    
    // Add cluster of liquidations in a short time period
    for (let i = 0; i < volatilityCount; i++) {
      const price = basePrice + randomInRange(-1000, 1000);
      const size = randomInRange(5, 25); // Larger liquidations during volatility
      const time = now - Math.random() * 300000; // Within last 5 minutes
      
      this.mockData.unshift({
        symbol: 'BTC',
        side: isMarketDump ? 'long' : 'short', // Mostly longs in dump, shorts in pump
        size,
        price,
        time,
        value: size * price
      });
    }
  }

  /**
   * Generate mock exchange volume data
   */
  generateExchangeVolumes(totalVolume: number): Array<{ name: string; volume: number }> {
    return EXCHANGES.map(name => ({
      name,
      volume: Math.random() * totalVolume * 0.3 // Random distribution
    })).sort((a, b) => b.volume - a.volume);
  }
}
