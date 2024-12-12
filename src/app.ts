import dotenv from 'dotenv';
import AuthRouter from './routes/auth';
import ProfileRouter from './routes/profile';
import express, { Express, Request, Response } from 'express';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Add middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Mount the all the routers
app.use('/auth', AuthRouter);
app.use('/profile', ProfileRouter);

// Public route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}\n`);
});