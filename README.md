# Tweeter to TradingView

A real-time Bitcoin price chart application with Twitter sentiment overlay, built with Angular and TypeScript.

## Features

🚀 **Real-time Bitcoin Price Chart**
- 1-minute candlestick charts from Binance API
- Live price updates every second
- 14 days of historical data with multi-batch loading
- Professional TradingView-style interface using lightweight-charts

📊 **Advanced Chart Features**
- Responsive design that adapts to screen size
- Dark theme optimized for trading
- Smooth incremental updates without full reloads
- Error handling with automatic fallback mechanisms

🐦 **Twitter Sentiment Integration**
- Tweet markers overlaid on price chart
- Color-coded by content type:
  - 🔵 Blue: Text tweets
  - 🔴 Red: Image tweets  
  - 🟣 Purple: Video tweets
- Mock Twitter API integration ready for real data

⚡ **Performance Optimized**
- Batched data loading to bypass API limits
- Incremental chart updates
- Minimal loading states
- Smart caching and data management

## Tech Stack

- **Frontend**: Angular 18+ with standalone components
- **Charts**: TradingView Lightweight Charts
- **APIs**: Binance REST API, Twitter API (mock)
- **Styling**: Custom CSS with dark theme
- **Build**: Angular CLI with TypeScript

## How it works

1. **Bitcoin Chart**: Automatically loads real-time Bitcoin price data (BTC/USD) from Binance API with 14 days of historical 1-minute candles
2. **Tweet Integration**: Fetch tweets from mock API and see them as color-coded markers on the Bitcoin chart
3. **Live Updates**: Price updates every second, candles every minute, full refresh every 30 minutes
4. **Interactive Visualization**: Professional trading interface with crosshairs, price scales, and responsive design

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PawmelMeller/tweeter-to-tradingview.git
   cd tweeter-to-tradingview
   ```

2. **Install dependencies:**
   ```bash
   # Install all dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

### Running the Application

**Option 1: Quick Start (Recommended)**
```bash
npm start
# This starts both frontend and backend
```

**Option 2: Manual Backend/Frontend**
```bash
# Terminal 1: Start backend mock server
cd backend
node mock-server.js

# Terminal 2: Start frontend (in main directory)
ng serve
```

3. **Access the application:**
   - Frontend: http://localhost:4200
   - Backend Mock API: http://localhost:3000

## Usage

1. The application automatically loads Bitcoin chart data from the last 14 days
2. Live price updates every second in the top-right corner
3. Tweet markers appear as colored dots on the chart timeline
4. Use the refresh button to reload chart data
5. Chart is fully interactive with crosshairs and zoom functionality

## Architecture

```
src/
├── app/
│   ├── bitcoin-chart.component.ts    # Main chart component
│   ├── services/                     # Data services  
│   ├── types/                        # TypeScript interfaces
│   └── utils/                        # Helper utilities
├── backend/
│   ├── mock-server.js               # Mock Twitter API
│   └── mock-tweets.json             # Sample tweet data
└── assets/                          # Static assets
```

## Configuration

Key settings in `bitcoin-chart.component.ts`:

```typescript
// Historical data range (days)
const daysBack = 14;

// Update intervals
const priceUpdateInterval = 1000;      // 1 second
const candleUpdateInterval = 60000;    // 1 minute  
const fullRefreshInterval = 1800000;   // 30 minutes
```

## API Endpoints

- **Binance API**: 
  - `GET /api/v3/ticker/price` - Real-time price data
  - `GET /api/v3/klines` - Historical candle data
- **Mock Twitter API**: 
  - `GET /api/mock-tweets` - Sample tweet data with media classification

## Troubleshooting

### Common Issues

1. **Chart not loading:**
   - Check browser console for API errors
   - Verify internet connection for Binance API access
   - Refresh the page to reload chart data

2. **Price updates stopped:**
   - Green "LIVE" indicator shows connection status
   - Red "OFFLINE" means API connectivity issues
   - Chart automatically retries failed requests

3. **Performance issues:**
   - Large datasets (14 days = ~20k candles) may take time to load initially
   - Incremental updates are optimized for smooth performance
   - Use browser dev tools to monitor network requests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is for educational purposes.

## Acknowledgments

- [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts) for the charting library
- [Binance API](https://binance-docs.github.io/apidocs/) for cryptocurrency data
- Angular team for the amazing framework

---

⭐ Star this repo if you find it useful!
