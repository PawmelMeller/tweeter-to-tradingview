import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry, delay } from 'rxjs/operators';

export interface BitcoinPriceData {
  time: number;
  value: number;
}

// Binance API Response
export interface BinanceKlineResponse {
  0: string; // Open time
  1: string; // Open price
  2: string; // High price
  3: string; // Low price
  4: string; // Close price
  5: string; // Volume
  6: string; // Close time
  7: string; // Quote asset volume
  8: number; // Number of trades
  9: string; // Taker buy base asset volume
  10: string; // Taker buy quote asset volume
  11: string; // Ignore
}

// CoinDesk API Response
export interface CoinDeskResponse {
  bpi: {
    USD: {
      rate_float: number;
    }
  };
}

@Injectable({
  providedIn: 'root'
})
export class BitcoinService {
  // Primary: Binance API (no rate limits for basic calls)
  private readonly BINANCE_API = 'https://api.binance.com/api/v3';
  // Fallback: CoinDesk API (more reliable, less rate limiting)
  private readonly COINDESK_API = 'https://api.coindesk.com/v1/bpi/currentprice.json';
  
  constructor(private http: HttpClient) {}

  /**
   * Pobiera dane cenowe Bitcoina z Binance API (dużo bardziej niezawodne)
   * @param limit Liczba punktów danych (domyślnie 100)
   * @returns Observable z danymi cenowymi
   */
  getBitcoinPriceHistory(limit: number = 100): Observable<BitcoinPriceData[]> {
    const url = `${this.BINANCE_API}/klines`;
    const params = {
      symbol: 'BTCUSDT',
      interval: '1h', // 1 godzina
      limit: limit.toString()
    };

    return this.http.get<BinanceKlineResponse[]>(url, { params }).pipe(
      map(response => this.transformBinanceData(response)),
      retry(2), // Retry 2 times on failure
      catchError((error) => {
        console.warn('Binance API failed, trying fallback...', error);
        return this.getFallbackData();
      })
    );
  }

  /**
   * Pobiera aktualną cenę Bitcoina z CoinDesk API (backup)
   */
  getCurrentBitcoinPrice(): Observable<number> {
    return this.http.get<CoinDeskResponse>(this.COINDESK_API).pipe(
      map(response => response.bpi.USD.rate_float),
      retry(2),
      catchError((error) => {
        console.warn('CoinDesk API failed, using mock price', error);
        // Fallback price around current BTC price
        return of(65000 + Math.random() * 5000);
      })
    );
  }

  /**
   * Alias dla getCurrentBitcoinPrice dla kompatybilności
   */
  getBitcoinLivePrice(): Observable<number> {
    return this.getCurrentBitcoinPrice();
  }

  /**
   * Pobiera dane z ostatnich godzin (dla live chart)
   */
  getBitcoinRecentPrices(hours: number = 24): Observable<BitcoinPriceData[]> {
    return this.getBitcoinPriceHistory(hours); // Binance zwraca hourly data
  }

  /**
   * Przekształca dane z Binance API do formatu aplikacji
   */
  private transformBinanceData(klines: BinanceKlineResponse[]): BitcoinPriceData[] {
    return klines.map(kline => ({
      time: parseInt(kline[0]) / 1000, // Convert to seconds for lightweight-charts
      value: parseFloat(kline[4]) // Close price
    }));
  }

  /**
   * Generuje dane fallback gdy API nie działa
   */
  private getFallbackData(): Observable<BitcoinPriceData[]> {
    console.log('Using fallback mock data for Bitcoin chart');
    const now = Date.now() / 1000;
    const basePrice = 65000;
    const data: BitcoinPriceData[] = [];
    
    // Generate last 24 hours of mock data
    for (let i = 23; i >= 0; i--) {
      const time = now - (i * 3600); // 1 hour intervals
      const randomChange = (Math.random() - 0.5) * 2000; // +/- $1000 variation
      const value = basePrice + randomChange + (Math.sin(i / 4) * 1000); // Some wave pattern
      
      data.push({ time, value });
    }
    
    return of(data);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} - ${error.message}`;
      
      if (error.status === 429) {
        errorMessage += ' (Rate limit exceeded - switching to fallback data)';
      }
    }
    
    console.error('Bitcoin API Error:', errorMessage);
    return throwError(errorMessage);
  }
}
