import express from 'express';
import cors from 'cors';

import { userController } from './controllers/userController.js';
import { validateUser } from './utils/validators.js';

const app = express()

app.use(express.json())

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use((req, res, next) => {
  const method = req.method
  const url = req.url
  const time = new Date().toISOString()
  
  console.log(`[${time}] ${method} ${url}`)
  
  next();
});

const reqHistory = new Map()

const rateLimiter = ((req, res, next) => {
  const now = Date.now()
  const ip = req.ip
  const windowMs = 10000
  const maxRequests = 5

  if (!reqHistory.has(ip)) {
    reqHistory.set(ip, [])
  }

  let timestamps = reqHistory.get(ip)
  
  timestamps = timestamps.filter(time => (now - time) < windowMs)

  if (timestamps.length >= maxRequests) {
    reqHistory.set(ip, timestamps);
    return res.status(429).json({ 
      message: 'Слишком много запросов' 
    });
  }

  timestamps.push(now)
  reqHistory.set(ip, timestamps)

  next()
})

app.use(rateLimiter);

const usersRouter = express.Router();
usersRouter.post('/', validateUser, userController.create);
usersRouter.get('/', userController.readAll);
usersRouter.post('/login', userController.login);
usersRouter.get('/:id', userController.readOne);
usersRouter.put('/:id', userController.update);
usersRouter.delete('/:id', userController.delete);
app.use('/api/users', usersRouter);

app.post('/echo', (req, res) => {
  res.json(req.body);
});

const adminGuard = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
  }

  next();
};

app.get('/admin', adminGuard, (req, res) => {
  res.json({ message: 'Добро пожаловать в панель администратора!' });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})