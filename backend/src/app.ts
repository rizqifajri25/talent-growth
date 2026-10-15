import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/posts.routes';
import commentRoutes from './routes/comments.routes';
import authorRoutes from './routes/authors.routes';
import topicRoutes from './routes/topics.routes';

const app = express();

// Parse JSON request bodies (supporting avatar photo data URLs)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/authors', authorRoutes);
app.use('/api/v1/topics', topicRoutes);
app.use('/api/v1', commentRoutes);
app.use('/api/v1/posts', postRoutes);

export default app;
