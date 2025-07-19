import { Router } from 'express'
import { healthCheck } from '../controllers/healthCheck.controller.js'

// Initialize health check router
const healthCheckRouter = Router()

/**
 * Health Check Routes Configuration
 *
 * @description Simple health check endpoint for monitoring application status
 * @baseRoute /api/v1/healthcheck
 */

/**
 * Application health check endpoint
 * @route GET /api/v1/healthcheck
 * @access Public
 * @description Checks if the application is running and responding
 * @returns {Object} Health status with timestamp and application info
 * @controller healthCheck
 */
healthCheckRouter.get('/', healthCheck)

export { healthCheckRouter }
