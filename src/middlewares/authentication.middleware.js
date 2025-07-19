import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'
import { ACCESS_TOKEN_SECRET } from '../constants.js'
import { ApiError, asyncHandler, ApiResponse } from '../utils/index.js'

/**
 * Helper function to extract and verify JWT token
 * @param {Object} req - Express request object
 * @returns {Object|null} - User object or null if invalid/missing
 */
const extractAndVerifyToken = async req => {
	try {
		const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '')

		if (!token) {
			return null
		}

		const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET)

		if (!decodedToken?._id) {
			return null
		}

		const user = await User.findById(decodedToken._id)

		return user
	} catch (error) {
		console.warn('Token verification failed:', error.message)
		return null
	}
}

/**
 * Optional Authentication Middleware
 * Attaches user to request if valid token is provided, but doesn't require it
 * Used for routes that work for both authenticated and unauthenticated users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authOptional = asyncHandler(async (req, res, next) => {
	const user = await extractAndVerifyToken(req)
	if (user) {
		req.user = user
	}
	next()
})

/**
 * Required Authentication Middleware
 * Requires valid JWT token and attaches user to request object
 * Returns 401 error if token is missing or invalid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAuth = asyncHandler(async (req, res, next) => {
	const user = await extractAndVerifyToken(req)

	if (!user) {
		throw new ApiError(401, 'Authentication required. Please log in to access this resource.')
	}

	req.user = user
	next()
})

/**
 * Guest Required Middleware
 * Ensures user is NOT authenticated (for login/register routes)
 * Combines auth checking + guest validation in single middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireGuest = asyncHandler(async (req, res, next) => {
	const user = await extractAndVerifyToken(req)

	if (user) {
		return res
			.status(409)
			.json(
				new ApiResponse(
					409,
					null,
					'Already authenticated. Please log out first to access this resource.'
				)
			)
	}

	next()
})

export { authOptional, requireAuth, requireGuest }
