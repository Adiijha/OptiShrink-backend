import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  getAllLinks
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public Routes
router.post("/register", registerUser); // User registration
router.post("/login", loginUser); // User login

// Protected Routes (Require Authentication)
router.post("/logout", verifyJWT, logoutUser); // User logout (JWT-protected)

router.get("/profile", verifyJWT, getProfile); // Get user profile (JWT-protected)

router.get("/getlinks", verifyJWT, getAllLinks); // Get all compressed image links (JWT-protected)

export default router;