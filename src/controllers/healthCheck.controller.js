import os from 'os'
import mongoose from 'mongoose'
import { asyncHandler, ApiResponse } from '../utils/index.js'

/**
 * Health check endpoint controller
 * Provides comprehensive system health information including:
 * - Application uptime
 * - Memory usage statistics
 * - System load averages
 * - Database connection status
 *
 * @route GET /api/v1/healthcheck
 * @access Public
 */
const healthCheck = asyncHandler(async (_, res) => {
	try {
		// Get current timestamp for response timing
		const timestamp = new Date().toISOString()

		// Check database connection status
		const dbState = mongoose.connection.readyState
		const databaseStatus = {
			state: mongoose.STATES[dbState] || 'Unknown',
			connected: dbState === 1, // 1 = connected
			host: mongoose.connection.host || 'Not connected',
			name: mongoose.connection.name || 'Not connected',
		}

		// Get memory usage with better formatting
		const memoryUsage = process.memoryUsage()
		const formattedMemory = {
			rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`, // Resident Set Size
			heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
			heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
			external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
		}

		// Get system load averages (1, 5, 15 minutes)
		const loadAverage = os.loadavg()
		const systemLoad = {
			'1min': loadAverage[0]?.toFixed(2) || 'N/A',
			'5min': loadAverage[1]?.toFixed(2) || 'N/A',
			'15min': loadAverage[2]?.toFixed(2) || 'N/A',
		}

		// Compile comprehensive health information
		const healthInfo = {
			status: 'healthy',
			timestamp,
			uptime: {
				seconds: Math.floor(process.uptime()),
				formatted: formatUptime(process.uptime()),
			},
			memory: formattedMemory,
			system: {
				platform: os.platform(),
				arch: os.arch(),
				nodeVersion: process.version,
				loadAverage: systemLoad,
				totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
				freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`,
			},
			database: databaseStatus,
			environment: process.env.NODE_ENV || 'development',
		}

		// Determine overall health status
		const isHealthy =
			databaseStatus.connected && memoryUsage.heapUsed < memoryUsage.heapTotal * 0.95 // Less than 90% heap usage

		if (!isHealthy) {
			healthInfo.status = 'degraded'
			healthInfo.warnings = []

			if (!databaseStatus.connected) {
				healthInfo.warnings.push('Database connection is not established')
			}

			if (memoryUsage.heapUsed > memoryUsage.heapTotal * 0.9) {
				healthInfo.warnings.push('High memory usage detected')
			}
		}

		// Return appropriate status code based on health
		const statusCode = isHealthy ? 200 : 503
		const message = isHealthy ? 'Service is healthy' : 'Service is degraded'

		return res.status(statusCode).json(new ApiResponse(statusCode, healthInfo, message))
	} catch (error) {
		// Handle any unexpected errors during health check
		console.error('Health check failed:', error)

		const errorHealthInfo = {
			status: 'error',
			timestamp: new Date().toISOString(),
			error: 'Health check failed',
			message: error.message || 'Unknown error occurred',
		}

		return res.status(500).json(new ApiResponse(500, errorHealthInfo, 'Health check failed'))
	}
})

/**
 * Helper function to format uptime in human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
	const days = Math.floor(seconds / 86400)
	const hours = Math.floor((seconds % 86400) / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const secs = Math.floor(seconds % 60)

	const parts = []
	if (days > 0) parts.push(`${days}d`)
	if (hours > 0) parts.push(`${hours}h`)
	if (minutes > 0) parts.push(`${minutes}m`)
	if (secs > 0) parts.push(`${secs}s`)

	return parts.join(' ') || '0s'
}

export { healthCheck }
