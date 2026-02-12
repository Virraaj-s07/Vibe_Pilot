import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicDir));

// API Routes
app.use('/api', apiRoutes);

// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
    console.log(`Vibe-Pilot running at http://localhost:${port}`);
});
