import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => { //res use nhi huya hai toh uski jagah _ use kr skte hai production grade code ke liye 
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            new ApiError(401, "Unauthorized")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            //discuss about frontend
            throw new ApiError(404, "Invalid Access Token")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid Access Token")
        
    }

})

export const optionalVerifyJWT = asyncHandler(async (req, _, next) => {
    try {
      // Retrieve token from cookies or headers
      const token =
        req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  
      if (!token) {
        req.user = null; // If no token, set user to null for unauthenticated access
        return next(); // Proceed without throwing an error
      }
  
      // Verify the token
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
      // Find the user associated with the token
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
  
      if (!user) {
        throw new ApiError(404, "Invalid Access Token");
      }
  
      req.user = user; // Attach user details to the request
      next(); // Continue to the next middleware or route handler
    } catch (error) {
      // If token verification fails, allow unauthenticated access
      req.user = null;
      next(); // Do not throw an error, continue processing the request
    }
});
  