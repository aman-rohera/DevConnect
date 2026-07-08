import jwt from 'jsonwebtoken';

export const getAuthToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'test_jwt_secret_token_84f95346537dd5e7896755df1216edb718852886271b6c0b8eb44b29f17f244',
    { expiresIn: '1h' }
  );
};

export const getAuthHeaders = (user) => {
  return {
    Authorization: `Bearer ${getAuthToken(user)}`
  };
};
