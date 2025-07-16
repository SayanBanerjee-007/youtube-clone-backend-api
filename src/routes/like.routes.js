import { Router } from 'express'
import { requireAuth } from '../middlewares/index.js'
import {
	getLikedVideos,
	toggleCommentLike,
	toggleVideoLike,
	toggleTweetLike,
} from '../controllers/like.controller.js'

// Initialize like router
const likeRouter = Router()

/**
 * Like Routes Configuration
 *
 * @description All routes require authentication and handle like/unlike operations
 * @baseRoute /api/v1/likes
 * @middleware requireAuth - Applied to all routes
 */

// Apply authentication middleware to all like routes
likeRouter.use(requireAuth)

/**
 * Toggle like/unlike on a video
 * @route POST /api/v1/likes/toggle/video/:videoId
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @params {string} videoId - ID of the video to like/unlike (required)
 * @returns {Object} Updated like status and count
 * @controller toggleVideoLike
 */
likeRouter.route('/toggle/video/:videoId').post(toggleVideoLike)

/**
 * Toggle like/unlike on a comment
 * @route POST /api/v1/likes/toggle/comment/:commentId
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @params {string} commentId - ID of the comment to like/unlike (required)
 * @returns {Object} Updated like status and count
 * @controller toggleCommentLike
 */
likeRouter.route('/toggle/comment/:commentId').post(toggleCommentLike)

/**
 * Toggle like/unlike on a tweet
 * @route POST /api/v1/likes/toggle/tweet/:tweetId
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @params {string} tweetId - ID of the tweet to like/unlike (required)
 * @returns {Object} Updated like status and count
 * @controller toggleTweetLike
 */
likeRouter.route('/toggle/tweet/:tweetId').post(toggleTweetLike)

/**
 * Get all videos liked by the current user
 * @route GET /api/v1/likes/videos
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of videos per page (optional)
 * @returns {Object} Paginated list of videos liked by authenticated user
 * @controller getLikedVideos
 */
likeRouter.route('/videos').get(getLikedVideos)

export { likeRouter }
