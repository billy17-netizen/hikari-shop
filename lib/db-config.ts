// Database connection configuration
export const dbConfig = {
  // Database connection settings
  url: process.env.DATABASE_URL,
  
  // Maximum number of connections in the pool
  connectionPoolSize: 10,
  
  // Enable query logging in development
  enableLogging: process.env.NODE_ENV !== 'production',
}; 