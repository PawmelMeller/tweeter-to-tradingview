import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-tweet-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatBadgeModule],  template: `
    <div class="tweets-container">
      <!-- Mock data warning -->
      <mat-card *ngIf="isMockData" class="mock-warning-card">
        <mat-card-content>
          <div class="mock-warning">
            <mat-icon color="warn">warning</mat-icon>
            <div>
              <strong>Sample Data</strong>
              <p>Twitter API rate limit exceeded. Showing sample tweets from &#64;BillyM2k</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card *ngFor="let tweet of tweets" class="tweet-card"><mat-card-header>
          <div mat-card-avatar class="tweet-avatar">
            <mat-icon>person</mat-icon>
          </div>
          <mat-card-title>{{ getAuthorName(tweet) }}</mat-card-title>          <mat-card-subtitle>
            {{'@'}}{{ getAuthorUsername(tweet) }} • {{ formatDate(tweet.created_at) }}
            <mat-chip-listbox class="tweet-meta-chips">
              <mat-chip-option *ngIf="getTweetType(tweet) !== 'text'" class="tweet-type-chip">
                <mat-icon>{{ getTweetTypeIcon(tweet) }}</mat-icon>
                {{ getTweetType(tweet) }}
              </mat-chip-option>
            </mat-chip-listbox>
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <p class="tweet-text">{{ tweet.text }}</p>
            <div class="tweet-metrics" *ngIf="tweet.public_metrics">
            <mat-chip-listbox class="metrics-chips">
              <mat-chip-option *ngIf="tweet.public_metrics.like_count" class="metric-chip like-chip">
                <mat-icon>favorite</mat-icon>
                {{ formatNumber(tweet.public_metrics.like_count) }}
              </mat-chip-option>
              <mat-chip-option *ngIf="tweet.public_metrics.retweet_count" class="metric-chip retweet-chip">
                <mat-icon>repeat</mat-icon>
                {{ formatNumber(tweet.public_metrics.retweet_count) }}
              </mat-chip-option>
              <mat-chip-option *ngIf="tweet.public_metrics.reply_count" class="metric-chip reply-chip">
                <mat-icon>chat_bubble_outline</mat-icon>
                {{ formatNumber(tweet.public_metrics.reply_count) }}
              </mat-chip-option>
              <mat-chip-option *ngIf="tweet.public_metrics.quote_count" class="metric-chip quote-chip">
                <mat-icon>format_quote</mat-icon>
                {{ formatNumber(tweet.public_metrics.quote_count) }}
              </mat-chip-option>
              <mat-chip-option *ngIf="tweet.public_metrics.impression_count" class="metric-chip impression-chip">
                <mat-icon>visibility</mat-icon>
                {{ formatNumber(tweet.public_metrics.impression_count) }}
              </mat-chip-option>
            </mat-chip-listbox>
          </div>
            <div class="tweet-details">
            <p class="tweet-date">
              <mat-icon>schedule</mat-icon>
              <strong>Posted:</strong> {{ getDetailedDate(tweet.created_at) }}
            </p>
          </div>
        </mat-card-content>
        
        <mat-card-actions align="end">
          <button mat-button color="primary">
            <mat-icon>open_in_new</mat-icon>
            View on Twitter
          </button>
        </mat-card-actions>
      </mat-card>
      
      <div *ngIf="!tweets || tweets.length === 0" class="no-tweets">
        <mat-card>
          <mat-card-content>
            <p>No tweets found. Try searching for a different username.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`    .tweets-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .mock-warning-card {
      margin-bottom: 16px;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
    }
    
    .mock-warning {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .mock-warning mat-icon {
      margin-top: 2px;
    }
    
    .mock-warning p {
      margin: 4px 0 0 0;
      color: #856404;
    }
    
    .tweet-card {
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s ease;
    }
    
    .tweet-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    
    .tweet-avatar {
      background-color: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .tweet-text {
      font-size: 16px;
      line-height: 1.5;
      margin: 16px 0;
      white-space: pre-wrap;
    }    
    .tweet-meta-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
      .tweet-type-chip {
      background-color: #e3f2fd;
      color: #1976d2;
      font-size: 10px;
    }
    
    .tweet-metrics {
      margin-top: 12px;
    }
    
    .metrics-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .metric-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
    }
    
    .like-chip {
      background-color: #ffebee;
      color: #e91e63;
    }
    
    .retweet-chip {
      background-color: #e8f5e8;
      color: #4caf50;
    }
    
    .reply-chip {
      background-color: #e3f2fd;
      color: #2196f3;
    }
    
    .quote-chip {
      background-color: #fff3e0;
      color: #ff9800;
    }
    
    .impression-chip {
      background-color: #f3e5f5;
      color: #9c27b0;
    }
      .tweet-date {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
      font-size: 13px;
      color: #666;
    }
    
    .tweet-date mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
    }
    
    .media-indicators {
      margin-top: 12px;
    }
    
    .media-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .media-chips mat-chip-option {
      background-color: #e3f2fd;
      color: #1976d2;
      font-size: 12px;
    }
    
    .tweet-type {
      margin-top: 8px;
    }
    
    .type-photo {
      background-color: #e8f5e8;
      color: #4caf50;
    }
    
    .type-video {
      background-color: #ffebee;
      color: #f44336;
    }
    
    .type-gif {
      background-color: #fff3e0;
      color: #ff9800;
    }
    
    .no-tweets {
      text-align: center;
      margin-top: 40px;
    }
    
    mat-card-actions button {
      margin-left: 8px;
    }
    
    mat-card-title {
      font-weight: 600;
    }
    
    mat-card-subtitle {
      color: #666;
      font-size: 14px;
    }
  `]
})
export class TweetListComponent {
  @Input() tweets: any[] = [];
  @Input() tweetResponse: any = null; // Full API response with includes
  @Input() isMockData: boolean = false;  getAuthorName(tweet: any): string {
    // For simplified tweet model, get author info from includes
    if (this.tweetResponse?.includes?.users) {
      const author = this.tweetResponse.includes.users.find((user: any) => user.id === tweet.author_id);
      if (author) return author.name;
    }
    
    // Fallback
    return 'Unknown User';
  }

  getAuthorUsername(tweet: any): string {
    // For simplified tweet model, get author info from includes
    if (this.tweetResponse?.includes?.users) {
      const author = this.tweetResponse.includes.users.find((user: any) => user.id === tweet.author_id);
      if (author) return author.username;
    }
    
    // Fallback
    return 'unknown';
  }
  getTweetType(tweet: any): string {
    if (tweet.attachments?.media_keys?.length > 0) {
      // Check if we have media information
      if (this.tweetResponse?.includes?.media) {
        const media = this.tweetResponse.includes.media.find((m: any) => 
          tweet.attachments.media_keys.includes(m.media_key)
        );
        if (media) {
          switch (media.type) {
            case 'photo': return 'photo';
            case 'video': return 'video';
            case 'animated_gif': return 'gif';
            default: return 'media';
          }
        }
      }
      return 'media';
    }
    
    if (tweet.referenced_tweets) {
      const refType = tweet.referenced_tweets[0]?.type;
      switch (refType) {
        case 'retweeted': return 'retweet';
        case 'quoted': return 'quote';
        case 'replied_to': return 'reply';
        default: return 'text';
      }
    }
    
    return 'text';
  }

  hasMedia(tweet: any): boolean {
    return tweet.attachments?.media_keys?.length > 0;
  }

  hasPhotos(tweet: any): boolean {
    if (!this.hasMedia(tweet)) return false;
    if (this.tweetResponse?.includes?.media) {
      return this.tweetResponse.includes.media.some((m: any) => 
        tweet.attachments.media_keys.includes(m.media_key) && m.type === 'photo'
      );
    }
    return false;
  }

  hasVideo(tweet: any): boolean {
    if (!this.hasMedia(tweet)) return false;
    if (this.tweetResponse?.includes?.media) {
      return this.tweetResponse.includes.media.some((m: any) => 
        tweet.attachments.media_keys.includes(m.media_key) && m.type === 'video'
      );
    }
    return false;
  }

  hasGif(tweet: any): boolean {
    if (!this.hasMedia(tweet)) return false;
    if (this.tweetResponse?.includes?.media) {
      return this.tweetResponse.includes.media.some((m: any) => 
        tweet.attachments.media_keys.includes(m.media_key) && m.type === 'animated_gif'
      );
    }
    return false;
  }

  getTweetTypeLabel(tweet: any): string {
    const type = this.getTweetType(tweet);
    switch (type) {
      case 'photo': return 'Photo';
      case 'video': return 'Video';
      case 'gif': return 'GIF';
      case 'media': return 'Media';
      case 'retweet': return 'Retweet';
      case 'quote': return 'Quote Tweet';
      case 'reply': return 'Reply';
      default: return 'Text';
    }
  }

  getDetailedDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getTweetTypeIcon(tweet: any): string {
    const type = this.getTweetType(tweet);
    switch (type) {
      case 'photo': return 'photo';
      case 'video': return 'videocam';
      case 'gif': return 'gif';
      case 'media': return 'attachment';
      case 'retweet': return 'repeat';
      case 'quote': return 'format_quote';
      case 'reply': return 'reply';
      default: return 'article';
    }
  }
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString();
    }
  }  formatNumber(num: number): string {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
