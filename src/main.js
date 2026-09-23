import express from 'express'

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
      error: 'Слишком много запросов',
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

class User{
  constructor(id, name, full_name, number, email){
    this.id = id
    this.name = name
    this.full_name = full_name
    this.number = number
    this.email = email
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

const db = {
  users: [],
  products: [],
  orders: []
};

const userController = {
  create: (req, res) => {
    const { name, full_name, number, email } = req.body;
    const user = new User(Date.now(), name, full_name, number, email);
    db.users.push(user);
    res.status(201).json(user);
  },
  readAll: (req, res) => {
    res.json(db.users);
  },
  readOne: (req, res) => {
    const user = db.users.find(u => u.id === Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  },
  update: (req, res) => {
    const user = db.users.find(u => u.id === Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    
    const { name, full_name, number, email } = req.body;
    if (name) user.name = name;
    if (full_name) user.full_name = full_name;
    if (number) user.number = number;
    if (email) user.email = email;
    
    res.json(user);
  },
  delete: (req, res) => {
    const index = db.users.findIndex(u => u.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Пользователь не найден' });
    db.users.splice(index, 1);
    res.status(204).send();
  }
};



const usersRouter = express.Router();
usersRouter.post('/', userController.create);
usersRouter.get('/', userController.readAll);
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