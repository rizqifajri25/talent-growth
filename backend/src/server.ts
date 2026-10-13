import dotenv from 'dotenv';

// Load environment variables before importing app
dotenv.config();

import app from './app';

const PORT = parseInt(process.env.PORT || '4000', 10);

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Talent Growth API Server`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Health      : http://localhost:${PORT}/api/v1/health`);
  console.log(`   Frontend    : ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('');
});

// Handle startup errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
  } else {
    console.error('❌ Server startup error:', error.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
