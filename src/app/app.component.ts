import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TwitterService } from './twitter.service';
import { ChartComponent } from './chart-simple.component';
import { BitcoinChartComponent } from './bitcoin-chart.component';
import { TweetListComponent } from './tweet-list.component';
import { LoadingService } from './services/loading.service';
import { environment } from '../environments/environment';
import { from, Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { POPULAR_USERS } from './types/twitter.types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    BitcoinChartComponent,
    TweetListComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatIconModule,
    MatToolbarModule
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  twitterForm: FormGroup;
  tweets: any[] = [];
  tweetResponse: any = null; // Store full API response
  error: string = '';
  loading: boolean = false;
  chartLoading: boolean = false;
  isMockData: boolean = false; // Track if showing mock data
  
  // Global loading state
  globalLoading: boolean = false;
  private loadingSubscription?: Subscription;
  
  // Use imported popular users from types
  popularUsers = POPULAR_USERS;

  constructor(
    private fb: FormBuilder,
    private twitterService: TwitterService,
    private loadingService: LoadingService
  ) {
    this.twitterForm = this.fb.group({
      username: [environment.twitterApi.defaultUsername, Validators.required],
      tweetCount: [20, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }
  ngOnInit() {
    // Subscribe to global loading state
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      isLoading => this.globalLoading = isLoading
    );
    
    // Rate limit handling can be implemented when needed
    // Currently the TwitterService doesn't export rate limit status
    console.log('App component initialized - Bitcoin chart will load automatically');
    
    // Load mock tweets on startup
    this.getMockTweets();
  }
  
  ngOnDestroy() {
    // Cleanup subscriptions
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }  onSubmit() {
    if (this.twitterForm.valid) {
      const { username, tweetCount } = this.twitterForm.value;
      
      this.loadingService.startLoading(); // Start global loading
      this.loading = true;
      this.error = '';
      this.tweets = [];
      this.tweetResponse = null;
      this.isMockData = false;

      from(this.twitterService.getTweets(username, tweetCount))
        .subscribe({
          next: (response: any) => {
            // Check if response contains mock data flag
            if (response.meta?.mock_data) {
              this.isMockData = true;
            }
            
            // Store full response for includes data
            this.tweetResponse = response;
            
            // Use simplified tweet model - data array directly
            this.tweets = response.data || [];
            this.loadingService.stopLoading(); // Stop global loading
            this.loading = false;
          },
          error: (error: any) => {
            this.error = error.error || error.message || 'Błąd podczas pobierania tweetów';
            this.loadingService.stopLoading(); // Stop global loading on error
            this.loading = false;
            this.isMockData = false;
          }
        });
    }
  }  getMockTweets() {
    this.loadingService.startLoading(); // Start global loading
    this.loading = true;
    this.error = '';
    this.tweets = [];
    this.tweetResponse = null;
    this.isMockData = true;

    from(this.twitterService.getMockTweets())
      .subscribe({
        next: (response: any) => {
          console.log('Mock tweets loaded:', response);
          
          // Store full response for includes data
          this.tweetResponse = response;
          
          // Use simplified tweet model - data array directly
          this.tweets = response.data || [];
          this.loadingService.stopLoading(); // Stop global loading
          this.loading = false;
        },
        error: (error: any) => {
          this.error = error.error || error.message || 'Błąd podczas pobierania mock tweetów';
          this.loadingService.stopLoading(); // Stop global loading on error
          this.loading = false;
          this.isMockData = false;
        }
      });
  }

  onChartLoadingChange(isLoading: boolean): void {
    this.chartLoading = isLoading;
  }
}
