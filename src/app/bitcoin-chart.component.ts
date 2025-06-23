import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { createChart, IChartApi, ISeriesApi, ColorType, UTCTimestamp } from 'lightweight-charts';
import { interval, Subscription, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

interface KlineData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface BinanceKline {
  0: string; // Open time
  1: string; // Open price
  2: string; // High price
  3: string; // Low price
  4: string; // Close price
  5: string; // Volume
  6: string; // Close time
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  attachments?: {
    media_keys?: string[];
  };
}

interface MediaItem {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
}

interface TweetResponse {
  data: Tweet[];
  includes?: {
    media?: MediaItem[];
  };
}

interface TweetMarker {
  time: UTCTimestamp;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'circle';
  text: string;
  size: number;
}

@Component({
  selector: 'app-bitcoin-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h2>Bitcoin (BTC/USD)</h2>
        <div class="price-display">
          <span class="current-price">\${{ currentPrice | number:'1.2-2' }}</span>
          <span class="status" [class.live]="isLive">{{ isLive ? '🟢 LIVE' : '🔴 OFFLINE' }}</span>
        </div>
      </div>      <div class="tweet-legend">
        <h3>Tweet Legend:</h3>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-dot text-tweet"></span>
            <span>Text Tweet</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot image-tweet"></span>
            <span>Image Tweet</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot video-tweet"></span>
            <span>Video Tweet</span>
          </div>
        </div>
      </div>
      
        <div class="chart-controls">
        <button (click)="refreshChart()" class="refresh-btn">🔄 Refresh</button>
        <span class="time-info">1-minute candles from last 14 days (multi-batch)</span>
      </div><div class="chart-wrapper">
        <div #chartContainer class="chart" [style.display]="loading ? 'none' : 'block'" style="height: 600px !important;"></div>
        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading Bitcoin data...</p>
        </div>
        <div *ngIf="error" class="error">
          <p>{{ error }}</p>
          <button (click)="refreshChart()">Try Again</button>
        </div>
      </div>      <div class="chart-info">
        <span>Data points: {{ dataPoints }}</span>
        <span>Last update: {{ lastUpdate | date:'HH:mm:ss' }}</span>
      </div>
    </div>
  `,
  styles: [`    .chart-container {
      background: #1e1e1e;
      border-radius: 8px;
      padding: 20px;
      margin: 0;
      color: #ffffff;
      width: 100%;
      box-sizing: border-box;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .chart-header h2 {
      margin: 0;
      color: #f7931a;
    }

    .price-display {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .current-price {
      font-size: 24px;
      font-weight: bold;
      color: #00d4aa;
    }

    .status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      background: #333;
    }

    .status.live {
      background: #00d4aa;
      color: #000;
    }    .chart-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }

    .refresh-btn {
      padding: 8px 16px;
      border: 1px solid #444;
      background: #2a2a2a;
      color: #fff;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .refresh-btn:hover {
      background: #3a3a3a;
      border-color: #666;
    }

    .time-info {
      color: #888;
      font-size: 14px;
      margin-left: auto;
    }    .chart-wrapper {
      position: relative;
      min-height: 600px;
    }    .chart {
      width: 100%;
      height: 600px !important;
      min-height: 600px;
    }

    .loading, .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 600px;
      color: #888;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #333;
      border-top: 4px solid #f7931a;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .chart-info {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 12px;
      color: #888;
    }

    .error p {
      margin-bottom: 10px;
    }    .error button {
      padding: 8px 16px;
      background: #f7931a;
      border: none;
      border-radius: 4px;
      color: #000;
      cursor: pointer;
    }

    .tweet-legend {
      margin-top: 20px;
      padding: 15px;
      background: #2a2a2a;
      border-radius: 8px;
    }

    .tweet-legend h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #fff;
    }

    .legend-items {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }

    .legend-dot.text-tweet {
      background: #1DA1F2; /* Twitter blue */
    }    .legend-dot.image-tweet {
      background: #FF6B6B; /* Red for images */
    }

    .legend-dot.video-tweet {
      background: #9B59B6; /* Purple for videos */
    }
  `]
})
export class BitcoinChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  chart: IChartApi | null = null;
  candlestickSeries: ISeriesApi<'Candlestick'> | null = null;
    currentPrice = 0;
  dataPoints = 0;
  lastUpdate: Date | null = null;
  loading = true;
  error = '';
  isLive = false;  tweets: Tweet[] = [];
  mediaItems: MediaItem[] = [];
  private chartData: KlineData[] = []; // Store chart data locally

  private updateSubscription: Subscription | null = null;
  private priceSubscription: Subscription | null = null;
  private latestDataSubscription: Subscription | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.startPriceUpdates();
  }
  ngAfterViewInit() {
    // Dodaj krótkie opóźnienie aby zapewnić że DOM jest gotowy
    setTimeout(() => {
      this.initChart();
      this.loadChartData();
      this.loadTweets();
    }, 100);
  }

  ngOnDestroy() {
    this.stopUpdates();
    if (this.chart) {
      this.chart.remove();
    }
  }
  private initChart() {
    if (!this.chartContainer?.nativeElement) {
      console.error('Chart container not found');
      return;
    }

    const container = this.chartContainer.nativeElement;
    const containerWidth = container.clientWidth || window.innerWidth - 40; // fallback width
    
    console.log('Initializing chart with width:', containerWidth);

    this.chart = createChart(container, {
      width: containerWidth,
      height: 600,
      layout: {
        background: { type: ColorType.Solid, color: '#1e1e1e' },
        textColor: '#ffffff',
      },
      grid: {
        vertLines: { color: '#2a2a2a' },
        horzLines: { color: '#2a2a2a' },
      },
      crosshair: {
        mode: 1,
      },      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#444',
        rightOffset: 30,
      },
      rightPriceScale: {
        borderColor: '#444',
      },
    });

    this.candlestickSeries = this.chart.addCandlestickSeries({
      upColor: '#00d4aa',
      downColor: '#ff4976',
      borderDownColor: '#ff4976',
      borderUpColor: '#00d4aa',
      wickDownColor: '#ff4976',
      wickUpColor: '#00d4aa',
    });

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  private handleResize() {
    if (this.chart && this.chartContainer?.nativeElement) {
      const newWidth = this.chartContainer.nativeElement.clientWidth || window.innerWidth - 40;
      this.chart.applyOptions({
        width: newWidth
      });
    }
  }  private getIntervalFromTimeframe(timeframe: string): string {
    return '1m'; // Używamy 1-minutowych świec
  }  private getStartTime(): Date {
    const now = new Date();
    // Wczytaj dane z ostatnich 14 dni (możesz zmienić na dowolną liczbę)
    const daysBack = 14;
    
    const startTime = new Date(now);
    startTime.setDate(now.getDate() - daysBack);
    startTime.setHours(0, 0, 0, 0); // Zaczynamy od początku dnia
    
    console.log(`Loading data from ${daysBack} days back: ${startTime.toLocaleString()}`);
    return startTime;
  }private loadChartData() {
    this.loading = true;
    this.error = '';

    const startTime = this.getStartTime();
    const endTime = new Date();
    
    console.log('Loading chart data from:', startTime, 'to:', endTime);
    
    // Pobierz dane w partiach po 1000 świeczek
    this.loadChartDataInBatches(startTime, endTime);
  }

  private async loadChartDataInBatches(startTime: Date, endTime: Date) {
    const allData: KlineData[] = [];
    let currentStart = new Date(startTime);
    const batchSize = 1000 * 60 * 1000; // 1000 minut w milisekundach
    
    try {
      while (currentStart < endTime) {
        const currentEnd = new Date(Math.min(currentStart.getTime() + batchSize, endTime.getTime()));
        
        const startTimestamp = Math.floor(currentStart.getTime());
        const endTimestamp = Math.floor(currentEnd.getTime());
        
        const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=${startTimestamp}&endTime=${endTimestamp}&limit=1000`;
        
        console.log(`Fetching batch from ${currentStart.toLocaleString()} to ${currentEnd.toLocaleString()}`);
        
        const response = await this.http.get<BinanceKline[]>(url).toPromise();
        const batchData = this.transformBinanceData(response || []);
        
        // Usuń duplikaty (ostatnia świeca z poprzedniej partii)
        if (allData.length > 0 && batchData.length > 0) {
          const lastTime = allData[allData.length - 1].time;
          const filteredBatch = batchData.filter(candle => candle.time > lastTime);
          allData.push(...filteredBatch);
        } else {
          allData.push(...batchData);
        }
        
        currentStart = new Date(currentEnd.getTime() + 60000); // +1 minuta
        
        // Krótka pauza żeby nie przeciążyć API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`Total candles loaded: ${allData.length}`);
      
      if (allData.length > 0) {
        console.log('First candle time:', new Date(allData[0].time * 1000));
        console.log('Last candle time:', new Date(allData[allData.length - 1].time * 1000));
        console.log('Last candle close price:', allData[allData.length - 1].close);
        
        this.updateChart(allData);
        this.dataPoints = allData.length;
        this.lastUpdate = new Date();
        this.isLive = true;
      }
      
    } catch (error) {
      console.error('Error loading chart data in batches:', error);
      this.error = 'Failed to load chart data. Please try again.';
    }
      this.loading = false;
  }

  private transformBinanceData(data: BinanceKline[]): KlineData[] {
    return data.map(kline => ({
      time: (parseInt(kline[0]) / 1000) as UTCTimestamp,
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4])
    }));
  }  private updateChart(data: KlineData[]) {
    console.log('Updating chart with', data.length, 'data points');
    if (this.candlestickSeries && data.length > 0) {
      this.candlestickSeries.setData(data);
      
      // Store chart data locally for incremental updates
      this.chartData = [...data];
      
      // Get current price from live ticker instead of candle close
      this.updateCurrentPrice();
      
      // Add tweet markers after chart data is set
      this.addTweetMarkers();
      
      // Fit content to show all data
      this.chart?.timeScale().fitContent();
      console.log('Chart updated successfully');
    } else {
      console.error('Cannot update chart: candlestickSeries =', this.candlestickSeries, 'data length =', data.length);
    }
  }private startPriceUpdates() {
    // Load full chart data initially and every 30 minutes
    this.updateSubscription = interval(30 * 60 * 1000).subscribe(() => {
      console.log('Refreshing full chart data...');
      this.loadChartData();
    });

    // Update with latest candles every 60 seconds
    const latestDataSubscription = interval(60000).subscribe(() => {
      this.updateLatestCandles();
    });    // Update current price every 1 second for live pricing (no chart reload)
    this.priceSubscription = interval(1000).subscribe(() => {
      this.updateCurrentPrice();
    });

    // Store the latest data subscription for cleanup
    if (!this.latestDataSubscription) {
      this.latestDataSubscription = latestDataSubscription;
    }
  }
  private updateLatestCandles() {
    if (!this.candlestickSeries) {
      console.log('No candlestick series available for update');
      return;
    }

    // Get latest 10 candles to update/add new data
    const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=10`;
    
    console.log('Fetching latest candles...');
    
    this.http.get<BinanceKline[]>(url).pipe(
      map(data => this.transformBinanceData(data)),
      catchError(error => {
        console.error('Error fetching latest candles:', error);
        return of([]);
      })
    ).subscribe(newData => {
      if (newData.length > 0) {
        console.log('Received', newData.length, 'latest candles');
        console.log('Latest candle:', {
          time: new Date(newData[newData.length - 1].time * 1000),
          close: newData[newData.length - 1].close
        });
        
        // Update only the latest candles without full reload
        this.appendLatestCandles(newData);
      } else {
        console.log('No new candle data received');
      }
    });
  }  private appendLatestCandles(newCandles: KlineData[]) {
    if (!this.candlestickSeries || newCandles.length === 0) {
      console.log('Cannot append candles: no series or no data');
      return;
    }

    const currentData = this.getCurrentChartData();
    
    if (currentData.length === 0) {
      console.log('No existing data, setting new data');
      this.candlestickSeries.setData(newCandles);
      this.chartData = [...newCandles];
      return;
    }

    console.log('Current data has', currentData.length, 'candles');
    console.log('Last current candle:', {
      time: new Date(currentData[currentData.length - 1].time * 1000),
      close: currentData[currentData.length - 1].close
    });

    let hasUpdates = false;
    let updatedCount = 0;
    let addedCount = 0;
    
    // Sort new candles by time to ensure proper order
    const sortedNewCandles = [...newCandles].sort((a, b) => a.time - b.time);
    
    // Only process candles that are newer than or equal to the last candle we have
    const lastCurrentTime = currentData[currentData.length - 1].time;
    const relevantCandles = sortedNewCandles.filter(candle => candle.time >= lastCurrentTime);
    
    console.log(`Processing ${relevantCandles.length} relevant candles from ${sortedNewCandles.length} total`);
    
    relevantCandles.forEach(newCandle => {
      if (newCandle.time === lastCurrentTime) {
        // Update the last existing candle
        const lastIndex = currentData.length - 1;
        const oldCandle = currentData[lastIndex];
        
        if (oldCandle.close !== newCandle.close || 
            oldCandle.high !== newCandle.high || 
            oldCandle.low !== newCandle.low) {
          
          // Update our local data
          currentData[lastIndex] = newCandle;
            // Update the chart - this should be safe as we're updating the last candle
          try {
            this.candlestickSeries?.update(newCandle);
            hasUpdates = true;
            updatedCount++;
            
            console.log('Updated last candle at', new Date(newCandle.time * 1000), 
                       'price changed from', oldCandle.close, 'to', newCandle.close);
          } catch (error) {
            console.error('Error updating last candle:', error);
            console.error('Error details:', error);
            // If update fails, reload all data to ensure chart is in sync
            console.log('Reloading all chart data due to update error...');
            this.candlestickSeries?.setData([...currentData]);
            hasUpdates = true;
            updatedCount++;
          }
        }
      } else if (newCandle.time > lastCurrentTime) {
        // Add completely new candle
        currentData.push(newCandle);
          try {
          this.candlestickSeries?.update(newCandle);
          hasUpdates = true;
          addedCount++;
          
          console.log('Added new candle at', new Date(newCandle.time * 1000), 
                     'price:', newCandle.close);
        } catch (error) {
          console.error('Error adding new candle:', error);
          console.error('Error details:', error);
          // If update fails, reload all data to ensure chart is in sync
          console.log('Reloading all chart data due to add error...');
          this.candlestickSeries?.setData([...currentData]);
          hasUpdates = true;
          addedCount++;
        }
      }
    });
    
    if (hasUpdates) {
      // Update stored data
      this.chartData = [...currentData];
      this.dataPoints = this.chartData.length;
      this.lastUpdate = new Date();
      
      console.log(`Chart updated: ${updatedCount} updated, ${addedCount} added. Total: ${this.chartData.length} candles`);
      console.log('Latest chart price:', this.chartData[this.chartData.length - 1].close);
    } else {
      console.log('No updates needed - data is current');
    }
  }
  private getCurrentChartData(): KlineData[] {
    return this.chartData;
  }
  private updateCurrentPrice() {
    const url = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';
    
    this.http.get<{symbol: string, price: string}>(url).pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (data) {
        const newPrice = parseFloat(data.price);
        console.log('Current BTC price from API:', newPrice);
        this.currentPrice = newPrice;
        this.isLive = true;
        
        // Update the chart with the new price
        this.updateChartWithCurrentPrice(newPrice);
      } else {
        this.isLive = false;
      }
    });
  }

  private updateChartWithCurrentPrice(currentPrice: number) {
    if (!this.chart || !this.candlestickSeries || this.chartData.length === 0) {
      console.log('Chart not ready for price update');
      return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const currentMinute = Math.floor(currentTime / 60) * 60; // Round down to minute
    
    const lastCandle = this.chartData[this.chartData.length - 1];
    const lastCandleTime = Number(lastCandle.time);
    
    console.log('Updating chart with current price:', currentPrice);
    console.log('Current minute timestamp:', currentMinute);
    console.log('Last candle time:', lastCandleTime);
    
    if (currentMinute === lastCandleTime) {
      // Same minute - update the last candle's close price and high/low if needed
      const updatedCandle: KlineData = {
        ...lastCandle,
        close: currentPrice,
        high: Math.max(lastCandle.high, currentPrice),
        low: Math.min(lastCandle.low, currentPrice)      };
      
      this.chartData[this.chartData.length - 1] = updatedCandle;
      
      try {
        this.candlestickSeries.update(updatedCandle);
        console.log('Updated last candle with new price:', updatedCandle);
      } catch (error) {
        console.error('Error updating candle with current price:', error);
        console.error('Error details:', error);
        // If update fails, reload all data
        console.log('Reloading all chart data due to price update error...');
        this.candlestickSeries.setData([...this.chartData]);
      }
      
    } else if (currentMinute > lastCandleTime) {
      // New minute - create a new candle
      const newCandle: KlineData = {
        time: currentMinute as UTCTimestamp,
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice      };
      
      this.chartData.push(newCandle);
      
      try {
        this.candlestickSeries.update(newCandle);
        console.log('Added new candle for current price:', newCandle);
      } catch (error) {
        console.error('Error adding candle for current price:', error);
        console.error('Error details:', error);
        // If update fails, reload all data
        console.log('Reloading all chart data due to new candle error...');
        this.candlestickSeries.setData([...this.chartData]);
      }
    }
  }private stopUpdates() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    if (this.priceSubscription) {
      this.priceSubscription.unsubscribe();
    }
    if (this.latestDataSubscription) {
      this.latestDataSubscription.unsubscribe();
    }
  }

  refreshChart() {
    this.loadChartData();
  }  private loadTweets() {
    this.http.get<TweetResponse>('/api/mock-tweets').pipe(
      catchError(error => {
        console.error('Error loading tweets:', error);
        return of({data: [], includes: {media: []}});
      })
    ).subscribe(response => {
      this.tweets = response.data || [];
      this.mediaItems = response.includes?.media || [];
      this.addTweetMarkers();
    });
  }  private addTweetMarkers() {
    if (!this.candlestickSeries || this.tweets.length === 0) {
      return;
    }

    const markers = this.tweets.map(tweet => {
      const tweetTime = Math.floor(new Date(tweet.created_at).getTime() / 1000) as UTCTimestamp;
      
      let color = '#1DA1F2'; // Default blue for text tweets
      
      if (tweet.attachments?.media_keys && tweet.attachments.media_keys.length > 0) {
        // Find the media type for this tweet
        const mediaKey = tweet.attachments.media_keys[0];
        const mediaItem = this.mediaItems.find(media => media.media_key === mediaKey);
        
        if (mediaItem) {
          switch (mediaItem.type) {
            case 'photo':
              color = '#FF6B6B'; // Red for images
              break;
            case 'video':
            case 'animated_gif':
              color = '#9B59B6'; // Purple for videos/gifs
              break;
            default:
              color = '#FF6B6B'; // Default to red for unknown media
          }
        }
      }
      
      return {
        time: tweetTime,
        position: 'belowBar' as const,
        color: color,
        shape: 'circle' as const,
        text: '', // No text displayed
        size: 1
      };
    }).sort((a, b) => a.time - b.time); // Sort by time ascending

    this.candlestickSeries.setMarkers(markers);
  }
}
