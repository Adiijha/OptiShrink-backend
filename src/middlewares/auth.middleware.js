import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { client } from '../models/user.models.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        throw new ApiError(401, "Token not provided");
      }
  
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const userModel = new User(client); // Instantiate User with the database client
      const user = await userModel.findById(decodedToken.id); // Use `id`, not `_id`
  
      if (!user) {
        throw new ApiError(404, "User not found");
      }
  
      req.user = user; // Attach user to request
      next();
    } catch (error) {
      console.error("JWT Error:", error.message);
      throw new ApiError(401, "Invalid Access Token");
    }
  });
  
  