import express from 'express';
import * as userController from '../controller/userController.js';

export const userRouter = express.Router();

userRouter.get('/users', userController.fetchAll);
userRouter.post('/users', userController.create);