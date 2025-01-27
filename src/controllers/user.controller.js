import { asyncHandler } from "../utils/asyncHandler.js"; 
import { ApiError } from "../utils/ApiError.js";         
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();


// Utility function to generate tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();  // Ensure this method exists and works
    const refreshToken = user.generateRefreshToken();  // Ensure this method exists and works

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Error generating tokens");
  }
};

// User Login
const loginUser = asyncHandler(async (req, res) => {
  const { emailOrUsername, password } = req.body;
  console.log("Login Request:", req.body);
  
  if (!emailOrUsername || !password) {
    throw new ApiError(400, "Email or Username, Password are required");
  }


  const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  });


  if (!user) {
    res.status(404).json({ message: "User not found" });
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password.trim());
  console.log(password);


  if (!isPasswordValid) {
    res.status(401).json({ message: "Invalid credentials" });
    throw new ApiError(401, "Invalid credentials");
  }


  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
  secure: false,
  sameSite: "none", // Cross-origin cookies
  path: "/",
  expires: new Date(Date.now() + 3600000),
  };

  res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      status: 200,
      data: { user: loggedInUser, accessToken, refreshToken },
      message: "User logged in successfully"
    });

});

// User Logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true, // Set to true in production
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});
 

const registerUser = asyncHandler(async (req, res) => {
    const { name, username, email, password } = req.body;
  
    // Validate required fields
    if (!name || !username || !email || !password) {
      throw new ApiError(400, "All fields are required.");
    }
  
    // Check if user already exists (by email or username)
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username },
      ],
    });
  
    if (existingUser) {
      const errorField = existingUser.email === email ? "Email" : "Username";
      throw new ApiError(400, `${errorField} is already registered.`);
    }
  
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Create the user
    const newUser = await User.create({
      name,
      username,
      email,
      password,
    });
  
    if (!newUser) {
      throw new ApiError(500, "User registration failed. Please try again.");
    }
  
    // Send response
    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
      },
    });
  });  


const getProfile = asyncHandler(async (req, res) => {
  // Fetching only the name field of the user by ID
  const user = await User.findById(req.user._id).select("name");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // Return the user's name in the response
  res.status(200).json({ status: 200, data: { name: user.name } });
});

const getAllLinks = asyncHandler(async (req, res) => {
  // Check if the user is authenticated (i.e., logged in)
  if (!req.user) {
    throw new ApiError(401, "You must be logged in to view your image links");
  }

  // Retrieve all compressed image URLs, their compression dates, and their IDs for the logged-in user
  const user = await User.findById(req.user._id).select("compressedFiles");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Prepare the response data, including image URL, compression date, and image ID
  const imageLinksWithDateAndId = user.compressedFiles.map(image => ({
    id: image._id.toString(), // Include the image ID as a string
    url: image.url,
    compressedAt: image.compressedAt.toISOString(), // Convert date to ISO format
  }));

  // Send the response with the user's compressed image URLs, dates, and IDs
  res.status(200).json(new ApiResponse(true, "Retrieved image links successfully", imageLinksWithDateAndId));
});

const deleteLink = asyncHandler(async (req, res) => {
  const { fileId } = req.body; // Get fileId from the request body

  // Get the authenticated user from the request object (set by the verifyJWT middleware)
  const user = req.user; 

  // Find the file to delete by ID in the user's compressedFiles array
  const fileIndex = user.compressedFiles.findIndex((file) => file._id.toString() === fileId);
  if (fileIndex === -1) {
    throw new ApiError(404, 'File not found');
  }

  // Remove the file from the array
  user.compressedFiles.splice(fileIndex, 1);
  await user.save(); // Save the user with the updated compressedFiles array

  res.status(200).json({
    success: true,
    message: 'File deleted successfully',
  });
});


export default deleteLink;


export { registerUser, loginUser, logoutUser, getProfile, getAllLinks, deleteLink };