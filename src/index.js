import dotenv from 'dotenv';
import {app} from './app.js';
import connectDB from './db/index.js';

dotenv.config();

connectDB().then(()=>{
    app.on("error",()=>{
        console.error("Error in starting the server");
        throw error;
    });

    app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error)=>{
    console.error("Error in connecting to the database");
    throw error;
});