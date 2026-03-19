import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv/config';
import { userRouter } from './routes/userRoutes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());

const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

app.use('/api', userRouter);

// app.get('/', (req, res) => {
//   res.sendFile(path.join(frontendPath, 'index.html'));
// });

// app.listen(3030, () => {
//   console.log('Servidor rodando em http://localhost:3030');
// });