import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { BitcoinAltService, BitcoinPriceData } from './bitcoin-alt.service';
import { interval, Subscription } from 'rxjs';

interface SimplifiedTweet {
  author_id: string;
  text: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
    impression_count?: number;
    bookmark_count?: number;
  };
  id: string;
}

@Component({
  selector: 'app-chart',
  template: `
    <div class="chart-container">
      <!-- Header -->
      <div class="chart-header">
        <div class="price-info">
          <h3>Bitcoin (BTC/USD)</h3>
          <div class="current-price" *ngIf="currentPrice > 0">
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
        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading Bitcoin data...</p>
        </div>
        
        <div #chartContainer class="chart-canvas" *ngIf="!loading"></div>
        
        <!-- Status Bar -->
        <div class="status-bar" *ngIf="!loading && bitcoinData.length > 0">
          <span>{{ selectedTimeframe.toUpperCase() }} • {{ bitcoinData.length }} points</span>
          <span *ngIf="tweets.length > 0">• {{ tweets.length }} tweets</span>
          <span *ngIf="lastUpdate">• Updated: {{ lastUpdate | date:'HH:mm:ss' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin: 16px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
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
    }
    
    .live-indicator {
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
    }
    
    .chart-area {
      min-height: 400px;
      position: relative;
    }
    
    .chart-canvas {
      width: 100%;
      height: 400px;
      background: #1e222d;
      border-radius: 8px;
      border: 1px solid #2a2e39;
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
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() tweets: SimplifiedTweet[] = [];
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  // Data
  bitcoinData: BitcoinPriceData[] = [];
  currentPrice: number = 0;
  loading: boolean = true;
  lastUpdate: Date | null = null;
  selectedTimeframe: string = '15m';

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

  constructor(private bitcoinService: BitcoinAltService) {}

  ngOnInit() {
    console.log('Chart initialized with', this.selectedTimeframe);
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
  }

  // Public Methods
  changeTimeframe(timeframe: string) {
    if (this.selectedTimeframe === timeframe) return;
    
    console.log('Changing timeframe to:', timeframe);
    this.selectedTimeframe = timeframe;
    this.cleanup();
    this.loadData();
    this.startLiveUpdates();
  }

  refreshChart() {
    console.log('Refreshing chart...');
    this.cleanup();
    this.loadData();
    this.startLiveUpdates();
  }

  // Private Methods
  private loadData() {
    this.loading = true;
    
    const days = this.getTimeframeDays(this.selectedTimeframe);
    
    this.bitcoinService.getBitcoinPriceHistory(days).subscribe({
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
  }

  private generateMockData() {
    console.log('Generating mock data for', this.selectedTimeframe);
    
    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds = this.getTimeframeMinutes(this.selectedTimeframe) * 60;
    const pointsCount = 100;
    
    this.bitcoinData = [];
    let basePrice = 67000;
    
    for (let i = pointsCount - 1; i >= 0; i--) {
      const time = now - (i * intervalSeconds);
      
      // Generate realistic price movement
      const randomChange = (Math.random() - 0.5) * 2000;
      const trend = Math.sin(i / 20) * 1000;
      basePrice = Math.max(50000, Math.min(90000, basePrice + randomChange + trend));
      
      this.bitcoinData.push({ time, value: basePrice });
    }
    
    this.currentPrice = basePrice;
    this.loading = false;
    this.lastUpdate = new Date();
    
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
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
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
    });

    // Set data (ensure it's sorted)
    const chartData = this.bitcoinData
      .sort((a, b) => a.time - b.time)
      .map(point => ({
        time: point.time as any,
        value: point.value,
      }));

    this.lineSeries.setData(chartData);

    // Add tweet markers if available
    this.addTweetMarkers();

    // Fit content
    this.chart.timeScale().fitContent();
  }

  private addTweetMarkers() {
    if (!this.lineSeries || this.tweets.length === 0) return;
    
    const markers = this.tweets
      .map((tweet, index) => ({
        time: Math.floor(new Date(tweet.created_at).getTime() / 1000) as any,
        position: 'aboveBar' as const,
        color: '#2196F3',
        shape: 'arrowDown' as const,
        text: `Tweet ${index + 1}: ${tweet.public_metrics.like_count}♥`,
        size: 1,
      }))
      .filter(marker => {
        // Only show markers within chart time range
        const startTime = this.bitcoinData[0]?.time || 0;
        const endTime = this.bitcoinData[this.bitcoinData.length - 1]?.time || 0;
        return marker.time >= startTime && marker.time <= endTime;
      })
      .sort((a, b) => a.time - b.time); // Sort markers by time

    this.lineSeries.setMarkers(markers);
    console.log(`Added ${markers.length} tweet markers`);
  }

  private startLiveUpdates() {
    // Update every 5 seconds
    this.updateSubscription = interval(5000).subscribe(() => {
      this.bitcoinService.getCurrentBitcoinPrice().subscribe({
        next: (price: number) => {
          this.currentPrice = price;
          this.lastUpdate = new Date();
          
          // Add new point
          const newPoint = {
            time: Math.floor(Date.now() / 1000),
            value: price
          };
          
          this.bitcoinData.push(newPoint);
          
          // Keep reasonable number of points
          if (this.bitcoinData.length > 200) {
            this.bitcoinData = this.bitcoinData.slice(-200);
          }
          
          // Update chart
          if (this.lineSeries) {
            const chartData = this.bitcoinData
              .sort((a, b) => a.time - b.time)
              .map(point => ({
                time: point.time as any,
                value: point.value,
              }));
            
            this.lineSeries.setData(chartData);
          }
        },
        error: (error: any) => {
          console.warn('Live update failed:', error);
        }
      });
    });
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
    }
  }

  // Helper Methods
  private getTimeframeDays(timeframe: string): number {
    const days: { [key: string]: number } = {
      '5m': 1,
      '15m': 1,
      '1h': 3,
      '4h': 7,
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
}
