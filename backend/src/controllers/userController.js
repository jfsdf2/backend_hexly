import bcrypt from 'bcrypt';
import { User } from '../db.js';

export const userController = {
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