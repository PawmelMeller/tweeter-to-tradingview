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
      <div class="chart-header">
        <div class="price-info">
          <h3>Bitcoin (BTC/USD)</h3>
          <div class="current-price" *ngIf="currentPrice > 0">
            <span class="price">\${{ currentPrice.toFixed(2) }}</span>
            <span class="live-indicator live-pulse">� LIVE • 1s</span>
          </div>
        </div>
        <div class="chart-actions">
          <button (click)="refreshChart()" class="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>
      
      <div #chartContainer class="chart-area">
        <div *ngIf="loading" class="loading">
          <p>📊 Loading Bitcoin data...</p>
          <div class="spinner"></div>
        </div>
        
        <div *ngIf="!loading && bitcoinData.length > 0" class="chart-content">
          <div class="price-info-bar">
            <span>Last 24 hours • {{ bitcoinData.length }} data points</span>
            <span *ngIf="tweets.length > 0">• {{ tweets.length }} tweets loaded</span>
          </div>          <div class="simple-chart">
            <canvas #canvas width="800" height="500"></canvas>
          </div>
        </div>
        
        <div *ngIf="!loading && bitcoinData.length === 0" class="error-state">
          <p>⚠️ Unable to load Bitcoin data</p>
          <p>Using fallback data source...</p>
          <button (click)="loadBitcoinData()" class="retry-btn">Try Again</button>
        </div>
      </div>
        <div class="chart-footer" *ngIf="bitcoinData.length > 0">
        <small>
          Data source: Binance API • Updated every 1 second
          <span *ngIf="lastUpdate"> • Last update: {{ lastUpdate | date:'HH:mm:ss' }}</span>
        </small>
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
      animation: pulse 1s infinite;
    }
    
    .live-pulse {
      animation: fastPulse 0.5s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
    
    @keyframes fastPulse {
      0% { opacity: 1; background: #FF1744; }
      50% { opacity: 0.8; background: #D32F2F; }
      100% { opacity: 1; background: #FF1744; }
    }
    
    .refresh-btn {
      background: #F7931A;
      color: white;
      border: none;
      padding: 8px 16px;
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
      min-height: 600px; /* Zwiększona wysokość dla linii z tweetami */
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(145deg, #f8f9fa, #ffffff);
      border-radius: 8px;
      border: 1px solid #e9ecef;
      position: relative;
    }
    
    .loading {
      text-align: center;
      color: #666;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #F7931A;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .chart-content {
      width: 100%;
      padding: 20px;
    }
    
    .price-info-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      font-size: 0.9em;
      color: #666;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }
      .simple-chart {
      width: 100%;
      height: 500px; /* Zwiększona wysokość wykresu */
      background: white;
      border-radius: 8px;
      border: 1px solid #ddd;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .simple-chart canvas {
      max-width: 100%;
      max-height: 100%;
    }
    
    .error-state {
      text-align: center;
      color: #666;
      padding: 40px;
    }
    
    .retry-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      margin-top: 12px;
    }
    
    .chart-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      color: #666;
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() tweets: SimplifiedTweet[] = [];
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  bitcoinData: BitcoinPriceData[] = [];
  currentPrice: number = 0;
  loading: boolean = true;
  lastUpdate: Date | null = null;
  private updateSubscription?: Subscription;

  constructor(private bitcoinService: BitcoinAltService) {}

  ngOnInit() {
    console.log('Chart component initialized');
    this.loadBitcoinData();
    this.startLiveUpdates();
  }

  ngAfterViewInit() {
    console.log('Chart component view initialized');
    // Draw chart after view is ready
    if (this.bitcoinData.length > 0) {
      this.drawSimpleChart();
    }
  }

  ngOnDestroy() {
    console.log('Chart component destroyed');
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  loadBitcoinData() {
    this.loading = true;
      // Load historical data
    this.bitcoinService.getBitcoinPriceHistory(1).subscribe({
      next: (data: BitcoinPriceData[]) => {
        console.log('Bitcoin data loaded:', data.length, 'points');
        this.bitcoinData = data;
        this.loading = false;
        this.lastUpdate = new Date();
        
        if (data.length > 0) {
          this.currentPrice = data[data.length - 1].value;
          setTimeout(() => this.drawSimpleChart(), 100);
        }
      },
      error: (error: any) => {
        console.error('Error loading Bitcoin data:', error);
        this.loading = false;
        this.generateFallbackData();
      }
    });
  }

  refreshChart() {
    console.log('Refreshing chart data...');
    this.loadBitcoinData();
  }  private startLiveUpdates() {
    // Update price every second for real-time updates
    this.updateSubscription = interval(1000).subscribe(() => {
      this.bitcoinService.getCurrentBitcoinPrice().subscribe({
        next: (price: number) => {
          console.log('Live price update:', price);
          this.currentPrice = price;
          this.lastUpdate = new Date();
            // Add new data point
          const newPoint: BitcoinPriceData = {
            time: Math.floor(Date.now() / 1000),
            value: price
          };
          
          this.bitcoinData.push(newPoint);
          
          // Keep only last 5 minutes of data for 1-second updates (300 points max)
          if (this.bitcoinData.length > 300) {
            this.bitcoinData = this.bitcoinData.slice(-300);
          }
          
          this.drawSimpleChart();
        },
        error: (error: any) => {
          console.warn('Live price update failed:', error);
        }
      });
    });
  }

  private generateFallbackData() {
    console.log('Generating fallback data...');
    const now = Date.now() / 1000;
    const basePrice = 65000;
    this.bitcoinData = [];
    
    for (let i = 23; i >= 0; i--) {
      const time = now - (i * 3600);
      const randomChange = (Math.random() - 0.5) * 3000;
      const value = basePrice + randomChange + (Math.sin(i / 4) * 1500);
      
      this.bitcoinData.push({ time, value });
    }
    
    this.currentPrice = this.bitcoinData[this.bitcoinData.length - 1].value;
    this.lastUpdate = new Date();
    setTimeout(() => this.drawSimpleChart(), 100);
  }

  private drawSimpleChart() {
    if (!this.canvas || !this.bitcoinData.length) return;
    
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Find min/max values
    const values = this.bitcoinData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding + (i * chartWidth / 6);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }
    
    // Draw price line
    ctx.strokeStyle = '#F7931A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    this.bitcoinData.forEach((point, index) => {
      const x = padding + (index / (this.bitcoinData.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = '#F7931A';
    this.bitcoinData.forEach((point, index) => {
      const x = padding + (index / (this.bitcoinData.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    // Y-axis labels (prices)
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range * i / 5);
      const y = padding + chartHeight - (i * chartHeight / 5);
      ctx.fillText('$' + value.toFixed(0), padding - 10, y + 4);
    }
    
    // X-axis labels (time)
    ctx.textAlign = 'center';
    for (let i = 0; i <= 6; i++) {
      const dataIndex = Math.floor((i / 6) * (this.bitcoinData.length - 1));
      if (this.bitcoinData[dataIndex]) {
        const date = new Date(this.bitcoinData[dataIndex].time * 1000);
        const timeStr = date.getHours().toString().padStart(2, '0') + ':00';
        const x = padding + (i * chartWidth / 6);
        ctx.fillText(timeStr, x, canvas.height - 10);
      }
    }
    
    // Chart title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Bitcoin Price Chart (24h)', canvas.width / 2, 25);
  }
}
