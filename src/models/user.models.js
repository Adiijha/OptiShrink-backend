import pkg from "pg";
const { Client } = pkg;
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

class User {
  constructor(client) {
    this.client = client;
  }

  // Create users table
  static async createTable(client) {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await client.query(createTableQuery);
  }

  // Hash password before saving
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // Create a new user
  async create(userData) {
    const { name, username, email, password } = userData;
    const hashedPassword = await User.hashPassword(password);

    const insertQuery = `
      INSERT INTO users (name, username, email, password) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, username, email, created_at
    `;

    try {
      const result = await this.client.query(insertQuery, [name, username, email, hashedPassword]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await this.client.query(query, [username]);
    return result.rows[0];
  }

  // Check password
  async comparePassword(inputPassword, storedPassword) {
    return await bcrypt.compare(inputPassword, storedPassword);
  }

  // Add this method to the User class
async findById(userId) {
  const query = 'SELECT id, name, username, email FROM users WHERE id = $1';
  const result = await this.client.query(query, [userId]);

  if (result.rows.length === 0) {
    return null; // User not found
  }

  return result.rows[0]; // Return user data
}


  // Generate access token
  generateAccessToken(user) {
    return jwt.sign({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name
    }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
  }

  // Generate refresh token
  generateRefreshToken(user) {
    return jwt.sign({
      id: user.id
    }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
  }
}

// PostgreSQL connection setup
const client = new Client({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});

client.connect()
  .then(() => User.createTable(client))
  .catch(err => console.error('Database connection error', err));

export { User, client };