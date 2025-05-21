import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
const prisma = new PrismaClient();
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Received Auth Header:", authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Invalid auth header format");
      return res.status(401).json({
        error: "Authentication required",
        details: "Valid Bearer token required",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("Extracted Token:", token);

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded Token:", decoded);


    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      console.log("User not found:", decoded.id);
      return res.status(401).json({
        error: "Authentication failed",
        details: "User not found",
      });
    }

    req.user = user;
    console.log("User Authenticated:", user);
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(401).json({
      error: "Authentication failed",
      details: error.message || "Invalid or expired token",
    });
  } finally {
    await prisma.$disconnect();
  }
};
