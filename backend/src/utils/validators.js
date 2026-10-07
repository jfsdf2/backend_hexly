import Joi from 'joi';

export const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const phone_regex = /^\+?[\d\s()\-]{7,20}$/

export const userSchema = Joi.object({
    name: Joi.string().min(2).required(),
    full_name: Joi.string().min(2),
    number: Joi.string().pattern(phone_regex),
    email: Joi.string().email().required().pattern(email_regex),
    password: Joi.string().min(6).required()
});

export const validateUser = (req, res, next) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};