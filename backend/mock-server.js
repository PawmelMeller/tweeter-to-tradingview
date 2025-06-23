const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting Mock Twitter Server...');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Load mock data
const mockTweetsPath = path.join(__dirname, 'mock-tweets.json');
let mockTweetsData;

try {
  mockTweetsData = JSON.parse(fs.readFileSync(mockTweetsPath, 'utf8'));
  console.log('✅ Mock tweets data loaded successfully');
  console.log(`📊 Mock data contains ${mockTweetsData.data.length} tweets`);
} catch (error) {
  console.error('❌ Error loading mock tweets data:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🔍 Health check requested');
  res.json({ 
    status: 'OK', 
    mode: 'MOCK',
    timestamp: new Date().toISOString(),
    mock_tweets_count: mockTweetsData.data.length
  });
});

// Mock Twitter API endpoint
app.get('/api/users/by/username/:username/tweets', (req, res) => {
  const { username } = req.params;
  const maxResults = parseInt(req.query.max_results) || 10;
  
  console.log(`🐦 Mock API request for user: ${username}, max_results: ${maxResults}`);
  
  try {
    // Simulate different responses for different users
    let responseData = { ...mockTweetsData };
    
    // Limit the number of tweets based on max_results
    if (maxResults < responseData.data.length) {
      responseData.data = responseData.data.slice(0, maxResults);
    }
    
    // Add mock flag to response
    responseData.meta = {
      ...responseData.meta,
      result_count: responseData.data.length,
      mock_data: true,
      requested_user: username,
      reason: 'Using mock data - no real Twitter API calls'
    };
    
    // Simulate API delay
    setTimeout(() => {
      console.log(`✅ Mock response sent for ${username}: ${responseData.data.length} tweets`);
      res.json(responseData);
    }, 500); // 500ms delay to simulate real API
    
  } catch (error) {
    console.error('❌ Error processing mock request:', error);
    res.status(500).json({
      error: 'Mock server error',
      message: error.message
    });
  }
});

// Generic mock endpoint for any Twitter API path
app.get('/api/*', (req, res) => {
  console.log(`🔄 Generic mock endpoint hit: ${req.path}`);
  res.json({
    message: 'Mock endpoint',
    path: req.path,
    mock_data: true,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    mode: 'MOCK'
  });
});

// Direct mock tweets endpoint
app.get('/api/mock-tweets', (req, res) => {
  console.log('🐦 Direct mock tweets data requested');
  
  try {
    res.json(mockTweetsData);
  } catch (error) {
    console.error('❌ Error serving mock tweets:', error);
    res.status(500).json({
      error: 'Failed to serve mock tweets data',
      details: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`❓ 404 - Path not found: ${req.path}`);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,    available_endpoints: [
      '/health',
      '/api/users/by/username/:username/tweets',
      '/api/mock-tweets'
    ],
    mode: 'MOCK'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 =======================================');
  console.log('📱 MOCK TWITTER SERVER RUNNING');
  console.log('🚀 =======================================');  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`💊 Health: http://localhost:${PORT}/health`);
  console.log(`🐦 API: http://localhost:${PORT}/api/users/by/username/elonmusk/tweets`);
  console.log(`📊 Mock: http://localhost:${PORT}/api/mock-tweets`);
  console.log('📊 Mode: MOCK DATA ONLY');
  console.log('🔄 No real Twitter API calls will be made');
  console.log('=======================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Mock server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Mock server shutting down...');
  process.exit(0);
});
