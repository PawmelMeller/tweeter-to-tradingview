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
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatBadgeModule],
  template: `
    <div class="tweets-container">
      <!-- Beautiful header -->
      <div class="tweets-header" *ngIf="tweets.length > 0">
        <div class="header-content">
          <mat-icon class="header-icon">chat</mat-icon>
          <div class="header-text">
            <h2>Latest Tweets</h2>
            <p>{{ tweets.length }} tweet{{ tweets.length > 1 ? 's' : '' }} found</p>
          </div>
        </div>
      </div>

      <!-- Mock data warning with improved styling -->
      <mat-card *ngIf="isMockData" class="mock-warning-card">
        <mat-card-content>
          <div class="mock-warning">
            <mat-icon color="warn">science</mat-icon>
            <div class="warning-content">
              <strong>Sample Data Mode</strong>
              <p>Displaying sample tweets from &#64;BillyM2k due to API limitations</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Beautiful tweet cards -->
      <mat-card *ngFor="let tweet of tweets" class="tweet-card modern">
        <div class="tweet-header">
          <div class="user-avatar">
            <mat-icon>account_circle</mat-icon>
          </div>
          <div class="user-info">
            <h3 class="user-name">{{ getAuthorName(tweet) }}</h3>
            <p class="user-handle">&#64;{{ getAuthorUsername(tweet) }}</p>
          </div>
          <div class="tweet-timestamp">
            <mat-icon>schedule</mat-icon>
            <span>{{ formatDate(tweet.created_at) }}</span>
          </div>
        </div>

        <mat-card-content class="tweet-content">
          <div class="tweet-text-container">
            <p class="tweet-text">{{ tweet.text }}</p>
          </div>          <!-- Tweet type badge -->
          <div class="tweet-badges" *ngIf="getTweetType(tweet) !== 'text'">
            <mat-chip class="tweet-type-badge">
              <mat-icon>{{ getTweetTypeIcon(tweet) }}</mat-icon>
              {{ getTweetType(tweet) }}
            </mat-chip>
          </div>
        </mat-card-content>

        <!-- Tweet actions -->
        <mat-card-actions class="tweet-actions">
          <button mat-stroked-button color="primary" class="action-btn">
            <mat-icon>open_in_new</mat-icon>
            View on Twitter
          </button>
          <button mat-stroked-button color="accent" class="action-btn">
            <mat-icon>share</mat-icon>
            Share
          </button>
          <div class="spacer"></div>
          <span class="detailed-date">{{ getDetailedDate(tweet.created_at) }}</span>
        </mat-card-actions>
      </mat-card>
      
      <!-- Empty state with better design -->
      <div *ngIf="!tweets || tweets.length === 0" class="empty-state">
        <mat-card class="empty-card">
          <mat-card-content>
            <div class="empty-content">
              <mat-icon class="empty-icon">twitter</mat-icon>
              <h3>No tweets found</h3>
              <p>Try fetching tweets for a different user or check your connection.</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,  styles: [`
    .tweets-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background-color: #1a1a1a;
      color: #ffffff;
    }

    /* Beautiful header */
    .tweets-header {
      margin-bottom: 24px;
      padding: 20px 0;
      border-bottom: 2px solid #333333;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #ff9800;
    }

    .header-text h2 {
      margin: 0;
      color: #ffffff;
      font-weight: 500;
      font-size: 24px;
    }

    .header-text p {
      margin: 4px 0 0 0;
      color: #cccccc;
      font-size: 14px;
    }

    /* Mock warning with gradient */
    .mock-warning-card {
      margin-bottom: 20px;
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      border-left: 4px solid #ff9800;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
    }

    .mock-warning {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .warning-content strong {
      color: #000000;
      font-size: 16px;
    }

    .warning-content p {
      margin: 4px 0 0 0;
      color: #000000;
      font-size: 14px;
    }

    /* Modern tweet cards */
    .tweet-card.modern {
      margin-bottom: 20px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid #333333;
      overflow: hidden;
      background-color: #2d2d2d;
    }

    .tweet-card.modern:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(255, 152, 0, 0.2);
    }    /* Tweet header */
    .tweet-header {
      display: flex;
      align-items: center;
      padding: 16px 20px 12px;
      background: linear-gradient(135deg, #333333 0%, #2d2d2d 100%);
      border-bottom: 1px solid #444444;
    }

    .user-avatar {
      margin-right: 12px;
    }

    .user-avatar mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #ff9800;
      background: #1a1a1a;
      border-radius: 50%;
      padding: 8px;
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
    }

    .user-handle {
      margin: 2px 0 0 0;
      font-size: 14px;
      color: #cccccc;
    }

    .tweet-timestamp {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ff9800;
      font-size: 12px;
    }

    .tweet-timestamp mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }    /* Tweet content */
    .tweet-content {
      padding: 20px !important;
      background-color: #2d2d2d;
    }

    .tweet-text-container {
      margin-bottom: 16px;
    }

    .tweet-text {
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
      color: #ffffff;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    /* Tweet type badge */
    .tweet-badges {
      margin-bottom: 16px;
    }

    .tweet-type-badge {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: #000000;
      font-size: 12px;
      font-weight: 500;    }

    /* Tweet actions */
    .tweet-actions {
      padding: 12px 20px !important;
      background: #1a1a1a;
      border-top: 1px solid #333333;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn {
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid #ff9800;
      color: #ff9800;
    }

    .action-btn:hover {
      background-color: #ff9800;
      color: #000000;
    }

    .spacer {
      flex: 1;
    }    .detailed-date {
      font-size: 11px;
      color: #cccccc;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }    .empty-card {
      text-align: center;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      border-radius: 16px;
      background-color: #2d2d2d;
    }

    .empty-content {
      padding: 40px 20px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ff9800;
      margin-bottom: 16px;
    }

    .empty-content h3 {
      margin: 0 0 8px 0;
      color: #ffffff;
      font-weight: 500;
    }

    .empty-content p {
      margin: 0;
      color: #cccccc;
      font-size: 14px;
    }    /* Responsive design */
    @media (max-width: 768px) {
      .tweets-container {
        padding: 12px;
      }
      
      .tweet-header {
        padding: 12px 16px 8px;
      }
      
      .tweet-content {
        padding: 16px !important;
      }
    }
  `]
})
export class TweetListComponent {
  @Input() tweets: any[] = [];
  @Input() tweetResponse: any = null; // Full API response with includes
  @Input() isMockData: boolean = false;

  getAuthorName(tweet: any): string {
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

  formatNumber(num: number): string {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
