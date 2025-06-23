import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LiquidationStats } from '../types/liquidation.types';
import { formatLargeNumber } from '../utils/formatters.utils';

@Component({
  selector: 'app-liquidation-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
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
  `,
  styles: [`
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
  `]
})
export class LiquidationStatsComponent {
  @Input() stats: LiquidationStats | null = null;

  formatLargeNumber = formatLargeNumber;

  getLongPercentage(): number {
    if (!this.stats || this.stats.total24h === 0) return 0;
    return Math.round((this.stats.longLiqs24h / this.stats.total24h) * 100);
  }

  getShortPercentage(): number {
    if (!this.stats || this.stats.total24h === 0) return 0;
    return Math.round((this.stats.shortLiqs24h / this.stats.total24h) * 100);
  }
}
