import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
