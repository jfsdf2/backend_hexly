# Скачать

npm install:
- express
- sequelize
- sqlite3
- joi
- bcrypt
- jsonwebtoken
- cors
- dotenv

# Сделать

- Добавить .env: JWT_SECRET=your_secret_key

# API

## Создание пользователя

- POST | /api/users
- JSON:
{
    "name": "Alex",
    "full_name": "Alex Smith",
    "number": "+79991234567",
    "email": "alex@example.com",
    "password": "password123"
}

## Получение всех пользователей

- GET |	/api/users

## Получение пользователя

- GET	| /api/users/:id

## Обновление пользователя

- PUT	| /api/users/:id

## Удаление пользователя

- DELETE | /api/users/:id

## Авторизация

- POST | /api/users/login
- JSON:
  {
      "email": "alex@example.com",
      "password": "password123"
  }
