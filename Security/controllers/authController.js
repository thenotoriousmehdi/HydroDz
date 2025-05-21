import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        fullName: true, 
      }
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    const accessToken = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name, 
        fullName: user.fullName
      },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      accessToken,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: "Something went wrong",
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
};
