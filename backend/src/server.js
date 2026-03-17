import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv/config';
import { userRouter } from './routes/userRoutes.js';

const app = express();

// necessário no ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middlewares
app.use(express.json());
app.use(cors());

// 👇 CAMINHO PARA A PASTA FRONTEND (FORA DO BACKEND)
const frontendPath = path.join(__dirname, '../../frontend');

// servir arquivos estáticos
app.use(express.static(frontendPath));

// rotas da API
app.use('/api', userRouter);

// abrir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(3030, () => {
  console.log('Servidor rodando em http://localhost:3030');
});