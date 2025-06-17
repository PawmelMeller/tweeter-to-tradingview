import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

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
  edit_history_tweet_ids: string[];
  attachments?: {
    media_keys: string[];
  };
  context_annotations?: any[];
}

interface TwitterResponse {
  data: SimplifiedTweet[];
  includes?: {
    users: Array<{
      id: string;
      username: string;
      name: string;
      profile_image_url?: string;
      verified?: boolean;
      public_metrics?: any;
    }>;
    media?: Array<{
      media_key: string;
      type: string;
      url?: string;
      preview_image_url?: string;
    }>;
  };
  meta?: {
    result_count: number;
    newest_id?: string;
    oldest_id?: string;
    next_token?: string;
    mock_data?: boolean;
    reason?: string;
  };
}

interface TweetResult {
  tweet: SimplifiedTweet;
  author: string;
}

@Injectable({
  providedIn: 'root'
})
export class TwitterService {
  constructor(private http: HttpClient) {
    console.log('TwitterService initialized');
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
  
  async getTweets(username: string, tweetCount: any): Promise<TwitterResponse> {
    try {
      console.log(`Fetching tweets for ${username}, count: ${tweetCount}`);
      
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      const response = await this.http.get<TwitterResponse>(        `/api/users/by/username/${username}/tweets`,
        {
          headers,
          params: {
            'tweet.fields': 'created_at,public_metrics,context_annotations,attachments',
            'expansions': 'author_id,attachments.media_keys',
            'user.fields': 'username,name,profile_image_url,verified,public_metrics',
            'media.fields': 'type,url,preview_image_url',
            'max_results': Math.min(tweetCount, 100).toString()
          }
        }
      ).toPromise();

      if (response) {
        console.log('Successfully fetched Twitter data');
        console.log('Response:', response);
        return response;
      } else {
        throw new Error('Brak danych w odpowiedzi API');
      }
    } catch (error: any) {
      console.error('Error fetching tweets:', error);
      
      // Provide specific error messages in Polish
      if (error.status === 404) {
        throw new Error(`Użytkownik "${username}" nie został znaleziony lub konto jest prywatne.`);
      } else if (error.status === 429) {
        throw new Error('Limit zapytań został przekroczony. Spróbuj ponownie za 15 minut.');
      } else if (error.status === 401) {
        throw new Error('Błąd autoryzacji. Sprawdź konfigurację API Twitter.');
      } else if (error.status === 0) {
        throw new Error('Nie można połączyć się z serwerem. Sprawdź czy backend działa na porcie 3002.');
      } else {
        throw new Error(error.error?.error || error.message || 'Nieznany błąd podczas pobierania tweetów');
      }
    }
  }
}
