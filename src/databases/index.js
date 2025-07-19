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

		// Determine connection URI based on environment
		let connectionUri

		if (MONGODB_URI.includes('mongodb+srv://')) {
			// For Atlas (mongodb+srv://), use as-is (database name should be included in URI)
			connectionUri = MONGODB_URI
		} else if (
			MONGODB_URI.includes('mongodb://') &&
			!MONGODB_URI.includes('localhost') &&
			!MONGODB_URI.includes('127.0.0.1')
		) {
			// For remote MongoDB URI that's not localhost, use as-is
			connectionUri = MONGODB_URI
		} else {
			// For local development (localhost/127.0.0.1) or basic URI, append database name
			connectionUri = `${MONGODB_URI}/${DATABASE_NAME}`
		}

		// Attempt to connect to MongoDB
		const connectionInstance = await mongoose.connect(connectionUri, connectionOptions)

		// Log successful connection details (commented for production)
		// console.log(`✅ Database Connected Successfully!`)
		// console.log(`📍 Host: ${connectionInstance.connection.host}`)
		// console.log(`🗄️ Database: ${connectionInstance.connection.name}`)
		// console.log(`🔗 Connection State: ${connectionInstance.connection.readyState}`)
	} catch (error) {
		// Enhanced error logging with more context
		console.error('❌ MongoDB Connection FAILED:')
		console.error(`🔍 Error Type: ${error.name}`)
		console.error(`📝 Error Message: ${error.message}`)

		// Log connection string (without credentials for security)
		// const sanitizedUri = connectionUri
		// 	? connectionUri.replace(/:\/\/.*@/, '://***:***@')
		// 	: 'undefined'
		// console.error(`🔗 Attempted URI: ${sanitizedUri}`)

		// Log full error stack in development
		if (process.env.NODE_ENV === 'development') {
			console.error('📚 Full Error Stack:', error.stack)
		}

		// Exit process with error code
		process.exit(1)
	}
}

// Handle connection events for better monitoring (commented for production)
// mongoose.connection.on('connected', () => {
// 	console.log('🟢 Mongoose connected to MongoDB')
// })

// mongoose.connection.on('error', err => {
// 	console.error('🔴 Mongoose connection error:', err)
// })

// mongoose.connection.on('disconnected', () => {
// 	console.log('🟡 Mongoose disconnected from MongoDB')
// })

// Graceful shutdown handling (commented for production serverless)
// process.on('SIGINT', async () => {
// 	try {
// 		await mongoose.connection.close()
// 		console.log('🔄 MongoDB connection closed through app termination')
// 		process.exit(0)
// 	} catch (error) {
// 		console.error('❌ Error during graceful shutdown:', error)
// 		process.exit(1)
// 	}
// })

export default connectDB
