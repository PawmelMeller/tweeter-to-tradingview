/**
 * Twitter and tweet related types
 */

export interface SimplifiedTweet {
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
}

export interface TwitterUser {
  name: string;
  value: string;
}

export interface TweetFormData {
  username: string;
  tweetCount: number;
}

export interface TweetMarker {
  time: number;
  price: number;
  tweet: SimplifiedTweet;
}

export const POPULAR_USERS: readonly TwitterUser[] = [
  { name: 'BillyM2k (@billym2k)', value: 'billym2k' },
] as const;
