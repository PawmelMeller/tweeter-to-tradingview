console.log('Server starting...');

const express = require('express');
console.log('Express loaded');

const cors = require('cors');
console.log('CORS loaded');

const axios = require('axios');
console.log('Axios loaded');

const app = express();
console.log('Express app created');

const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Simple server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

console.log('Server setup complete');
