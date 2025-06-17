import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TwitterService } from './twitter.service';
import { ChartComponent } from './chart-simple.component';
import { TweetListComponent } from './tweet-list.component';
import { environment } from '../environments/environment';
import { from } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    ChartComponent,
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
  isMockData: boolean = false; // Track if showing mock data
  
  // Predefined popular users
  popularUsers = [
    { value: 'elonmusk', name: 'Elon Musk (@elonmusk)' },
    { value: 'BillyM2k', name: 'Billy Markus (@BillyM2k)' },
    { value: 'VitalikButerin', name: 'Vitalik Buterin (@VitalikButerin)' },
    { value: 'naval', name: 'Naval (@naval)' },
    { value: 'sundarpichai', name: 'Sundar Pichai (@sundarpichai)' }
  ];

  constructor(
    private fb: FormBuilder,
    private twitterService: TwitterService
  ) {
    this.twitterForm = this.fb.group({
      username: [environment.twitterApi.defaultUsername, Validators.required],
      tweetCount: [20, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }
  
  ngOnInit() {
    // Rate limit handling can be implemented when needed
    // Currently the TwitterService doesn't expose rate limit status
    console.log('App component initialized - Bitcoin chart will load automatically');
  }
  ngOnDestroy() {
    // Cleanup if needed
  }  onSubmit() {
    if (this.twitterForm.valid) {
      const { username, tweetCount } = this.twitterForm.value;
      
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
            this.loading = false;
          },
          error: (error: any) => {
            this.error = error.error || error.message || 'Błąd podczas pobierania tweetów';
            this.loading = false;
            this.isMockData = false;
          }
        });
    }
  }

  refreshChart() {
    console.log('Refreshing Bitcoin chart from app component');
    // This could trigger a refresh in the chart component
    // For now, just reload the page component
    window.location.reload();
  }
}
