import { Router } from 'express'
import { requireAuth } from '../middlewares/authentication.middleware.js'
import {
	uploadImages,
	uploadVideoWithThumbnail,
	validateFieldSpecificSizes,
	autoCleanupTemp,
} from '../middlewares/multer.middleware.js'
import {
	getAllVideos,
	publishAVideo,
	getVideoById,
	updateVideo,
	deleteVideo,
	togglePublishStatus,
} from '../controllers/video.controller.js'

// Initialize video router
const videoRouter = Router()

/**
 * Video Routes Configuration
 *
 * @description All routes handle video-related operations with proper authentication and file upload
 * @baseRoute /api/v1/videos
 */

/**
 * Get all published videos with pagination and filtering
 * @route GET /api/v1/videos
 * @access Public
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of videos per page (optional, default: 10, max: 100)
 * @query {string} keyword - Search keyword for title/description (optional)
 * @query {string} sortBy - Sort field: 'createdAt', 'views', 'likesCount' (optional, default: 'createdAt')
 * @query {string} sortType - Sort order: 'asc' or 'desc' (optional, default: 'desc')
 * @query {string} userId - Filter by user ID (optional)
 * @returns {Object} Paginated list of videos with owner information
 * @controller getAllVideos
 */

/**
 * Upload and publish a new video
 * @route POST /api/v1/videos
 * @access Private (authenticated users only)
 * @middleware requireAuth, uploadVideoWithThumbnail, autoCleanupTemp, validateFieldSpecificSizes
 * @files {File} videoFile - Video file (required, max: 100MB, formats: MP4, AVI, MKV, MOV, WMV)
 * @files {File} thumbnail - Video thumbnail (required, max: 2MB, formats: JPEG, PNG, GIF, WebP)
 * @body {string} title - Video title (required, max: 100 characters)
 * @body {string} description - Video description (required, max: 1000 characters)
 * @returns {Object} Created video object with upload details
 * @controller publishAVideo
 */
videoRouter
	.route('/')
	.get(getAllVideos)
	.post(
		requireAuth,
		uploadVideoWithThumbnail.fields([
			{
				name: 'videoFile',
				maxCount: 1,
			},
			{
				name: 'thumbnail',
				maxCount: 1,
			},
		]),
		autoCleanupTemp,
		validateFieldSpecificSizes,
		publishAVideo
	)

/**
 * Get specific video by ID with view tracking
 * @route GET /api/v1/videos/:videoId
 * @access Public
 * @params {string} videoId - ID of the video to fetch (required)
 * @note Increments view count for non-owners
 * @note Owners can view their own unpublished videos
 * @returns {Object} Video details with owner information and like status
 * @controller getVideoById
 */

/**
 * Update video details
 * @route PATCH /api/v1/videos/:videoId
 * @access Private (video owner only)
 * @middleware requireAuth, uploadImages, autoCleanupTemp
 * @params {string} videoId - ID of the video to update (required)
 * @files {File} thumbnail - New thumbnail image (optional, max: 2MB, formats: JPEG, PNG, GIF, WebP)
 * @body {string} title - Updated video title (optional, max: 100 characters)
 * @body {string} description - Updated video description (optional, max: 1000 characters)
 * @note Only video owner can update
 * @returns {Object} Updated video object
 * @controller updateVideo
 */

/**
 * Delete video and associated files
 * @route DELETE /api/v1/videos/:videoId
 * @access Private (video owner only)
 * @middleware requireAuth
 * @params {string} videoId - ID of the video to delete (required)
 * @note Only video owner can delete
 * @note Deletes video files from cloud storage
 * @note Removes associated data (likes, comments may be handled separately)
 * @returns {Object} Success message with deleted video ID
 * @controller deleteVideo
 */
videoRouter
	.route('/:videoId')
	.get(getVideoById)
	.patch(requireAuth, uploadImages.single('thumbnail'), autoCleanupTemp, updateVideo)
	.delete(requireAuth, deleteVideo)

/**
 * Toggle video publish/unpublish status
 * @route PATCH /api/v1/videos/toggle/publish/:videoId
 * @access Private (video owner only)
 * @middleware requireAuth
 * @params {string} videoId - ID of the video to toggle publish status (required)
 * @note Only video owner can toggle publish status
 * @returns {Object} Updated video with previous and current publish status
 * @controller togglePublishStatus
 */
videoRouter.route('/toggle/publish/:videoId').patch(requireAuth, togglePublishStatus)

export { videoRouter }
