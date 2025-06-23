import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface BitcoinPriceData {
  time: number;
  value: number;
}

// Binance API response
interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

// Binance Klines (historical data) response
interface BinanceKlineResponse {
  0: string; // Open time
  1: string; // Open price
  2: string; // High price
  3: string; // Low price
  4: string; // Close price
  5: string; // Volume
  6: string; // Close time
  // ... other fields we don't need
}

@Injectable({
  providedIn: 'root'
})
export class BitcoinAltService {
  private currentPrice: number = 0;
  private mockData: BitcoinPriceData[] = [];
  constructor(private http: HttpClient) {
    this.resetPrice(); // Ustaw realistyczną cenę na start
    this.generateMockData();
  }/**
   * Próbuje pobrać cenę z Binance API lub używa mock data
   */
  getCurrentBitcoinPrice(): Observable<number> {
    console.log('Fetching Bitcoin price from Binance...');
    
    // Używaj tylko Binance API, potem mock
    return this.getBinancePrice().pipe(
      timeout(5000),
      catchError(error => {
        console.warn('Binance API failed, using mock price:', error);
        return this.getMockPrice();
      })
    );
  }
  /**
   * Pobiera dane historyczne - najpierw próbuje Binance API, potem mock
   */
  getBitcoinPriceHistory(days: number = 1): Observable<BitcoinPriceData[]> {
    console.log(`Fetching ${days} days of Bitcoin history from Binance...`);
    
    // Najpierw spróbuj pobrać historyczne dane z Binance
    return this.getBinanceHistoricalData(days).pipe(
      timeout(10000),
      catchError(error => {
        console.warn('Binance historical data failed, trying current price + generated history:', error);
        
        // Fallback: pobierz aktualną cenę i wygeneruj historię
        return this.getCurrentBitcoinPrice().pipe(
          map(currentPrice => {
            this.currentPrice = currentPrice;
            return this.generateHistoricalData(days, currentPrice);
          }),
          catchError(innerError => {
            console.warn('All APIs failed, using full mock data:', innerError);
            return of(this.mockData.slice(-24 * days));
          })
        );
      })
    );
  }

  /**
   * Pobiera recent prices dla live update
   */
  getBitcoinRecentPrices(minutes: number = 60): Observable<BitcoinPriceData[]> {
    const pointsCount = Math.min(minutes, 60); // Max 60 punktów
    
    return this.getCurrentBitcoinPrice().pipe(
      map(currentPrice => {
        return this.generateRecentData(pointsCount, currentPrice);
      }),
      catchError(error => {
        console.warn('Using mock recent data:', error);
        return of(this.mockData.slice(-pointsCount));
      })
    );
  }  /**
   * Binance API - wysokie limity
   */
  private getBinancePrice(): Observable<number> {
    return this.http.get<BinanceTickerResponse>('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT').pipe(
      map(response => {
        const price = parseFloat(response.price);
        // Sprawdź czy cena jest w realistycznym zakresie dla 2025
        if (price > 130000 || price < 80000) {
          console.warn('Binance price out of realistic range:', price, 'using fallback');
          throw new Error('Price out of range');
        }
        console.log('Binance price:', price);
        return price;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Pobiera historyczne dane z Binance Klines API
   */
  private getBinanceHistoricalData(days: number): Observable<BitcoinPriceData[]> {
    const interval = this.getKlineInterval(days);
    const limit = Math.min(1000, days * 24); // Maksymalnie 1000 punktów
    
    const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`;
    
    console.log(`Fetching Binance historical data: ${url}`);
    
    return this.http.get<BinanceKlineResponse[]>(url).pipe(
      map(klines => {
        const data: BitcoinPriceData[] = klines.map(kline => ({
          time: Math.floor(parseInt(kline[0]) / 1000), // Convert to seconds
          value: parseFloat(kline[4]) // Close price
        }));
        
        console.log(`Received ${data.length} historical data points from Binance`);
        
        // Uaktualnij currentPrice z najnowszego punktu
        if (data.length > 0) {
          this.currentPrice = data[data.length - 1].value;
        }
        
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Mapuje dni na odpowiedni interval dla Binance Klines
   */
  private getKlineInterval(days: number): string {
    if (days <= 1) return '5m';      // 1 dzień = 5-minutowe świece
    if (days <= 3) return '15m';     // 3 dni = 15-minutowe świece  
    if (days <= 7) return '1h';      // 7 dni = godzinowe świece
    if (days <= 30) return '4h';     // 30 dni = 4-godzinowe świece
    return '1d';                     // Więcej = dzienne świece
  }/**
   * Mock price - fallback gdy API nie działają
   */
  private getMockPrice(): Observable<number> {
    // Reset do aktualnej ceny Bitcoin (czerwiec 2025: ~$104k)
    if (!this.currentPrice || this.currentPrice === 0 || this.currentPrice > 120000 || this.currentPrice < 90000) {
      this.currentPrice = 104000 + (Math.random() - 0.5) * 2000; // 103k-105k aktualny zakres
      console.log('Current price was out of range, reset to:', this.currentPrice);
    }
    
    // Bardzo małe wahania dla aktualizacji co sekundę (±0.01% - ±0.05%)
    const maxVariation = this.currentPrice * 0.0003; // ±0.03% max
    const variation = (Math.random() - 0.5) * maxVariation;
    const newPrice = this.currentPrice + variation;
    
    // Dodaj lekki trend z ograniczeniami - wokół $104k
    const trendFactor = Math.sin(Date.now() / 600000) * 0.00002; // Bardzo subtelny trend
    this.currentPrice = Math.min(106000, Math.max(102000, newPrice * (1 + trendFactor))); // Ograniczenie 102k-106k
    
    console.log('Live mock Bitcoin price:', this.currentPrice.toFixed(2));
    return of(Math.round(this.currentPrice * 100) / 100);
  }  /**
   * Generuje realistyczne dane historyczne na podstawie aktualnej ceny
   */
  private generateHistoricalData(days: number, currentPrice: number): BitcoinPriceData[] {
    const data: BitcoinPriceData[] = [];
    const pointsPerDay = 24; // Co godzinę dla większej szczegółowości
    const totalPoints = days * pointsPerDay;
    const now = Math.floor(Date.now() / 1000);
      // Użyj aktualnej ceny Bitcoin (~$104k w czerwcu 2025)
    const basePrice = Math.min(106000, Math.max(102000, currentPrice)); // Ograniczenie 102k-106k
    
    // Generuj dane od teraz wstecz z realistycznymi wahaniami
    for (let i = 0; i < totalPoints; i++) {
      const timestamp = now - (i * 3600); // Co godzinę
      
      // Dodaj realistyczne wahania bez akumulacji błędów
      const trendFactor = Math.sin(i / 50) * 0.03; // Długoterminowy trend (±3%)
      const volatility = (Math.random() - 0.5) * 0.04; // Zmienność (±2%)
      const dailyCycle = Math.sin((i / 24) * 2 * Math.PI) * 0.015; // Cykl dzienny (±1.5%)
      
      const priceMultiplier = 1 + trendFactor + volatility + dailyCycle;
      const price = basePrice * priceMultiplier;
      
      // Zapewnij realistyczne limity dla czerwiec 2025
      const finalPrice = Math.min(108000, Math.max(100000, price));
      
      data.unshift({
        time: timestamp,
        value: Math.round(finalPrice * 100) / 100
      });
    }
    
    console.log(`Generated ${data.length} historical data points spanning ${days} days (${basePrice.toFixed(0)} base price)`);
    return data;
  }

  /**
   * Generuje recent data dla live updates
   */
  private generateRecentData(points: number, currentPrice: number): BitcoinPriceData[] {
    const data: BitcoinPriceData[] = [];
    const now = Math.floor(Date.now() / 1000);
    
    let price = currentPrice;
    
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = now - (i * 60); // Co minutę wstecz
      
      // Małe wahania dla recent data
      const variation = (Math.random() - 0.5) * 0.001; // ±0.1%
      price = price * (1 + variation);
      
      data.push({
        time: timestamp,
        value: Math.round(price * 100) / 100
      });
    }
    
    return data;
  }

  /**
   * Generuje dane mock na start
   */
  private generateMockData() {
    const basePrice = 64500;
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < 168; i++) { // 7 dni * 24 godziny
      const timestamp = now - ((168 - i) * 3600);
      const variation = Math.sin(i / 24) * 0.05 + (Math.random() - 0.5) * 0.02;
      const price = basePrice * (1 + variation);
      
      this.mockData.push({
        time: timestamp,
        value: Math.round(price * 100) / 100
      });
    }
    
    console.log('Mock data generated:', this.mockData.length, 'points');
  }

  /**
   * Obsługa błędów
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Bitcoin API error';
    
    if (error.status === 0) {
      errorMessage = 'Network error - check internet connection';
    } else if (error.status === 429) {
      errorMessage = 'API rate limit exceeded';
    } else if (error.status >= 500) {
      errorMessage = 'API server error';
    }

    console.error('Bitcoin API Error:', error);
    return throwError(() => new Error(errorMessage));
  }  /**
   * Reset ceny do realistycznych wartości (czerwiec 2025: ~$104k)
   */
  resetPrice() {
    const newPrice = 104000 + (Math.random() - 0.5) * 2000; // 103k-105k
    this.currentPrice = Math.round(newPrice * 100) / 100;
    console.log('Price reset to realistic 2025 value:', this.currentPrice);
  }
}
