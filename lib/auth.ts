import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@/typings/authTypings';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory user storage (replace with database in production)
const users: User[] = [
  {
    id: '1',
    email: 'admin@walmart.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// Hash the admin password
const hashAdminPassword = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  return hashedPassword;
};

// Store hashed passwords (in production, use a database)
const userPasswords: { [key: string]: string } = {};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export const findUserByEmail = (email: string): User | null => {
  return users.find(user => user.email === email) || null;
};

export const findUserById = (id: string): User | null => {
  return users.find(user => user.id === id) || null;
};

export const createUser = async (email: string, password: string, name: string, role: UserRole = UserRole.CUSTOMER): Promise<User> => {
  const hashedPassword = await hashPassword(password);
  const newUser: User = {
    id: (users.length + 1).toString(),
    email,
    name,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  users.push(newUser);
  userPasswords[newUser.id] = hashedPassword;
  
  return newUser;
};

export const validateUserPassword = async (userId: string, password: string): Promise<boolean> => {
  const hashedPassword = userPasswords[userId];
  if (!hashedPassword) return false;
  
  return await comparePassword(password, hashedPassword);
};

// Initialize admin user password
hashAdminPassword().then(hashed => {
  userPasswords['1'] = hashed;
});
