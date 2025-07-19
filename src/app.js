import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { CORS_ORIGIN } from './constants.js'
import { ApiResponse } from './utils/ApiResponse.js'
import { generalRateLimit } from './middlewares/rateLimiter.middleware.js'

/**
 * Express application instance
 * Main application server configuration
 */
const app = express()

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Trust proxy for accurate IP detection
app.set('trust proxy', 1)

// ============================================
// VIEW ENGINE CONFIGURATION
// ============================================

/**
 * EJS Template Engine Configuration
 * Set up EJS for rendering HTML views
 */
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

/**
 * Global Rate Limiting
 * Applied to all routes to prevent abuse
 * 100 requests per 15 minutes per IP
 */
// app.use(generalRateLimit) // Not implemented yet

/**
 * CORS Configuration
 * - Enables cross-origin requests from specified origins
 * - Allows credentials (cookies, authorization headers)
 */
app.use(
	cors({
		origin: CORS_ORIGIN,
		credentials: true,
		optionsSuccessStatus: 200, // Support legacy browsers
	})
)

/**
 * Cookie Parser Middleware
 * Parses cookies attached to client requests
 */
app.use(cookieParser())

/**
 * Static File Serving
 * Serves static files from the 'public' directory
 */
app.use(express.static(path.join(__dirname, '../public')))

/**
 * JSON Body Parser
 * Parses incoming JSON requests with size limit
 * Limit: 16KB to prevent large payload attacks
 */
app.use(
	express.json({
		limit: '16kb',
		type: 'application/json',
	})
)

/**
 * URL-encoded Body Parser
 * Parses URL-encoded data (form submissions)
 * Extended: true allows rich objects and arrays to be encoded
 */
app.use(
	express.urlencoded({
		extended: true,
		limit: '16kb',
		type: 'application/x-www-form-urlencoded',
	})
)

// ============================================
// ROUTES IMPORT
// ============================================
import { healthCheckRouter } from './routes/healthCheck.routes.js'
import { userRouter } from './routes/user.routes.js'
import { videoRouter } from './routes/video.routes.js'
import { dashboardRouter } from './routes/dashboard.routes.js'
import { subscriptionRouter } from './routes/subscription.routes.js'
import { commentRouter } from './routes/comment.routes.js'
import { likeRouter } from './routes/like.routes.js'
import { tweetRouter } from './routes/tweet.routes.js'
import { playlistRouter } from './routes/playlist.routes.js'

// ============================================
// ROUTES DECLARATION
// ============================================

/**
 * API Documentation Route
 * Serves the interactive API documentation page
 * Automatically detects device type and serves appropriate version
 */
app.get('/', (req, res) => {
	res.redirect('/api-docs')
})

app.get('/api-docs', (req, res) => {
	res.render('api-docs', {
		title: 'YouTube Clone API Documentation',
		baseUrl: req.protocol + '://' + req.get('host'),
	})
})

/**
 * Health Check Routes
 * Used for monitoring application status
 */
app.use('/api/v1/health-check', healthCheckRouter)

/**
 * User Management Routes
 * Handles user authentication, registration, profile management
 */
app.use('/api/v1/users', userRouter)

/**
 * Video Management Routes
 * Handles video upload, streaming, metadata management
 */
app.use('/api/v1/videos', videoRouter)

/**
 * Dashboard Routes
 * Provides analytics and dashboard data
 */
app.use('/api/v1/dashboard', dashboardRouter)

/**
 * Subscription Management Routes
 * Handles user subscriptions to channels
 */
app.use('/api/v1/subscriptions', subscriptionRouter)

/**
 * Comment System Routes
 * Manages comments on videos and other content
 */
app.use('/api/v1/comments', commentRouter)

/**
 * Like/Dislike System Routes
 * Handles user reactions to content
 */
app.use('/api/v1/likes', likeRouter)

/**
 * Tweet/Post Routes
 * Manages user posts and social features
 */
app.use('/api/v1/tweets', tweetRouter)

/**
 * Playlist Management Routes
 * Handles creation and management of video playlists
 */
app.use('/api/v1/playlists', playlistRouter)

// ============================================
// ERROR HANDLING & FALLBACK ROUTES
// ============================================

/**
 * API Route Not Found Handler
 * Catches all unmatched API routes and returns structured error
 */
app.use('/api/*', (req, res) => {
	console.warn(`API route not found: ${req.method} ${req.originalUrl}`)
	res
		.status(404)
		.json(
			new ApiResponse(
				404,
				null,
				`API endpoint '${req.originalUrl}' not found. Please check the API documentation.`
			)
		)
})

/**
 * Global Not Found Handler
 * Catches all other unmatched routes (non-API)
 */
app.use('*', (req, res) => {
	console.warn(`Page not found: ${req.method} ${req.originalUrl}`)
	res.status(404).json({
		success: false,
		message: 'Page not found',
		statusCode: 404,
		path: req.originalUrl,
	})
})

/**
 * Global Error Handler
 * Catches any unhandled errors in the application
 */
app.use((error, req, res, next) => {
	console.error('Unhandled error:', error)

	// Don't expose internal errors in production
	const isDevelopment = process.env.NODE_ENV === 'development'

	res
		.status(error.status || 500)
		.json(
			new ApiResponse(
				error.status || 500,
				null,
				isDevelopment ? error.message : 'Internal Server Error',
				isDevelopment ? error.stack : undefined
			)
		)
})

export { app }
