import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidationService, LiquidationData, LiquidationStats } from './liquidation.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-liquidations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="liquidations-container">
      <!-- Header -->
      <div class="liquidations-header">        <div class="title-section">
          <h3>🔥 Liquidation Monitor</h3>
          <p>Real-time cryptocurrency liquidations (Demo with simulated data)</p>
        </div>
        <div class="refresh-section">
          <div class="live-indicator" *ngIf="!loading">🟢 LIVE</div>
          <div class="loading-indicator" *ngIf="loading">🔄 Loading...</div>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-overview" *ngIf="stats">
        <div class="stat-card total">
          <div class="stat-value">\${{ formatLargeNumber(stats.total24h) }}</div>
          <div class="stat-label">Total 24h Liquidations</div>
        </div>
        
        <div class="stat-card longs">
          <div class="stat-value">\${{ formatLargeNumber(stats.longLiqs24h) }}</div>
          <div class="stat-label">Long Liquidations</div>
          <div class="stat-percentage">{{ getLongPercentage() }}%</div>
        </div>
        
        <div class="stat-card shorts">
          <div class="stat-value">\${{ formatLargeNumber(stats.shortLiqs24h) }}</div>
          <div class="stat-label">Short Liquidations</div>
          <div class="stat-percentage">{{ getShortPercentage() }}%</div>
        </div>
        
        <div class="stat-card largest" *ngIf="stats.largestLiq24h">
          <div class="stat-value">\${{ formatLargeNumber(stats.largestLiq24h.value) }}</div>
          <div class="stat-label">Largest Single Liquidation</div>
          <div class="stat-side" [class]="stats.largestLiq24h.side">
            {{ stats.largestLiq24h.side.toUpperCase() }} &#64; \${{ stats.largestLiq24h.price.toFixed(0) }}
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="liquidations-content">
        <!-- Recent Liquidations -->
        <div class="recent-liquidations">
          <div class="section-header">
            <h4>💥 Recent Liquidations</h4>
            <div class="update-time" *ngIf="lastUpdate">
              Last update: {{ lastUpdate | date:'HH:mm:ss' }}
            </div>
          </div>
          
          <div class="liquidations-list" *ngIf="liquidations.length > 0">
            <div 
              *ngFor="let liq of liquidations.slice(0, 10); trackBy: trackByTime" 
              class="liquidation-item"
              [class]="liq.side">
              
              <div class="liq-main">
                <div class="liq-side-indicator" [class]="liq.side">
                  {{ liq.side === 'long' ? '📈' : '📉' }}
                </div>
                
                <div class="liq-details">
                  <div class="liq-amount">
                    <span class="size">{{ liq.size.toFixed(3) }} BTC</span>
                    <span class="value">(\${{ formatLargeNumber(liq.value) }})</span>
                  </div>
                  <div class="liq-price">&#64; \${{ liq.price.toFixed(2) }}</div>
                </div>
              </div>
              
              <div class="liq-time">
                {{ formatTime(liq.time) }}
              </div>
            </div>
          </div>

          <div *ngIf="liquidations.length === 0 && !loading" class="no-data">
            <p>No recent liquidations found</p>
          </div>
        </div>

        <!-- Exchange Breakdown -->
        <div class="exchange-breakdown" *ngIf="stats && stats.topExchanges.length > 0">
          <div class="section-header">
            <h4>🏢 Top Exchanges (24h)</h4>
          </div>
          
          <div class="exchanges-list">
            <div 
              *ngFor="let exchange of stats.topExchanges; let i = index" 
              class="exchange-item">
              
              <div class="exchange-rank">{{ i + 1 }}</div>
              <div class="exchange-name">{{ exchange.name }}</div>
              <div class="exchange-volume">
                <div class="volume-amount">\${{ formatLargeNumber(exchange.volume) }}</div>
                <div class="volume-bar">
                  <div 
                    class="volume-fill" 
                    [style.width.%]="(exchange.volume / stats.topExchanges[0].volume) * 100">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Heatmap Visualization -->
      <div class="liquidation-heatmap" *ngIf="liquidations.length > 0">
        <div class="section-header">
          <h4>🔥 Liquidation Heatmap (Last Hour)</h4>
        </div>
        
        <div class="heatmap-grid">
          <div 
            *ngFor="let bucket of getHeatmapData(); let i = index" 
            class="heatmap-cell"
            [class.active]="bucket.intensity > 0"
            [style.opacity]="bucket.intensity"
            [title]="'\$' + formatLargeNumber(bucket.value) + ' liquidated'">
            
            <div class="cell-time">{{ bucket.label }}</div>
            <div class="cell-value" *ngIf="bucket.value > 0">
              \${{ formatCompactNumber(bucket.value) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .liquidations-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin: 16px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
    }

    .liquidations-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f5f5f5;
    }

    .title-section h3 {
      margin: 0 0 4px 0;
      color: #FF4444;
      font-size: 1.4em;
      font-weight: 600;
    }

    .title-section p {
      margin: 0;
      color: #666;
      font-size: 0.9em;
    }

    .live-indicator {
      background: #FF1744;
      color: white;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: bold;
      animation: pulse 2s infinite;
    }

    .loading-indicator {
      color: #FF4444;
      font-weight: 500;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    /* Stats Overview */
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      border: 1px solid #dee2e6;
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card.total {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
      border-color: #ffeaa7;
    }

    .stat-card.longs {
      background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
      border-color: #bee5eb;
    }

    .stat-card.shorts {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      border-color: #f5c6cb;
    }

    .stat-card.largest {
      background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%);
      border-color: #d6d8db;
    }

    .stat-value {
      font-size: 1.5em;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.85em;
      color: #666;
      margin-bottom: 4px;
    }

    .stat-percentage {
      font-size: 0.8em;
      font-weight: 500;
      color: #555;
    }

    .stat-side {
      font-size: 0.8em;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .stat-side.long {
      background: #d4edda;
      color: #155724;
    }

    .stat-side.short {
      background: #f8d7da;
      color: #721c24;
    }

    /* Main Content */
    .liquidations-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .liquidations-content {
        grid-template-columns: 1fr;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.1em;
      font-weight: 600;
    }

    .update-time {
      font-size: 0.8em;
      color: #666;
    }

    /* Recent Liquidations */
    .recent-liquidations {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e9ecef;
    }

    .liquidations-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .liquidation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #ddd;
      transition: all 0.2s ease;
    }

    .liquidation-item:hover {
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .liquidation-item.long {
      border-left-color: #28a745;
    }

    .liquidation-item.short {
      border-left-color: #dc3545;
    }

    .liq-main {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .liq-side-indicator {
      font-size: 1.2em;
      padding: 4px;
      border-radius: 4px;
    }

    .liq-side-indicator.long {
      background: #d4edda;
    }

    .liq-side-indicator.short {
      background: #f8d7da;
    }

    .liq-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .liq-amount {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .size {
      font-weight: bold;
      color: #333;
    }

    .value {
      font-size: 0.9em;
      color: #666;
    }

    .liq-price {
      font-size: 0.85em;
      color: #888;
    }

    .liq-time {
      font-size: 0.8em;
      color: #999;
      text-align: right;
    }

    /* Exchange Breakdown */
    .exchange-breakdown {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e9ecef;
    }

    .exchanges-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .exchange-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .exchange-rank {
      background: #6c757d;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8em;
      font-weight: bold;
    }

    .exchange-name {
      font-weight: 500;
      color: #333;
      min-width: 60px;
    }

    .exchange-volume {
      flex: 1;
    }

    .volume-amount {
      font-size: 0.9em;
      font-weight: 500;
      color: #555;
      margin-bottom: 4px;
    }

    .volume-bar {
      width: 100%;
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      overflow: hidden;
    }

    .volume-fill {
      height: 100%;
      background: linear-gradient(90deg, #FF4444, #FF6B6B);
      transition: width 0.3s ease;
    }

    /* Heatmap */
    .liquidation-heatmap {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e9ecef;
    }

    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 4px;
      margin-top: 12px;
    }

    .heatmap-cell {
      aspect-ratio: 1;
      background: #FF4444;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4px;
      font-size: 0.7em;
      color: white;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      opacity: 0.1;
    }

    .heatmap-cell.active {
      opacity: 0.8;
    }

    .heatmap-cell:hover {
      transform: scale(1.1);
      z-index: 10;
    }

    .cell-time {
      font-size: 0.6em;
      margin-bottom: 2px;
    }

    .cell-value {
      font-weight: bold;
      font-size: 0.65em;
    }

    .no-data {
      text-align: center;
      color: #666;
      padding: 32px;
    }
  `]
})
export class LiquidationsComponent implements OnInit, OnDestroy {
  liquidations: LiquidationData[] = [];
  stats: LiquidationStats | null = null;
  loading = true;
  lastUpdate: Date | null = null;
  
  private subscription: Subscription = new Subscription();

  constructor(private liquidationService: LiquidationService) {}

  ngOnInit(): void {
    this.loadData();
    
    // Auto-refresh every 30 seconds
    this.subscription.add(
      interval(30000).subscribe(() => this.loadData())
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadData(): void {
    this.loading = true;
    
    // Load liquidation data
    this.subscription.add(
      this.liquidationService.getLiquidationData().subscribe({
        next: (data) => {
          this.liquidations = data;
          this.loading = false;
          this.lastUpdate = new Date();
        },
        error: (error) => {
          console.error('Error loading liquidation data:', error);
          this.loading = false;
        }
      })
    );

    // Load stats
    this.subscription.add(
      this.liquidationService.getLiquidationStats().subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading liquidation stats:', error);
        }
      })
    );
  }

  formatLargeNumber(value: number): string {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else {
      return value.toFixed(0);
    }
  }

  formatCompactNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(0) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    } else {
      return value.toFixed(0);
    }
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return 'just now';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + 'm ago';
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + 'h ago';
    } else {
      return date.toLocaleDateString();
    }
  }

  getLongPercentage(): number {
    if (!this.stats || this.stats.total24h === 0) return 0;
    return Math.round((this.stats.longLiqs24h / this.stats.total24h) * 100);
  }

  getShortPercentage(): number {
    if (!this.stats || this.stats.total24h === 0) return 0;
    return Math.round((this.stats.shortLiqs24h / this.stats.total24h) * 100);
  }

  getHeatmapData(): any[] {
    const now = new Date();
    const buckets = [];
    
    // Create 12 5-minute buckets for the last hour
    for (let i = 11; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - (i * 5 * 60 * 1000));
      const bucketEnd = new Date(bucketStart.getTime() + 5 * 60 * 1000);
      
      const bucketLiquidations = this.liquidations.filter(liq => 
        liq.time >= bucketStart.getTime() && liq.time < bucketEnd.getTime()
      );
      
      const totalValue = bucketLiquidations.reduce((sum, liq) => sum + liq.value, 0);
      const maxValue = Math.max(...this.liquidations.map(liq => liq.value), 1);
      
      buckets.push({
        label: bucketStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        value: totalValue,
        intensity: Math.min(totalValue / maxValue, 1),
        count: bucketLiquidations.length
      });
    }
    
    return buckets;
  }

  trackByTime(index: number, item: LiquidationData): number {
    return item.time;
  }
}
