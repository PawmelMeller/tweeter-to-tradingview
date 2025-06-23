import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { 
  LiquidationData, 
  LiquidationStats, 
  LIQUIDATION_CONFIG 
} from '../types/liquidation.types';
import { MockLiquidationGenerator } from '../utils/mock-liquidations.utils';

@Injectable({
  providedIn: 'root'
})
export class LiquidationService {
  private readonly mockGenerator = MockLiquidationGenerator.getInstance();

  /**
   * Get real-time liquidation data (using mock data for demo)
   * In production, this would call a backend API that aggregates liquidation data
   */
  getLiquidationData(): Observable<LiquidationData[]> {
    // Use mock data for demo purposes
    // In production, you would call your backend API here
    return of(this.mockGenerator.generateFreshData());
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
   * Get live liquidation feed (simulated updates every 30 seconds)
   */
  getLiveLiquidationFeed(): Observable<LiquidationData[]> {
    return timer(0, LIQUIDATION_CONFIG.UPDATE_INTERVAL).pipe(
      switchMap(() => this.getLiquidationData())
    );
  }

  /**
   * Calculate comprehensive statistics from liquidation data
   */
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
      (largest && largest.value > current.value) ? largest : current, 
      null as LiquidationData | null
    );

    // Generate exchange breakdown
    const topExchanges = this.mockGenerator
      .generateExchangeVolumes(total24h)
      .slice(0, 3); // Top 3

    return {
      total24h,
      longLiqs24h,
      shortLiqs24h,
      largestLiq24h,
      topExchanges
    };
  }
}
