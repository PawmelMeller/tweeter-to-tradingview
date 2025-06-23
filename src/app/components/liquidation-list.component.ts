import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LiquidationData } from '../types/liquidation.types';
import { formatLargeNumber, formatRelativeTime } from '../utils/formatters.utils';

@Component({
  selector: 'app-liquidation-list',
  standalone: true,
  imports: [CommonModule],
  template: `
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
  `,
  styles: [`
    .recent-liquidations {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e9ecef;
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

    .no-data {
      text-align: center;
      color: #666;
      padding: 32px;
    }
  `]
})
export class LiquidationListComponent {
  @Input() liquidations: LiquidationData[] = [];
  @Input() lastUpdate: Date | null = null;
  @Input() loading = false;

  formatLargeNumber = formatLargeNumber;

  formatTime = formatRelativeTime;

  trackByTime(index: number, item: LiquidationData): number {
    return item.time;
  }
}
