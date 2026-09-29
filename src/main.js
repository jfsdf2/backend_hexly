import express from 'express';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { User } from './db.js';

const app = express()

app.use(express.json())

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

class Products{
  constructor(id, name, price, category){
    this.id = id
    this.name = name
    this.price = price
    this.category = category
  }
}

class Order{
  constructor(id, userId, productId, status, totalAmount){
    this.id = id
    this.userId = userId
    this.productId = productId
    this.status = status
    this.totalAmount = totalAmount
  }
}

const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phone_regex = /^\+?[\d\s()\-]{7,20}$/

const userSchema = Joi.object({
  name: Joi.string().min(2).required(),
  full_name: Joi.string().min(2),
  number: Joi.string().pattern(phone_regex),
  email: Joi.string().email().required().pattern(email_regex),
  password: Joi.string().min(6).required()
});

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
      return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const userController = {
  create: async (req, res) => {
    try {
      const { name, full_name, number, email, password } = req.body;
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const user = await User.create({
        name,
        full_name,
        number,
        email,
        password: hashedPassword
      });
      const userResponse = user.toJSON();
      delete userResponse.password;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка сервера при создании пользователя' });
    }
  },
  readAll: async (req, res) => {
    try {
      const users = await User.findAll({ 
        attributes: { exclude: ['password'] } 
      });
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка сервера при получении списка пользователей' });
    }
  },
  readOne: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id, { 
        attributes: { exclude: ['password'] } 
      });
      if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка сервера при получении пользователя' });
    }
  },
  update: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

      const { name, full_name, number, email, password } = req.body;
      
      const updates = {};
      if (name) updates.name = name;
      if (full_name) updates.full_name = full_name;
      if (number) updates.number = number;
      if (email) updates.email = email;
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }
      await user.update(updates);

      const userResponse = user.toJSON();
      delete userResponse.password;
      res.json(userResponse);
      } 
      catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка сервера при обновлении пользователя' });
    }
  },
  delete: async (req, res) => {
    try {
      const deletedRows = await User.destroy({ 
        where: { id: req.params.id } 
      });
      
      if (deletedRows === 0) return res.status(404).json({ error: 'Пользователь не найден' });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка сервера при удалении пользователя' });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Неверный email или password' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Неверный email или password' });
      }
      res.json({ message: 'Авторизация успешна!', userId: user.id });
    } 
      catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка сервера при авторизации' });
    }
  }
};


const usersRouter = express.Router();
usersRouter.post('/', validateUser, userController.create);
usersRouter.post('/', userController.create);
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