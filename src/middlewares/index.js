import { createRateLimit } from './rateLimiter.middleware.js'
import { authOptional, requireAuth, requireGuest } from './authentication.middleware.js'
import {
	cleanupTempFiles,
	autoCleanupTemp,
	uploadImages,
	uploadVideo,
	uploadVideoWithThumbnail,
	validateFieldSpecificSizes,
	handleMulterError,
} from './multer.middleware.js'

export {
	createRateLimit,
	authOptional,
	requireAuth,
	requireGuest,
	cleanupTempFiles,
	autoCleanupTemp,
	uploadImages,
	uploadVideo,
	uploadVideoWithThumbnail,
	validateFieldSpecificSizes,
	handleMulterError,
}
