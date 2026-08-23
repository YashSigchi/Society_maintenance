import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { notifyQuietly, welcomeEmailHtml } from '../utils/email';

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

const publicUser = (user: {
  id: string;
  name: string;
  email: string;
  role: string;
  apartmentNumber: string | null;
  avatarUrl?: string | null;
  mustChangePassword: boolean;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  apartmentNumber: user.apartmentNumber,
  avatarUrl: user.avatarUrl ?? null,
  mustChangePassword: user.mustChangePassword,
});

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, apartmentNumber } = req.body;

    // Never trust a role supplied by the client. Public registration is residents only.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        apartmentNumber,
        role: 'RESIDENT',
        mustChangePassword: false,
      }
    });

    const token = generateToken(user.id);

    notifyQuietly(user.email, 'Welcome to SocietyHub', welcomeEmailHtml(user.name));

    return res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    return res.json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  return res.json({ user: req.user });
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    return res.json({
      message: 'Password updated successfully',
      user: publicUser(updated),
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
    });
    return res.json({
      message: 'Profile updated',
      user: publicUser(updated),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Please choose an image to upload' });
    }
    if (!AVATAR_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.' });
    }

    const { uploadToCloudinary } = await import('../utils/cloudinary');
    const result = await uploadToCloudinary(file.buffer, 'societyhub_avatars');

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: result.secure_url },
    });

    return res.json({
      message: 'Avatar updated',
      user: publicUser(updated),
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ message: 'Failed to upload avatar' });
  }
};
