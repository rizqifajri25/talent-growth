import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes';

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Configure CORS
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

// Register API routes
app.use('/api/v1', healthRoutes);

export default app;
