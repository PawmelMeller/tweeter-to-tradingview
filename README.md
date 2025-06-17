# Twitter to Bitcoin Chart

This application fetches Twitter timelines and displays them with real-time Bitcoin price charts for sentiment analysis.

## Features

- Real Twitter API integration
- Live Bitcoin price data from CoinGecko API
- Interactive Bitcoin price charts with tweet markers
- Tweet timeline visualization
- Sentiment correlation analysis between tweets and Bitcoin prices
- Modern Angular frontend with Material Design
- Secure backend proxy server

## How it works

1. **Bitcoin Chart**: Automatically loads real-time Bitcoin price data (BTC/USD) from CoinGecko API
2. **Tweet Integration**: Fetch tweets from any Twitter user and see them as markers on the Bitcoin chart
3. **Correlation Analysis**: Analyze potential correlations between influential tweets and Bitcoin price movements
4. **Interactive Visualization**: Hover over chart points to see Bitcoin prices and tweet information

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Twitter API credentials (Client ID and Secret)

### Installation

1. **Install dependencies:**
   ```bash
   # Run the setup script
   setup.bat
   
   # Or manually:
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ..
   npm install
   ```

2. **Configure Twitter API credentials:**
   - Edit `backend/.env` file
   - Add your Twitter API credentials:
     ```
     TWITTER_CLIENT_ID=your_client_id_here
     TWITTER_CLIENT_SECRET=your_client_secret_here
     ```

### Running the Application

**Option 1: Quick Start with Mock Data (Recommended)**
```bash
# Windows
start-mock.bat

# Or manually
npm run start:mock
```

**Option 2: With Real Twitter API**
```bash
# Windows  
start-twitter.bat

# Or manually
npm start
```

**Option 3: Manual Backend/Frontend**
```bash
# Terminal 1: Start backend server
cd backend
npm start           # Twitter API mode
# OR
npm run start:mock  # Mock mode

# Terminal 2: Start frontend (in main directory)
npm run frontend
```

3. **Access the application:**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3001

## Usage

1. Enter a Twitter username (e.g., "elonmusk")
2. Select the number of tweets to fetch (1-100)
3. Click "Load Tweets"
4. View the timeline chart and tweet table

## API Endpoints

- `GET /api/users/by/username/{username}/tweets` - Get user tweets
- `GET /health` - Backend health check

## Security Notes

- Twitter API credentials are stored securely in the backend
- CORS is properly configured
- No sensitive data exposed to the frontend

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Make sure the backend server is running on port 3001
   - Check proxy configuration in `proxy.conf.json`

2. **Twitter API Errors:**
   - Verify your API credentials in `backend/.env`
   - Check rate limits (300 requests per 15 minutes)
   - Ensure the username exists and is public

3. **Connection Issues:**
   - Backend: Check if port 3001 is available
   - Frontend: Check if port 4200 is available

### Rate Limits

Twitter API v2 rate limits:
- User tweets: 300 requests per 15 minutes
- Each request can fetch up to 100 tweets

## Development

### Project Structure

```
├── src/                    # Angular frontend
│   ├── app/
│   │   ├── app.component.*
│   │   ├── chart.component.*
│   │   └── twitter.service.*
│   └── environments/
├── backend/                # Node.js proxy server
│   ├── server.js
│   ├── package.json
│   └── .env
├── proxy.conf.json        # Angular proxy config
└── README.md
```

### Adding Features

- **New chart types:** Modify `chart.component.ts`
- **Additional API endpoints:** Add routes to `backend/server.js`
- **UI improvements:** Update `app.component.html` and styles

## 🚀 Quick Start Options

### Option 1: Mock Mode (Recommended for testing)
```bash
# Using npm script
npm run start:mock

# Or using batch file (Windows)
start-mock.bat
```
**Features:**
- ✅ No Twitter API keys required
- ✅ Uses sample tweet data
- ✅ Perfect for development and testing
- ✅ Bitcoin chart works immediately

### Option 2: Real Twitter API Mode
```bash
# Using npm script  
npm start

# Or using batch file (Windows)
start-twitter.bat
```
**Requirements:**
- 🔑 Valid Twitter API credentials in `backend/.env`
- 🐦 Twitter API v2 access
- 💰 May consume API quota

### Option 3: Manual Start (Advanced)
```bash
# Start backend only (mock)
npm run backend:mock

# Start backend only (Twitter API)  
npm run backend

# Start frontend only
npm run frontend
```

## License

This project is for educational purposes.
