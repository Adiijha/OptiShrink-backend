import pkg from "pg";
const { Client } = pkg;

import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  const client = new Client({
    connectionString: process.env.PG_DATABASE_URL, // Use connection string
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false, // Add SSL for production
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL:", process.env.PG_DATABASE_URL);
    return client;
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error.message);
    process.exit(1);
  }
};

export default connectDB;
