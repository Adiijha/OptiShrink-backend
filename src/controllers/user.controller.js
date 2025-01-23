import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User, client } from "../models/user.models.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

// Utility function to generate tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const getUserQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await client.query(getUserQuery, [userId]);
    const user = userResult.rows[0];

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const userModel = new User(client);
    const accessToken = userModel.generateAccessToken(user);
    const refreshToken = userModel.generateRefreshToken(user);

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Error generating tokens");
  }
};

// User Login
const loginUser = asyncHandler(async (req, res) => {
  const { emailOrUsername, password } = req.body;
  
  if (!emailOrUsername || !password) {
    throw new ApiError(400, "Email or Username, Password are required");
  }

  const userModel = new User(client);
  const getUserQuery = `
    SELECT * FROM users 
    WHERE email = $1 OR username = $1
  `;

  const userResult = await client.query(getUserQuery, [emailOrUsername]);
  const user = userResult.rows[0];

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await userModel.comparePassword(
    password.trim(), 
    user.password
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    path: "/",
    expires: new Date(Date.now() + 3600000),
  };

  res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      status: 200,
      data: { 
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email
        }, 
        accessToken, 
        refreshToken 
      },
      message: "User logged in successfully"
    });
});

// User Logout
const logoutUser = asyncHandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// User Registration
const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    throw new ApiError(400, "All fields are required.");
  }

  const userModel = new User(client);

  // Check existing user
  const checkUserQuery = `
    SELECT * FROM users 
    WHERE email = $1 OR username = $2
  `;
  const existingUserResult = await client.query(checkUserQuery, [email, username]);

  if (existingUserResult.rows.length > 0) {
    const existingUser = existingUserResult.rows[0];
    const errorField = existingUser.email === email ? "Email" : "Username";
    throw new ApiError(400, `${errorField} is already registered.`);
  }

  // Create new user
  const newUser = await userModel.create({
    name,
    username,
    email,
    password
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully.",
    user: {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
    },
  });
});

// Get Profile
const getProfile = asyncHandler(async (req, res) => {
  const getUserQuery = 'SELECT name FROM users WHERE id = $1';
  const userResult = await client.query(getUserQuery, [req.user.id]);

  if (userResult.rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ 
    status: 200, 
    data: { name: userResult.rows[0].name } 
  });
});

export { registerUser, loginUser, logoutUser, getProfile };