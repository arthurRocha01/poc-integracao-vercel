import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv/config'
import { userRouter } from './routes/userRoutes.js';

export const app = express();

app.use(express.json());
app.use(cors());

app.use('/api', userRouter)

// app.listen(3000, () => {
//     console.log('Servidor rodando na porta 3000!');
// });