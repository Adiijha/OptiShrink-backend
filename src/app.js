import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieparser from 'cookie-parser';

const app = express();

const corsOptions = {
    origin: "https://optishrink.vercel.app",
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieparser());
app.options("*", cors(corsOptions));

import userRouter from './routes/user.routes.js';
app.use('/user', userRouter);

// import pdfRouter from './routes/pdf.routes.js';
// app.use('/pdf', pdfRouter);

import imageRouter from './routes/img.routes.js';
app.use('/image', imageRouter);

export {app};