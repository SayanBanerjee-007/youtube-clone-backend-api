import mongoose from 'mongoose'
import { DATABASE_NAME, MONGODB_URI } from '../constants.js'

/**
 * Establishes connection to MongoDB database
 * @returns {Promise<void>} Resolves when connection is established
 * @throws {Error} Throws error if connection fails
 */
const connectDB = async () => {
  try {
    // Validate required environment variables
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables')
    }

    if (!DATABASE_NAME) {
      throw new Error('DATABASE_NAME is not defined in constants')
    }

    // Configure mongoose connection options for better reliability
    const connectionOptions = {
      maxPoolSize: 100, // Maintain up to 100 socket connections, default is 100
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds, default is 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity, default is 30 seconds
    }

    // Attempt to connect to MongoDB
    const connectionInstance = await mongoose.connect(
      `${MONGODB_URI}/${DATABASE_NAME}`,
      connectionOptions
    )

    // Log successful connection details
    console.log(`✅ Database Connected Successfully!`)
    console.log(`📍 Host: ${connectionInstance.connection.host}`)
    console.log(`🗄️ Database: ${connectionInstance.connection.name}`)
    console.log(
      `🔗 Connection State: ${connectionInstance.connection.readyState}`
    )
  } catch (error) {
    // Enhanced error logging with more context
    console.error('❌ MongoDB Connection FAILED:')
    console.error(`🔍 Error Type: ${error.name}`)
    console.error(`📝 Error Message: ${error.message}`)

    // Log connection string (without credentials for security)
    const sanitizedUri = MONGODB_URI
      ? MONGODB_URI.replace(/:\/\/.*@/, '://***:***@')
      : 'undefined'
    console.error(
      `🔗 Attempted URI: ${sanitizedUri}/${DATABASE_NAME || 'undefined'}`
    )

    // Log full error stack in development
    if (process.env.NODE_ENV === 'development') {
      console.error('📚 Full Error Stack:', error.stack)
    }

    // Exit process with error code
    process.exit(1)
  }
}

// Handle connection events for better monitoring
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB')
})

mongoose.connection.on('error', err => {
  console.error('🔴 Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB')
})

// Graceful shutdown handling
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close()
    console.log('🔄 MongoDB connection closed through app termination')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error)
    process.exit(1)
  }
})

export default connectDB
