import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'express_delivery_secret';
const ACCESS_TOKEN_LIFETIME = '1h';

export const generateAccessToken = (employee) => {
  return jwt.sign(
    {
      staff_number: employee.staff_number,
      position_name: employee.position_name,
      pickup_point_index: employee.pickup_point_index
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_LIFETIME }
  );
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      staff_number: payload.staff_number,
      position_name: payload.position_name,
      pickup_point_index: payload.pickup_point_index
    };
    next();
  } catch (err) {
    console.error('Token verify error:', err.message);
    return res.status(401).json({ message: 'Недействительный или просроченный токен' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    if (!allowedRoles.includes(req.user.position_name)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    next();
  };
};
