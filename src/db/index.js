import {DB_NAME} from '../constants.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Connected to the MongoDB ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error in connecting to the database");
        throw error;
        
    }
}

export default connectDB;