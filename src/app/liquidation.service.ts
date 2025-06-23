import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

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
  topExchanges: { name: string; volume: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class LiquidationService {
  private mockData: LiquidationData[] = [];
  private readonly exchanges = ['Binance', 'OKX', 'Bybit', 'BitMEX', 'dYdX'];

  constructor(private http: HttpClient) {
    this.generateMockData();
  }
  /**
   * Get real-time liquidation data (using mock data for demo)
   * In production, this would call a backend API that aggregates liquidation data
   */
  getLiquidationData(): Observable<LiquidationData[]> {
    // Use mock data for demo purposes
    // In production, you would call your backend API here
    return of(this.getMockLiquidationData());
  }

  /**
   * Get liquidation statistics for the last 24 hours
   */
  getLiquidationStats(): Observable<LiquidationStats> {
    return this.getLiquidationData().pipe(
      map(liquidations => this.calculateStats(liquidations))
    );
  }
  /**
   * Get live liquidation feed (simulated updates every 10 seconds)
   */
  getLiveLiquidationFeed(): Observable<LiquidationData[]> {
    return timer(0, 10000).pipe( // Update every 10 seconds
      switchMap(() => this.getLiquidationData())
    );
  }
  private generateMockData(): void {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Generate realistic liquidation patterns for the last 24 hours
    for (let i = 0; i < 50; i++) {
      const time = now - Math.random() * oneDay;
      const basePrice = 102000 + Math.random() * 4000; // $102k - $106k range
      
      // Add some price volatility based on time
      const volatility = Math.sin(time / (1000 * 60 * 60)) * 500; // Hourly volatility
      const price = basePrice + volatility + (Math.random() - 0.5) * 1000;
      
      const isLong = Math.random() > 0.45; // Slightly more longs (typical in bull market)
      
      // Realistic liquidation sizes
      let sizeMultiplier = 1;
      const rand = Math.random();
      if (rand < 0.02) sizeMultiplier = 200; // 2% chance of massive liquidation (100+ BTC)
      else if (rand < 0.08) sizeMultiplier = 50; // 6% chance of large liquidation (20+ BTC)
      else if (rand < 0.25) sizeMultiplier = 10; // 17% chance of medium liquidation (5+ BTC)
      else if (rand < 0.60) sizeMultiplier = 3; // 35% chance of small liquidation (1-3 BTC)
      
      const size = (Math.random() * 2 + 0.1) * sizeMultiplier;

      this.mockData.push({
        symbol: 'BTC',
        side: isLong ? 'long' : 'short',
        size: size,
        price: price,
        time: time,
        value: size * price
      });
    }

    // Sort by time, newest first
    this.mockData.sort((a, b) => b.time - a.time);
  }
  private getMockLiquidationData(): LiquidationData[] {
    // Add some new recent liquidations to keep it fresh
    const now = Date.now();
    const recentCount = Math.floor(Math.random() * 3) + 1; // 1-3 new liquidations

    for (let i = 0; i < recentCount; i++) {
      const price = 102000 + Math.random() * 4000; // Current BTC price range
      const isLong = Math.random() > 0.5;
      
      // Simulate different liquidation sizes based on market conditions
      let sizeMultiplier = 1;
      const rand = Math.random();
      if (rand < 0.05) sizeMultiplier = 100; // 5% chance of massive liquidation
      else if (rand < 0.15) sizeMultiplier = 50; // 10% chance of large liquidation
      else if (rand < 0.35) sizeMultiplier = 10; // 20% chance of medium liquidation
      
      const size = (Math.random() * 3 + 0.1) * sizeMultiplier;

      this.mockData.unshift({
        symbol: 'BTC',
        side: isLong ? 'long' : 'short',
        size: size,
        price: price,
        time: now - Math.random() * 600000, // Within last 10 minutes
        value: size * price
      });
    }

    // Keep only last 100 liquidations and ensure realistic distribution
    if (this.mockData.length > 100) {
      this.mockData = this.mockData.slice(0, 100);
    }

    // Add some market volatility patterns
    this.addVolatilityPatterns();

    return [...this.mockData];
  }

  private addVolatilityPatterns(): void {
    // Simulate high liquidation periods (market dumps/pumps)
    const shouldAddVolatility = Math.random() < 0.1; // 10% chance
    
    if (shouldAddVolatility) {
      const now = Date.now();
      const isMarketDump = Math.random() > 0.5;
      const basePrice = 102000 + Math.random() * 4000;
      
      // Add cluster of liquidations in a short time period
      for (let i = 0; i < 5 + Math.floor(Math.random() * 10); i++) {
        const price = basePrice + (Math.random() - 0.5) * 1000; // Price variation
        const size = (Math.random() * 20 + 5); // Larger liquidations during volatility
        
        this.mockData.unshift({
          symbol: 'BTC',
          side: isMarketDump ? 'long' : 'short', // Mostly longs in dump, shorts in pump
          size: size,
          price: price,
          time: now - Math.random() * 300000, // Within last 5 minutes
          value: size * price
        });
      }
    }
  }

  private calculateStats(liquidations: LiquidationData[]): LiquidationStats {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Filter last 24 hours
    const recent = liquidations.filter(liq => liq.time >= oneDayAgo);

    const longLiqs = recent.filter(liq => liq.side === 'long');
    const shortLiqs = recent.filter(liq => liq.side === 'short');

    const total24h = recent.reduce((sum, liq) => sum + liq.value, 0);
    const longLiqs24h = longLiqs.reduce((sum, liq) => sum + liq.value, 0);
    const shortLiqs24h = shortLiqs.reduce((sum, liq) => sum + liq.value, 0);

    // Find largest liquidation
    const largestLiq24h = recent.reduce((largest, current) => 
      (largest && largest.value > current.value) ? largest : current, null
    );

    // Mock top exchanges data
    const topExchanges = this.exchanges.map(name => ({
      name,
      volume: Math.random() * total24h * 0.3 // Random distribution
    })).sort((a, b) => b.volume - a.volume);

    return {
      total24h,
      longLiqs24h,
      shortLiqs24h,
      largestLiq24h,
      topExchanges: topExchanges.slice(0, 3) // Top 3
    };
  }
}
