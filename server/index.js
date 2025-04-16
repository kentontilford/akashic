const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
// Configure CORS for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://akashic-client.onrender.com', 'https://akashic.vercel.app']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(require('./middleware/errorHandler'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/memory', require('./routes/memory'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/prompt', require('./routes/prompt'));
app.use('/api/conversation', require('./routes/conversation'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Akashic API',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/users',
      '/api/memory',
      '/api/profile',
      '/api/prompt',
      '/api/conversation'
    ]
  });
});

// Initialize default profiles on startup
const profileService = require('./services/profileService');
profileService.loadDefaultProfiles()
  .then(() => console.log('Default profiles loaded'))
  .catch(err => console.error('Error loading default profiles:', err));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});