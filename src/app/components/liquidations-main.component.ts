import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';

import { LiquidationService } from '../services/liquidation.service';
import { LiquidationData, LiquidationStats, ExchangeVolume } from '../types/liquidation.types';
import { LiquidationStatsComponent } from '../components/liquidation-stats.component';
import { LiquidationListComponent } from '../components/liquidation-list.component';
import { LiquidationHeatmapComponent } from '../components/liquidation-heatmap.component';
import { formatLargeNumber } from '../utils/formatters.utils';

@Component({
  selector: 'app-liquidations',
  standalone: true,
  imports: [
    CommonModule,
    LiquidationStatsComponent,
    LiquidationListComponent,
    LiquidationHeatmapComponent
  ],
  template: `
    <div class="liquidations-container">
      <!-- Header -->
      <div class="liquidations-header">
        <div class="title-section">
          <h3>🔥 Liquidation Monitor</h3>
          <p>Real-time cryptocurrency liquidations (Demo with simulated data)</p>
        </div>
        <div class="refresh-section">
          <div class="live-indicator" *ngIf="!loading">🟢 LIVE</div>
          <div class="loading-indicator" *ngIf="loading">🔄 Loading...</div>
        </div>
      </div>

      <!-- Stats Overview Component -->
      <app-liquidation-stats [stats]="stats"></app-liquidation-stats>

      <!-- Main Content -->
      <div class="liquidations-content">
        <!-- Recent Liquidations Component -->
        <app-liquidation-list 
          [liquidations]="liquidations"
          [lastUpdate]="lastUpdate"
          [loading]="loading">
        </app-liquidation-list>

        <!-- Exchange Breakdown -->
        <div class="exchange-breakdown" *ngIf="stats?.topExchanges.length">
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

      <!-- Heatmap Visualization Component -->
      <app-liquidation-heatmap [liquidations]="liquidations"></app-liquidation-heatmap>
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
  `]
})
export class LiquidationsComponent implements OnInit, OnDestroy {
  liquidations: LiquidationData[] = [];
  stats: LiquidationStats | null = null;
  loading = true;
  lastUpdate: Date | null = null;
  
  private readonly subscription = new Subscription();

  constructor(private readonly liquidationService: LiquidationService) {}

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

  formatLargeNumber = formatLargeNumber;

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
}
