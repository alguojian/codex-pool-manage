import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:8080',
};
