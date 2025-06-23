import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { createChart, ColorType, IChartApi, ISeriesApi, ITimeScaleApi, Time } from 'lightweight-charts';
import { BitcoinPriceService } from './services/bitcoin-price.service';
import { TwitterService } from './twitter.service';
import { interval, Subscription, from } from 'rxjs';

import { 
  BitcoinPriceData, 
  TIMEFRAMES, 
  DEFAULT_TIMEFRAME 
} from './types/bitcoin.types';
import { 
  SimplifiedTweet, 
  TweetMarker, 
  POPULAR_USERS 
} from './types/twitter.types';
import { 
  createTweetMarkers, 
  getChartConfig 
} from './utils/chart.utils';
import { formatTweetTime } from './utils/formatters.utils';

@Component({
  selector: 'app-chart',
  template: `
    <div class="chart-container">
      <!-- Header -->
      <div class="chart-header">
        <div class="price-info">
          <h3>Bitcoin (BTC/USD)</h3>          <div class="current-price" *ngIf="currentPrice > 0">
            <span class="price">\${{ currentPrice.toFixed(2) }}</span>
            <span class="live-indicator">🟢 LIVE</span>
          </div>
        </div>
        <div class="chart-controls">
          <!-- Timeframe Selector -->
          <div class="timeframe-buttons">
            <button 
              *ngFor="let tf of timeframes" 
              [class.active]="selectedTimeframe === tf.value"
              (click)="changeTimeframe(tf.value)">
              {{ tf.label }}
            </button>
          </div>
          <!-- Refresh Button -->
          <button (click)="refreshChart()" class="refresh-btn">🔄</button>
        </div>
      </div>
        <!-- Chart Area -->
      <div class="chart-area">
        <div class="chart-main">
          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading Bitcoin data...</p>
          </div>
          
          <div #chartContainer class="chart-canvas" *ngIf="!loading"></div>
          <!-- Status Bar -->
          <div class="status-bar" *ngIf="!loading && bitcoinData.length > 0">
            <span>{{ selectedTimeframe.toUpperCase() }} • {{ bitcoinData.length }} points</span>
            <span *ngIf="lastUpdate">• Updated: {{ lastUpdate | date:'HH:mm:ss' }}</span>
          </div>
        </div>        <!-- Tweets Panel -->
        <div class="tweets-panel">
          <div class="tweets-header">
            <h4>Fetch Tweets</h4>
          </div>
          
          <div class="tweets-form">
            <form [formGroup]="twitterForm" (ngSubmit)="fetchTweets()" class="form-content">
              <div class="form-field">
                <label>Popular Users</label>                <select 
                  [value]="twitterForm.get('username')?.value" 
                  (change)="onUsernameChange($event)"
                  class="select-input">
                  <option *ngFor="let user of popularUsers" [value]="user.value">
                    {{ user.name }}
                  </option>
                </select>
              </div>

              <div class="form-field">
                <label>Custom Username</label>
                <input 
                  type="text" 
                  formControlName="username" 
                  placeholder="e.g. elonmusk, BillyM2k"
                  class="text-input">
              </div>

              <div class="form-field">
                <label>Number of Tweets</label>
                <input 
                  type="number" 
                  formControlName="tweetCount" 
                  min="1" 
                  max="100"
                  placeholder="e.g. 20"
                  class="text-input">
              </div>

              <div class="form-actions">
                <button 
                  type="submit"
                  [disabled]="!twitterForm.valid || loadingTweets"
                  class="fetch-btn">
                  {{ loadingTweets ? 'Loading...' : 'Get Tweets' }}
                </button>
              </div>
            </form>
          </div>
          
          <div class="tweets-content">
            <div *ngIf="loadingTweets" class="loading-tweets">
              <div class="spinner-small"></div>
              <span>Fetching tweets...</span>
            </div>
            
            <div *ngIf="error" class="error-message">
              <strong>Error:</strong> {{ error }}
            </div>
            
            <div *ngIf="!loadingTweets && !error && tweets.length === 0" class="no-tweets">
              <p>No tweets found. Use the form above to fetch tweets.</p>
            </div>
            
            <div *ngIf="!loadingTweets && tweets.length > 0" class="tweets-list">
              <div *ngFor="let tweet of tweets.slice(0, 3)" class="tweet-item">
                <div class="tweet-header">
                  <span class="tweet-time">{{ formatTweetTime(tweet.created_at) }}</span>
                  <span class="tweet-metrics">
                    ❤️ {{ tweet.public_metrics.like_count }}
                    🔄 {{ tweet.public_metrics.retweet_count }}
                  </span>
                </div>
                <p class="tweet-text">{{ tweet.text }}</p>
              </div>
            </div>
            
            <div *ngIf="tweets.length > 3" class="tweets-count">
              <small>Showing 3 of {{ tweets.length }} tweets</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin: 0;
      box-shadow: 0 6px 20px rgba(0,0,0,0.12);
      border: 1px solid #e0e0e0;
      width: 100%;
    }
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f5f5f5;
    }
    
    .price-info h3 {
      margin: 0 0 8px 0;
      color: #F7931A;
      font-size: 1.4em;
      font-weight: 600;
    }
    
    .current-price {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .price {
      font-size: 1.5em;
      font-weight: bold;
      color: #2E7D32;
    }    .live-indicator {
      background: #FF1744;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: bold;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
    
    .chart-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .timeframe-buttons {
      display: flex;
      gap: 4px;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 4px;
    }
    
    .timeframe-buttons button {
      background: transparent;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      color: #666;
      transition: all 0.2s ease;
    }
    
    .timeframe-buttons button:hover {
      background: #e0e0e0;
    }
    
    .timeframe-buttons button.active {
      background: #F7931A;
      color: white;
    }
    
    .refresh-btn {
      background: #F7931A;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .refresh-btn:hover {
      background: #E87B00;
      transform: translateY(-1px);
    }      .chart-area {
      display: flex;
      gap: 20px;
      min-height: 500px;
      position: relative;
    }
    
    .chart-main {
      flex: 2;
      min-width: 0;
    }
    
    .chart-canvas {
      width: 100%;
      height: 500px;
      background: #1e222d;
      border-radius: 8px;
      border: 1px solid #2a2e39;
    }
      .tweets-panel {
      flex: 1;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      overflow: hidden;
      max-width: 380px;
      display: flex;
      flex-direction: column;
    }
    
    .tweets-header {
      padding: 16px;
      background: #ffffff;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .tweets-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.1em;
      font-weight: 600;
    }
    
    .tweets-form {
      padding: 16px;
      background: #ffffff;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .form-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .form-field label {
      font-size: 0.9em;
      font-weight: 500;
      color: #555;
    }
    
    .select-input, .text-input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.9em;
      outline: none;
      transition: border-color 0.2s ease;
    }
    
    .select-input:focus, .text-input:focus {
      border-color: #F7931A;
      box-shadow: 0 0 0 2px rgba(247, 147, 26, 0.2);
    }
    
    .form-actions {
      margin-top: 8px;
    }
    
    .fetch-btn {
      background: #F7931A;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      width: 100%;
      transition: background 0.2s ease;
    }
    
    .fetch-btn:hover:not(:disabled) {
      background: #E87B00;
    }
    
    .fetch-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .tweets-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      max-height: 250px;
    }
    
    .error-message {
      background: #fff5f5;
      border: 1px solid #fed7d7;
      color: #e53e3e;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 0.9em;
    }
    
    .loading-tweets {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #666;
      padding: 20px;
    }
    
    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #F7931A;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .no-tweets {
      text-align: center;
      color: #666;
      padding: 20px;
    }
    
    .tweets-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .tweet-item {
      background: white;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      font-size: 0.9em;
    }
    
    .tweet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .tweet-time {
      color: #666;
      font-size: 0.8em;
    }
    
    .tweet-metrics {
      color: #666;
      font-size: 0.8em;
    }
    
    .tweet-text {
      margin: 0;
      line-height: 1.4;
      color: #333;
    }
    
    .tweets-count {
      text-align: center;
      color: #666;
      margin-top: 12px;
      padding: 8px;
      background: white;
      border-radius: 6px;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      color: #666;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #F7931A;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 0.9em;
      color: #666;
    }
  `],  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class ChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() tweets: SimplifiedTweet[] = [];
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  // Data
  bitcoinData: BitcoinPriceData[] = [];
  currentPrice: number = 0;
  loading: boolean = true;
  lastUpdate: Date | null = null;
  selectedTimeframe: string = '1h';

  // Tweets
  twitterForm: FormGroup;
  loadingTweets: boolean = false;
  error: string = '';
  
  // Predefined popular users
  popularUsers = [
    { value: 'elonmusk', name: 'Elon Musk (@elonmusk)' },
    { value: 'BillyM2k', name: 'Billy Markus (@BillyM2k)' },
    { value: 'VitalikButerin', name: 'Vitalik Buterin (@VitalikButerin)' },
    { value: 'naval', name: 'Naval (@naval)' },
    { value: 'sundarpichai', name: 'Sundar Pichai (@sundarpichai)' }
  ];

  // Chart
  private chart: IChartApi | null = null;
  private lineSeries: ISeriesApi<'Line'> | null = null;
  private updateSubscription?: Subscription;
  // Configuration
  timeframes = [
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' }
  ];
  constructor(
    private bitcoinService: BitcoinPriceService,
    private twitterService: TwitterService,
    private fb: FormBuilder
  ) {
    this.twitterForm = this.fb.group({
      username: ['elonmusk', Validators.required],
      tweetCount: [20, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }  ngOnInit() {
    console.log('Chart initialized with', this.selectedTimeframe);
    
    // Reset price to realistic values
    // Reset any existing chart state if needed
    this.currentPrice = 104379; // Current BTC price from Binance
    
    // Load data on init and start live updates
    this.loadData();
    this.startLiveUpdates();
  }

  ngAfterViewInit() {
    if (this.bitcoinData.length > 0) {
      setTimeout(() => this.createChart(), 100);
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }  // Public Methods
  changeTimeframe(timeframe: string) {
    if (this.selectedTimeframe === timeframe) return;
    
    console.log('Changing timeframe to:', timeframe);
    this.selectedTimeframe = timeframe;
    this.cleanup();
    this.loadData();
    this.startLiveUpdates();
  }

  refreshChart() {
    console.log('Refreshing chart manually...');
    this.cleanup();
    this.loadData();
    this.startLiveUpdates();
  }

  // Private Methods
  private loadData() {
    this.loading = true;
    
    const days = this.getTimeframeDays(this.selectedTimeframe);
    
    this.bitcoinService.getHistoricalData(this.selectedTimeframe, days).subscribe({
      next: (data: BitcoinPriceData[]) => {
        console.log(`Loaded ${data.length} data points for ${this.selectedTimeframe}`);
        
        // Process data based on timeframe
        this.bitcoinData = this.processDataForTimeframe(data);
        this.loading = false;
        this.lastUpdate = new Date();
        
        if (this.bitcoinData.length > 0) {
          this.currentPrice = this.bitcoinData[this.bitcoinData.length - 1].value;
          setTimeout(() => this.createChart(), 100);
        }
      },
      error: (error: any) => {
        console.error('Error loading data:', error);
        this.generateMockData();
      }
    });
  }

  private processDataForTimeframe(data: BitcoinPriceData[]): BitcoinPriceData[] {
    if (data.length === 0) return [];
    
    // Sort data by time
    const sortedData = [...data].sort((a, b) => a.time - b.time);
    
    // Filter based on timeframe (simple decimation)
    const intervalMinutes = this.getTimeframeMinutes(this.selectedTimeframe);
    const intervalSeconds = intervalMinutes * 60;
    
    if (intervalMinutes <= 5) {
      // For 5m and smaller, use all data
      return sortedData.slice(-200); // Last 200 points
    }
    
    // For larger timeframes, decimate data
    const decimatedData: BitcoinPriceData[] = [];
    const step = Math.max(1, Math.floor(sortedData.length / 100)); // Target ~100 points
    
    for (let i = 0; i < sortedData.length; i += step) {
      decimatedData.push(sortedData[i]);
    }
    
    return decimatedData;
  }  private generateMockData() {
    console.log('Generating mock data for', this.selectedTimeframe);
    
    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds = this.getTimeframeMinutes(this.selectedTimeframe) * 60;
    const pointsCount = 100;
    
    this.bitcoinData = [];
    const basePrice = 104379; // Current BTC price from Binance
    
    for (let i = pointsCount - 1; i >= 0; i--) {
      const time = now - (i * intervalSeconds);
      
      // Generate realistic price movement around current price
      const randomChange = (Math.random() - 0.5) * 3000; // ±1500 random
      const trend = Math.sin(i / 20) * 2000; // ±2000 trend wave
      const dailyVariation = Math.sin(i / 50) * 1000; // ±1000 daily variation
        // Calculate price without accumulation
      const price = basePrice + randomChange + trend + dailyVariation;
      const finalPrice = Math.max(100000, Math.min(110000, price)); // Keep in realistic range
      
      // Create proper OHLC candle
      const open = i === 0 ? finalPrice : this.bitcoinData[this.bitcoinData.length - 1]?.close ?? finalPrice;
      const high = Math.max(open, finalPrice) + Math.random() * 100;
      const low = Math.min(open, finalPrice) - Math.random() * 100;
      
      this.bitcoinData.push({ 
        time, 
        open,
        high,
        low,
        close: finalPrice,
        value: finalPrice 
      });
    }      // Set current price to last generated price
    this.currentPrice = this.bitcoinData[this.bitcoinData.length - 1]?.close ?? 104379;
    this.loading = false;
    this.lastUpdate = new Date();
    
    console.log(`Generated mock data: ${this.bitcoinData.length} points, current price: $${this.currentPrice.toFixed(2)}`);
    setTimeout(() => this.createChart(), 100);
  }

  private createChart() {
    if (!this.chartContainer || this.bitcoinData.length === 0) return;
    
    // Remove existing chart
    if (this.chart) {
      this.chart.remove();
    }
      // Create new chart
    this.chart = createChart(this.chartContainer.nativeElement, {
      width: this.chartContainer.nativeElement.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#1e222d' },
        textColor: '#d1d4dc',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#F7931A', width: 1 },
        horzLine: { color: '#F7931A', width: 1 },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 3,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
      },
    });

    // Add line series
    this.lineSeries = this.chart.addLineSeries({
      color: '#F7931A',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });    // Set data (ensure it's sorted and properly formatted)
    const chartData = this.bitcoinData
      .sort((a, b) => a.time - b.time)
      .map(point => ({
        time: point.time as any, // lightweight-charts expects number for time
        value: point.close, // Use close price for line chart
      }));

    this.lineSeries.setData(chartData);

    // Add tweet markers if we have tweets
    this.addTweetMarkers();

    // Fit content
    this.chart.timeScale().fitContent();
  }  /**
   * Adds tweet markers to the chart
   */
  private addTweetMarkers() {
    if (!this.lineSeries || this.tweets.length === 0 || this.bitcoinData.length === 0) return;

    // Get the time range of the current chart data
    const chartStartTime = this.bitcoinData[0].time;
    const chartEndTime = this.bitcoinData[this.bitcoinData.length - 1].time;
    const chartDuration = chartEndTime - chartStartTime;
    
    console.log('Chart time range:', new Date(chartStartTime * 1000), 'to', new Date(chartEndTime * 1000));
    console.log('Chart duration (minutes):', chartDuration / 60);

    // For very short timeframes (like 5m), distribute tweets evenly across the visible range
    const intervalMinutes = this.getTimeframeMinutes(this.selectedTimeframe);
    const shouldDistribute = intervalMinutes <= 15 && chartDuration < 3600; // Less than 1 hour of data

    // Create markers with proper time handling and filtering
    const markers = this.tweets
      .map((tweet, index) => {
        const tweetDate = new Date(tweet.created_at);
        let tweetTime = Math.floor(tweetDate.getTime() / 1000);
        
        // Return null for invalid times
        if (isNaN(tweetTime) || tweetTime <= 0) {
          console.warn('Invalid tweet date:', tweet.created_at);
          return null;
        }

        if (shouldDistribute) {
          // For short timeframes, distribute tweets evenly across the chart
          const progress = index / Math.max(1, this.tweets.length - 1);
          tweetTime = Math.floor(chartStartTime + (progress * chartDuration));
          console.log(`Distributing tweet ${index + 1}/${this.tweets.length} at ${progress * 100}% of chart range`);
        } else {
          // For longer timeframes, use original logic but adjust if outside range
          if (tweetTime < chartStartTime || tweetTime > chartEndTime) {
            // For tweets outside range, map them to the closest point in the visible range
            if (tweetTime < chartStartTime) {
              // Tweet is too old, map to early part of chart
              const offsetRatio = Math.min(0.3, index / this.tweets.length); // First 30% of chart
              tweetTime = Math.floor(chartStartTime + (offsetRatio * chartDuration));
            } else {
              // Tweet is too new, map to later part of chart
              const offsetRatio = 0.7 + Math.min(0.3, index / this.tweets.length); // Last 30% of chart
              tweetTime = Math.floor(chartStartTime + (offsetRatio * chartDuration));
            }
            
            console.log('Adjusted tweet time from', tweetDate, 'to', new Date(tweetTime * 1000));
          }
        }

        // Find closest price point to align the marker properly
        const closestPrice = this.findClosestPrice(tweetTime);
        if (!closestPrice) {
          console.warn('No closest price found for tweet at time:', tweetTime);
          return null;
        }
        
        return {
          time: tweetTime as Time,
          position: 'aboveBar' as const,
          color: '#1DA1F2', // Twitter blue
          shape: 'circle' as const,
          text: '🐦',
          size: 1,
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null) // Filter out invalid times
      .sort((a, b) => (a.time as number) - (b.time as number)); // Sort by time ascending

    if (markers.length > 0) {
      // Double-check sorting before setting markers
      const isProperlyOrdered = markers.every((marker, index) => 
        index === 0 || (markers[index - 1].time as number) <= (marker.time as number)
      );
      
      if (!isProperlyOrdered) {
        console.error('Markers are not properly ordered by time!');
        return;
      }

      this.lineSeries.setMarkers(markers);
      console.log(`Added ${markers.length} tweet markers to chart (${shouldDistribute ? 'distributed' : 'time-based'})`);
      console.log('First marker time:', new Date((markers[0].time as number) * 1000));
      console.log('Last marker time:', new Date((markers[markers.length - 1].time as number) * 1000));
    } else {
      // Clear markers if none are valid
      this.lineSeries.setMarkers([]);
      console.log('No valid tweet markers to display');
    }
  }

  private startLiveUpdates() {
    // Update every 5 seconds
    this.updateSubscription = interval(5000).subscribe(() => {
      this.bitcoinService.getCurrentPrice().subscribe({
        next: (price: number) => {
          this.currentPrice = price;
          this.lastUpdate = new Date();
          
          // Update existing candle instead of adding new tick
          this.updateCurrentCandle(price);
        },
        error: (error: any) => {
          console.warn('Live update failed:', error);
        }
      });
    });
  }

  /**
   * Updates the current candle with new price instead of adding ticks
   */
  private updateCurrentCandle(newPrice: number) {
    if (this.bitcoinData.length === 0) return;
    
    const timeframeMinutes = this.getTimeframeMinutes(this.selectedTimeframe);
    const now = Math.floor(Date.now() / 1000);
    const currentCandleTime = Math.floor(now / (timeframeMinutes * 60)) * (timeframeMinutes * 60);
    
    // Get the last candle
    let lastCandle = this.bitcoinData[this.bitcoinData.length - 1];
    
    // Check if we need a new candle or update existing one
    if (lastCandle.time < currentCandleTime) {      // Create new OHLC candle
      const lastCandle = this.bitcoinData[this.bitcoinData.length - 1];
      const newCandle: BitcoinPriceData = {
        time: currentCandleTime,
        open: lastCandle ? lastCandle.close : newPrice,
        high: newPrice + Math.random() * 50,
        low: newPrice - Math.random() * 50,
        close: newPrice,
        value: newPrice
      };
      
      this.bitcoinData.push(newCandle);
      
      // Keep reasonable number of points
      if (this.bitcoinData.length > 200) {
        this.bitcoinData = this.bitcoinData.slice(-200);
      }    } else {
      // Update existing candle with new price
      lastCandle.close = newPrice;
      lastCandle.high = Math.max(lastCandle.high, newPrice);
      lastCandle.low = Math.min(lastCandle.low, newPrice);
      lastCandle.value = newPrice;
    }
    
    // Update chart
    if (this.lineSeries) {      const chartData = this.bitcoinData
        .sort((a, b) => a.time - b.time)
        .map(point => ({
          time: point.time as any,
          value: point.close, // Use close price for consistency
        }));
      
      this.lineSeries.setData(chartData);
    }
  }

  private cleanup() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
      this.updateSubscription = undefined;
    }
    
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
      this.lineSeries = null;
    }  }

  // Helper Methods
  private getTimeframeDays(timeframe: string): number {
    const days: { [key: string]: number } = {
      '5m': 1,
      '15m': 1,
      '1h': 7,      // 7 dni dla wykresu godzinowego
      '4h': 14,     // 14 dni dla wykresu 4-godzinnego  
      '1d': 30
    };
    return days[timeframe] || 1;
  }

  private getTimeframeMinutes(timeframe: string): number {
    const minutes: { [key: string]: number } = {
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };
    return minutes[timeframe] || 15;
  }

  // Tweets Methods
  onUsernameChange(event: any) {
    this.twitterForm.get('username')?.setValue(event.target.value);
  }

  fetchTweets() {
    if (!this.twitterForm.valid) return;

    const { username, tweetCount } = this.twitterForm.value;
    
    this.loadingTweets = true;
    this.error = '';
    this.tweets = [];
    
    console.log('Fetching tweets for:', username, 'count:', tweetCount);    from(this.twitterService.getTweets(username, tweetCount)).subscribe({
      next: (response: any) => {
        console.log('Tweets response:', response);
        this.tweets = response.data || [];
        this.loadingTweets = false;
        
        // Add tweet markers to chart after loading tweets
        this.addTweetMarkers();
      },
      error: (error: any) => {
        console.error('Error fetching tweets:', error);
        this.error = error.error || error.message || 'Błąd podczas pobierania tweetów';
        this.loadingTweets = false;
        
        // On error, show some mock tweets for demo
        this.tweets = [
          {
            id: '1',
            author_id: 'demo1',
            text: 'Bitcoin is looking strong today! 🚀 #BTC',
            created_at: new Date().toISOString(),
            public_metrics: { like_count: 45, retweet_count: 12, reply_count: 3, quote_count: 1 }
          },
          {
            id: '2',
            author_id: 'demo2',
            text: 'The crypto market is showing positive momentum. Bitcoin leading the way! 📈',
            created_at: new Date(Date.now() - 300000).toISOString(),
            public_metrics: { like_count: 78, retweet_count: 25, reply_count: 8, quote_count: 2 }
          },
          {
            id: '3',
            author_id: 'demo3',
            text: 'Just bought more Bitcoin. HODL strong! 💎🙌',
            created_at: new Date(Date.now() - 600000).toISOString(),
            public_metrics: { like_count: 23, retweet_count: 7, reply_count: 5, quote_count: 0 }
          }        ];
        
        // Add mock tweet markers to chart
        this.addTweetMarkers();
      }
    });
  }

  formatTweetTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  }

  /**
   * Find the closest price point to a given timestamp
   */
  private findClosestPrice(targetTime: number): BitcoinPriceData | null {
    if (this.bitcoinData.length === 0) return null;

    let closest = this.bitcoinData[0];
    let minDiff = Math.abs(targetTime - closest.time);

    for (const point of this.bitcoinData) {
      const diff = Math.abs(targetTime - point.time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest;
  }
}
