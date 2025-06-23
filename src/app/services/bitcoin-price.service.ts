import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, timer } from 'rxjs';
import { map, catchError, tap, share, switchMap } from 'rxjs/operators';

import { 
  BitcoinPriceData, 
  PricePoint, 
  BTC_PRICE_RANGE, 
  DEFAULT_TIMEFRAME 
} from '../types/bitcoin.types';
import { generateHistoricalData, updateLastCandle } from '../utils/chart.utils';

interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

@Injectable({
  providedIn: 'root'
})
export class BitcoinPriceService {
  private readonly binanceUrl = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';
  private readonly currentPriceSubject = new BehaviorSubject<number>(104379);
  
  // Expose current price as observable
  readonly currentPrice$ = this.currentPriceSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /**
   * Get current Bitcoin price from Binance API with fallback to mock
   */
  getCurrentPrice(): Observable<number> {
    console.log('Fetching Bitcoin price from Binance...');
    
    return this.http.get<BinanceTickerResponse>(this.binanceUrl).pipe(
      map(response => {
        const price = parseFloat(response.price);
        console.log('Binance price:', price);
        this.currentPriceSubject.next(price);
        return price;
      }),
      catchError(error => {
        console.warn('Binance API failed, using mock price:', error.message);
        const mockPrice = this.generateMockPrice();
        this.currentPriceSubject.next(mockPrice);
        return of(mockPrice);
      }),
      share() // Share the observable to prevent multiple HTTP calls
    );
  }

  /**
   * Get historical Bitcoin price data for charting
   */
  getHistoricalData(timeframe: string = DEFAULT_TIMEFRAME, days: number = 7): Observable<BitcoinPriceData[]> {
    return this.getCurrentPrice().pipe(
      map(currentPrice => generateHistoricalData(timeframe, days, currentPrice)),
      tap(data => console.log(`Generated ${data.length} data points for ${timeframe} timeframe`))
    );
  }

  /**
   * Update existing chart data with new price (for live updates)
   */
  updateChartData(existingData: BitcoinPriceData[], newPrice: number): BitcoinPriceData[] {
    return updateLastCandle(existingData, newPrice);
  }

  /**
   * Start live price updates (every 5 seconds)
   */
  startLivePriceUpdates(): Observable<number> {
    return timer(0, 5000).pipe(
      switchMap(() => this.getCurrentPrice())
    );
  }

  /**
   * Generate mock price within realistic range
   */
  private generateMockPrice(): number {
    const { min, max } = BTC_PRICE_RANGE;
    const basePrice = (min + max) / 2;
    const variation = (Math.random() - 0.5) * 2000; // ±$1000 variation
    
    return Math.max(min, Math.min(max, basePrice + variation));
  }

  /**
   * Get the latest price from the subject (synchronous)
   */
  getLatestPrice(): number {
    return this.currentPriceSubject.value;
  }
}
