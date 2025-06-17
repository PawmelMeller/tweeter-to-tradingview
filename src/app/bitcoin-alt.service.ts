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

@Injectable({
  providedIn: 'root'
})
export class BitcoinAltService {
  private currentPrice: number = 0;
  private mockData: BitcoinPriceData[] = [];

  constructor(private http: HttpClient) {
    this.generateMockData();
  }  /**
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
   * Pobiera dane historyczne - używa mock danych z realistyczną symulacją
   */
  getBitcoinPriceHistory(days: number = 1): Observable<BitcoinPriceData[]> {
    console.log(`Generating ${days} days of Bitcoin history...`);
    
    // Najpierw spróbuj pobrać aktualną cenę
    return this.getCurrentBitcoinPrice().pipe(
      map(currentPrice => {
        this.currentPrice = currentPrice;
        return this.generateHistoricalData(days, currentPrice);
      }),
      catchError(error => {
        console.warn('Using full mock data:', error);
        return of(this.mockData.slice(-24 * days)); // Ostatnie N*24 godzin
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
      map(response => parseFloat(response.price)),
      catchError(this.handleError)
    );
  }
  /**
   * Mock price - fallback gdy API nie działają
   */
  private getMockPrice(): Observable<number> {
    // Dla aktualizacji co sekundę - bardzo małe, realistyczne zmiany
    if (!this.currentPrice || this.currentPrice === 0) {
      this.currentPrice = 65000 + (Math.random() - 0.5) * 5000; // Pierwsza cena: 62.5k-67.5k
    }
    
    // Bardzo małe wahania dla aktualizacji co sekundę (±0.01% - ±0.1%)
    const maxVariation = this.currentPrice * 0.001; // ±0.1% max
    const variation = (Math.random() - 0.5) * maxVariation;
    this.currentPrice = Math.max(45000, this.currentPrice + variation);
    
    // Dodaj lekki trend co jakiś czas
    const trendFactor = Math.sin(Date.now() / 60000) * 0.0001; // Bardzo subtelny trend
    this.currentPrice = this.currentPrice * (1 + trendFactor);
    
    console.log('Live mock Bitcoin price:', this.currentPrice.toFixed(2));
    return of(Math.round(this.currentPrice * 100) / 100);
  }

  /**
   * Generuje realistyczne dane historyczne na podstawie aktualnej ceny
   */
  private generateHistoricalData(days: number, currentPrice: number): BitcoinPriceData[] {
    const data: BitcoinPriceData[] = [];
    const hoursBack = days * 24;
    const now = Math.floor(Date.now() / 1000);
    
    let price = currentPrice;
    
    // Generuj dane od teraz wstecz
    for (let i = 0; i < hoursBack; i++) {
      const timestamp = now - (i * 3600); // Co godzinę
      
      // Dodaj realistyczne wahania (±2%)
      const variation = (Math.random() - 0.5) * 0.04; // ±2%
      price = price * (1 + variation);
      
      // Dodaj trend (lekki wzrost lub spadek)
      const trend = Math.sin(i / 10) * 0.001; // Bardzo subtelny trend
      price = price * (1 + trend);
      
      data.unshift({
        time: timestamp,
        value: Math.round(price * 100) / 100
      });
    }
    
    console.log(`Generated ${data.length} historical data points`);
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
  }
}
