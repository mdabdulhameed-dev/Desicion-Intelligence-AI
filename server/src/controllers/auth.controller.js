import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { config } from '../config/env.js';

function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export async function register(req, res, next) {
  try {
    const { name, email, password, organization } = req.body;

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr-${uuidv4().slice(0, 8)}`,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      organization: organization || 'Enterprise Decision Team',
      role: 'Decision Analyst',
      createdAt: new Date().toISOString()
    };

    await db.createUser(newUser);

    const token = createToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        organization: newUser.organization,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function demoLogin(req, res, next) {
  try {
    const demoUser = await db.findUserByEmail('demo@stratagem.ai');
    if (!demoUser) {
      return res.status(404).json({
        success: false,
        error: 'Demo user not found'
      });
    }

    const token = createToken(demoUser);

    return res.json({
      success: true,
      message: 'Demo login successful',
      token,
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        organization: demoUser.organization,
        role: demoUser.role
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}
