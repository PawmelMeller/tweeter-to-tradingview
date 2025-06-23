import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LiquidationData, LIQUIDATION_CONFIG } from '../types/liquidation.types';
import { formatCompactNumber } from '../utils/formatters.utils';

interface HeatmapBucket {
  label: string;
  value: number;
  intensity: number;
  count: number;
}

@Component({
  selector: 'app-liquidation-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
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
  `,
  styles: [`
    .liquidation-heatmap {
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
  `]
})
export class LiquidationHeatmapComponent {
  @Input() liquidations: LiquidationData[] = [];

  formatCompactNumber = formatCompactNumber;
  formatLargeNumber = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  getHeatmapData(): HeatmapBucket[] {
    const now = new Date();
    const buckets: HeatmapBucket[] = [];
    
    // Create 12 5-minute buckets for the last hour
    for (let i = 11; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - (i * LIQUIDATION_CONFIG.BUCKET_DURATION));
      const bucketEnd = new Date(bucketStart.getTime() + LIQUIDATION_CONFIG.BUCKET_DURATION);
      
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
}
