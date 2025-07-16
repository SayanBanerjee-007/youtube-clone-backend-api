/*
// NOT IMPLEMENTED
// This file is not currently used in the application
*/

import rateLimit from 'express-rate-limit'
import { ApiResponse } from '../utils/ApiResponse.js'

/**
 * Custom rate limit message handler
 * Returns consistent API response format for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
	console.warn(`Rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`)

	res
		.status(429)
		.json(
			new ApiResponse(
				429,
				null,
				'Too many requests from this IP address. Please try again later.',
				[
					`Rate limit exceeded. Maximum ${req.rateLimit.limit} requests per ${
						req.rateLimit.windowMs / 1000 / 60
					} minutes allowed.`,
				]
			)
		)
}

/**
 * Skip rate limiting for successful requests handler
 * Only count failed requests (4xx, 5xx) towards rate limit
 */
const skipSuccessfulRequests = (req, res) => {
	return res.statusCode < 400
}

/**
 * General API Rate Limiter
 * Applied to all API routes
 * Allows 100 requests per 15 minutes per IP
 */
export const generalRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per windowMs
	message: rateLimitHandler,
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	skip: skipSuccessfulRequests, // Don't count successful requests
	keyGenerator: req => {
		// Use IP address as the key for rate limiting
		return req.ip || req.connection.remoteAddress || req.socket.remoteAddress
	},
})

/**
 * Authentication Rate Limiter
 * Applied to login/register routes
 * Stricter limits to prevent brute force attacks
 * Allows 5 attempts per 15 minutes per IP
 */
export const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 5, // Limit each IP to 5 requests per windowMs
	message: rateLimitHandler,
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: false, // Count all requests for auth endpoints
	keyGenerator: req => {
		return req.ip || req.connection.remoteAddress || req.socket.remoteAddress
	},
})

/**
 * Upload Rate Limiter
 * Applied to file upload routes
 * Moderate limits to prevent spam uploads
 * Allows 10 uploads per hour per IP
 */
export const uploadRateLimit = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	limit: 10, // Limit each IP to 10 uploads per hour
	message: rateLimitHandler,
	standardHeaders: true,
	legacyHeaders: false,
	skip: skipSuccessfulRequests,
	keyGenerator: req => {
		return req.ip || req.connection.remoteAddress || req.socket.remoteAddress
	},
})

/**
 * API Creation Rate Limiter
 * Applied to POST routes for creating resources
 * Prevents spam creation of comments, tweets, etc.
 * Allows 20 creations per hour per IP
 */
export const createRateLimit = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	limit: 20, // Limit each IP to 20 creations per hour
	message: rateLimitHandler,
	standardHeaders: true,
	legacyHeaders: false,
	skip: skipSuccessfulRequests,
	keyGenerator: req => {
		return req.ip || req.connection.remoteAddress || req.socket.remoteAddress
	},
})

/**
 * Search Rate Limiter
 * Applied to search endpoints
 * Prevents abuse of search functionality
 * Allows 50 searches per 15 minutes per IP
 */
export const searchRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 50, // Limit each IP to 50 searches per 15 minutes
	message: rateLimitHandler,
	standardHeaders: true,
	legacyHeaders: false,
	skip: skipSuccessfulRequests,
	keyGenerator: req => {
		return req.ip || req.connection.remoteAddress || req.socket.remoteAddress
	},
})
