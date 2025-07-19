import dotenv from 'dotenv'
dotenv.config({
	path: './.env',
})

// Environment Variables
const PORT = Number(process.env.PORT)
const DATABASE_NAME = String(process.env.DATABASE_NAME)
const MONGODB_URI = String(process.env.MONGODB_URI)
const CORS_ORIGIN = String(process.env.CORS_ORIGIN)
const ACCESS_TOKEN_SECRET = String(process.env.ACCESS_TOKEN_SECRET)
const ACCESS_TOKEN_EXPIRY = String(process.env.ACCESS_TOKEN_EXPIRY)
const REFRESH_TOKEN_SECRET = String(process.env.REFRESH_TOKEN_SECRET)
const REFRESH_TOKEN_EXPIRY = String(process.env.REFRESH_TOKEN_EXPIRY)
const CLOUDINARY_CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME)
const CLOUDINARY_API_KEY = String(process.env.CLOUDINARY_API_KEY)
const CLOUDINARY_API_SECRET = String(process.env.CLOUDINARY_API_SECRET)

// Global Constants
const cookieOptions = {
	secure: process.env.NODE_ENV === 'production',
	httpOnly: true,
	sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Allow cross-origin in production
	path: '/', // Will be different for frontend in React on another server
}

// File Upload Limits (in bytes)
const FILE_SIZE_LIMITS = {
	IMAGE: 2 * 1024 * 1024, // 2MB for images (avatar, coverImage, thumbnail)
	VIDEO: 100 * 1024 * 1024, // 100MB for videos
	DOCUMENT: 10 * 1024 * 1024, // 10MB for documents (if needed in future)
}

// File Upload Limits in Human Readable Format
const FILE_SIZE_DISPLAY = {
	IMAGE: '2MB',
	VIDEO: '100MB',
	DOCUMENT: '10MB',
}

export {
	PORT,
	DATABASE_NAME,
	MONGODB_URI,
	CORS_ORIGIN,
	ACCESS_TOKEN_EXPIRY,
	ACCESS_TOKEN_SECRET,
	REFRESH_TOKEN_SECRET,
	REFRESH_TOKEN_EXPIRY,
	CLOUDINARY_CLOUD_NAME,
	CLOUDINARY_API_KEY,
	CLOUDINARY_API_SECRET,
	cookieOptions,
	FILE_SIZE_LIMITS,
	FILE_SIZE_DISPLAY,
}
