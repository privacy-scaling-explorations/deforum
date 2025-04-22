import express from 'express';
import cors from 'cors';
import exampleRoutes from './modules/example/example.routes';
import protocolsRoutes from './modules/protocols/protocols.routes';
import postsRoutes from './modules/posts/posts.routes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register routes
app.use('/api/example', exampleRoutes);
app.use('/api/protocols', protocolsRoutes);
app.use('/api/posts', postsRoutes);

export default app; 