import pkg from "pg";
const { Client } = pkg;

import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  const client = new Client({
    user: process.env.PG_USER, 
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE, 
    password: process.env.PG_PASSWORD, 
    port: process.env.PG_PORT,
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL:", process.env.PG_HOST);
    return client;
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error.message);
    process.exit(1);
  }
};

export default connectDB;
