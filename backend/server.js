const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting Twitter API Server...');
console.log('Loading environment variables...');

require('dotenv').config();

console.log('✅ Environment loaded');
console.log('PORT from env:', process.env.PORT);
console.log('Current working directory:', process.cwd());

const app = express();
const PORT = process.env.PORT || 3002;

console.log('Express app created');
console.log('Using PORT:', PORT);

// Middleware
app.use(cors());
app.use(express.json());

// Twitter API credentials from environment variables
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// Check if Twitter credentials are available
const hasTwitterCredentials = TWITTER_BEARER_TOKEN && TWITTER_BEARER_TOKEN.length > 10;

if (!hasTwitterCredentials) {
  console.log('⚠️  WARNING: No Twitter API credentials found!');
  console.log('📝 Server will fall back to mock data');
} else {
  console.log('✅ Twitter API credentials found');
  console.log('🐦 Real Twitter API mode enabled');
}

let bearerToken = TWITTER_BEARER_TOKEN || null; // Use provided Bearer Token if available
let tokenExpiry = TWITTER_BEARER_TOKEN ? Date.now() + (24 * 60 * 60 * 1000) : 0; // Bearer tokens don't expire quickly

// Function to get Bearer Token
async function getBearerToken() {
  // If we have a Bearer Token from environment, use it directly
  if (TWITTER_BEARER_TOKEN) {
    console.log('Using provided Bearer Token from environment');
    return TWITTER_BEARER_TOKEN;
  }
  
  // Otherwise, use OAuth 2.0 flow with API Key and Secret
  if (bearerToken && Date.now() < tokenExpiry) {
    console.log('Using cached Bearer Token');
    return bearerToken;
  }

  try {
    console.log('Requesting new Bearer Token via OAuth 2.0...');
    console.log('Client ID:', TWITTER_CLIENT_ID ? `${TWITTER_CLIENT_ID.substring(0, 10)}...` : 'NOT SET');
    console.log('Client Secret:', TWITTER_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET');
    
    if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
      throw new Error('Twitter API credentials not configured. Check .env file.');
    }
    
    const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      'https://api.twitter.com/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    bearerToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    
    console.log('Successfully obtained Bearer Token via OAuth 2.0');
    console.log('Token expires in:', response.data.expires_in, 'seconds');
    return bearerToken;
  } catch (error) {
    console.error('Error getting Bearer Token:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    throw error;
  }
}

// Enhanced error handling with more specific Twitter API error codes
app.get('/api/users/by/username/:username/tweets', async (req, res) => {
  try {
    const { username } = req.params;
    const { 
      'tweet.fields': tweetFields, 
      expansions, 
      'user.fields': userFields, 
      max_results 
    } = req.query;

    console.log(`Fetching tweets for username: ${username}`);

    const token = await getBearerToken();
    
    // First get user ID by username
    console.log(`Step 1: Getting user ID for username: ${username}`);
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!userResponse.data.data) {
      console.log(`User not found: ${username}`);
      return res.status(404).json({
        error: 'Użytkownik nie został znaleziony',
        details: `Użytkownik "${username}" nie istnieje, może być prywatny, zawieszony lub nazwa jest niepoprawna.`,
        suggestion: 'Sprawdź pisownię nazwy użytkownika i upewnij się, że konto jest publiczne.'
      });
    }

    const userId = userResponse.data.data.id;
    console.log(`Step 2: Found user ID: ${userId} for username: ${username}`);

    // Now get user tweets using user ID
    console.log(`Step 3: Fetching tweets for user ID: ${userId}`);
    const response = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          'tweet.fields': tweetFields || 'created_at,public_metrics,context_annotations,attachments,geo,lang,possibly_sensitive,referenced_tweets,reply_settings,source',
          'expansions': expansions || 'author_id,attachments.media_keys,referenced_tweets.id',
          'user.fields': userFields || 'username,name,profile_image_url,verified,description,public_metrics',
          'media.fields': 'type,url,preview_image_url,public_metrics,alt_text,duration_ms,height,width',
          'max_results': Math.min(parseInt(max_results) || 10, 100),
          'exclude': 'retweets,replies' // Exclude retweets and replies for cleaner timeline
        }
      }
    );

    console.log(`Successfully fetched ${response.data.data?.length || 0} tweets for ${username}`);
    res.json(response.data);} catch (error) {
    console.error('Error fetching tweets:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    const errorCode = error.response?.data?.errors?.[0]?.code;
    const errorMessage = error.response?.data?.errors?.[0]?.message;
    
    if (errorCode === 34 || errorMessage?.includes('page does not exist') || error.response?.status === 404) {
      res.status(404).json({
        error: 'Użytkownik nie został znaleziony',
        details: `Użytkownik "${req.params.username}" nie istnieje, może być prywatny, zawieszony lub nazwa jest niepoprawna.`,
        suggestion: 'Sprawdź pisownię nazwy użytkownika i upewnij się, że konto jest publiczne.',
        twitterErrorCode: errorCode || 404
      });    } else if (error.response?.status === 429) {
      console.log('Rate limit exceeded, returning mock data');
      
      // Return mock data when rate limit is exceeded
      const mockResponse = {
        ...MOCK_TWEETS_DATA,
        meta: {
          ...MOCK_TWEETS_DATA.meta,
          mock_data: true,
          reason: 'Twitter API rate limit exceeded - showing sample data'
        }
      };
        // Update mock data to match requested username
      if (mockResponse.includes?.users?.[0]) {
        mockResponse.includes.users[0].username = req.params.username;
        mockResponse.includes.users[0].name = `${req.params.username} (Sample Data)`;
      }
      
      res.json(mockResponse);
    } else if (error.response?.status === 401) {
      res.status(401).json({
        error: 'Błąd autoryzacji',
        details: 'Nieprawidłowe dane uwierzytelniające Twitter API',
        suggestion: 'Sprawdź TWITTER_BEARER_TOKEN w pliku .env'
      });
    } else if (error.response?.status === 403) {
      res.status(403).json({
        error: 'Dostęp zabroniony',
        details: 'Brak uprawnień do tego zasobu. Może być konto prywatne lub zawieszone.',
        suggestion: 'Sprawdź czy konto jest publiczne i dostępne'
      });
    } else {
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.detail || error.message || 'Błąd podczas pobierania tweetów',
        details: error.response?.data || 'Wewnętrzny błąd serwera',
        twitterError: error.response?.data
      });
    }
  }
});

// Route to get user's own timeline (requires user authentication)
app.get('/api/users/me/tweets', async (req, res) => {
  try {
    // This endpoint requires user authentication (OAuth 1.0a or OAuth 2.0 with user context)
    // For now, return an error message explaining the limitation
    res.status(401).json({
      error: 'User timeline access requires user authentication. Please use the username endpoint instead.',
      suggestion: 'Try using /api/users/by/username/{your-username}/tweets'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get specific user tweets by username (including your own)
app.get('/api/my-tweets/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { 
      'tweet.fields': tweetFields, 
      expansions, 
      'user.fields': userFields, 
      max_results 
    } = req.query;

    console.log(`Fetching tweets for user: ${username}`);

    const token = await getBearerToken();
    
    // First get user ID
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!userResponse.data.data) {
      return res.status(404).json({
        error: 'User not found',
        details: 'The specified username does not exist or is not accessible'
      });
    }

    const userId = userResponse.data.data.id;
    console.log(`Found user ID: ${userId} for username: ${username}`);

    // Get user tweets using user ID
    const response = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },        params: {
          'tweet.fields': tweetFields || 'created_at,public_metrics,context_annotations,attachments,geo,lang,possibly_sensitive,referenced_tweets,reply_settings,source',
          'expansions': expansions || 'author_id,attachments.media_keys,referenced_tweets.id',
          'user.fields': userFields || 'username,name,profile_image_url,verified,description,public_metrics',
          'media.fields': 'type,url,preview_image_url,public_metrics,alt_text,duration_ms,height,width',
          'max_results': Math.min(parseInt(max_results) || 10, 100),
          'exclude': 'retweets,replies' // Exclude retweets and replies for cleaner timeline
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching user tweets:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      res.status(404).json({
        error: 'User not found',
        details: 'The specified username does not exist or account may be private/suspended',
        suggestion: 'Please check the username and ensure the account is public'
      });    } else if (error.response?.status === 429) {
      console.log('Rate limit exceeded, returning mock data');
      
      // Return mock data when rate limit is exceeded
      const mockResponse = {
        ...MOCK_TWEETS_DATA,
        meta: {
          ...MOCK_TWEETS_DATA.meta,
          mock_data: true,
          reason: 'Twitter API rate limit exceeded - showing sample data'
        }
      };
        // Update mock data to match requested username
      if (mockResponse.includes?.users?.[0]) {
        mockResponse.includes.users[0].username = req.params.username;
        mockResponse.includes.users[0].name = `${req.params.username} (Sample Data)`;
      }
      
      res.json(mockResponse);
    } else {
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.detail || error.message || 'Failed to fetch tweets',
        details: error.response?.data || 'Internal server error'
      });
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Configuration check endpoint
app.get('/api/config-check', async (req, res) => {
  try {
    const configStatus = {
      bearerTokenSet: !!TWITTER_BEARER_TOKEN,
      clientIdSet: !!TWITTER_CLIENT_ID,
      clientSecretSet: !!TWITTER_CLIENT_SECRET,
      bearerTokenLength: TWITTER_BEARER_TOKEN ? TWITTER_BEARER_TOKEN.length : 0,
      clientIdLength: TWITTER_CLIENT_ID ? TWITTER_CLIENT_ID.length : 0,
      clientSecretLength: TWITTER_CLIENT_SECRET ? TWITTER_CLIENT_SECRET.length : 0,
      authMethod: TWITTER_BEARER_TOKEN ? 'Bearer Token' : 'OAuth 2.0',
      timestamp: new Date().toISOString()
    };
    
    // Try to get a bearer token to test credentials
    try {
      const token = await getBearerToken();
      configStatus.authTest = 'SUCCESS';
      configStatus.message = 'Twitter API credentials are valid';
      configStatus.tokenPreview = token.substring(0, 20) + '...';
    } catch (error) {
      configStatus.authTest = 'FAILED';
      configStatus.message = error.message;
      configStatus.error = error.response?.data || error.message;
    }
    
    res.json(configStatus);
  } catch (error) {
    res.status(500).json({
      error: 'Configuration check failed',
      details: error.message
    });
  }
});

// Simple status page
app.get('/', (req, res) => {
  const mode = hasTwitterCredentials ? 'TWITTER API' : 'MOCK DATA';
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Twitter API Server Status</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .mock { background-color: #e3f2fd; border-left: 4px solid #2196F3; }
        .twitter { background-color: #e8f5e8; border-left: 4px solid #4CAF50; }
        .warning { background-color: #fff3e0; border-left: 4px solid #FF9800; }
        code { background-color: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
        .endpoint { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🐦 Twitter API Server</h1>
    <div class="status ${hasTwitterCredentials ? 'twitter' : 'mock'}">
        <h3>Status: ${mode}</h3>
        <p><strong>Mode:</strong> ${hasTwitterCredentials ? 'Real Twitter API calls' : 'Mock data responses'}</p>
        <p><strong>Port:</strong> ${PORT}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    </div>
    
    <h3>📋 Available Endpoints:</h3>
    <div class="endpoint">
        <strong>GET</strong> <code>/health</code><br>
        Health check and server status
    </div>
    <div class="endpoint">
        <strong>GET</strong> <code>/api/users/by/username/:username/tweets</code><br>
        Get tweets for a specific user (${mode})
    </div>
    <div class="endpoint">
        <strong>GET</strong> <code>/api/mock-tweets</code><br>
        Get mock tweets data (for testing)
    </div>
    
    <h3>🧪 Test Links:</h3>
    <ul>
        <li><a href="/health">Health Check</a></li>
        <li><a href="/api/users/by/username/elonmusk/tweets?max_results=5">Elon Musk Tweets (5)</a></li>
        <li><a href="/api/users/by/username/VitalikButerin/tweets?max_results=10">Vitalik Buterin Tweets (10)</a></li>
        <li><a href="/api/mock-tweets">Mock Tweets Data</a></li>
    </ul>
    
    ${!hasTwitterCredentials ? `
    <div class="status warning">
        <h3>⚠️ Twitter API Not Configured</h3>
        <p>To use real Twitter API, add your credentials to <code>backend/.env</code>:</p>
        <pre>TWITTER_BEARER_TOKEN=your_bearer_token_here</pre>
    </div>
    ` : ''}
</body>
</html>`;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Twitter proxy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Config check: http://localhost:${PORT}/api/config-check`);
  
  if (TWITTER_BEARER_TOKEN) {
    console.log('✅ Using Bearer Token authentication');
  } else if (TWITTER_CLIENT_ID && TWITTER_CLIENT_SECRET) {
    console.log('✅ Using OAuth 2.0 authentication');
  } else {
    console.warn('⚠️  Twitter API credentials not found in environment variables');
    console.warn('   Please check your .env file');
  }
});

// Load mock data from external JSON file
let MOCK_TWEETS_DATA;
try {
  const mockDataPath = path.join(__dirname, 'mock-tweets.json');
  MOCK_TWEETS_DATA = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
  console.log('Mock tweets data loaded from mock-tweets.json');
} catch (error) {
  console.error('Error loading mock tweets data:', error);
  MOCK_TWEETS_DATA = { data: [], includes: { users: [], media: [] }, meta: {} };
}

// Mock tweets endpoint
app.get('/api/mock-tweets', (req, res) => {
  console.log('📝 Serving mock tweets data');
  
  const mockResponse = {
    ...MOCK_TWEETS_DATA,
    meta: {
      ...MOCK_TWEETS_DATA.meta,
      mock_data: true,
      reason: 'Mock data requested via /api/mock-tweets endpoint'
    }
  };
  
  res.json(mockResponse);
});
