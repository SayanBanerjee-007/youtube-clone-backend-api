import { Router } from 'express'
import { requireAuth } from '../middlewares/index.js'
import {
	addComment,
	deleteComment,
	getVideoComments,
	updateComment,
} from '../controllers/comment.controller.js'

// Initialize comment router
const commentRouter = Router()

/**
 * Comment Routes Configuration
 *
 * @description All routes handle comment-related operations with proper authentication
 * @baseRoute /api/v1/comments
 */

/**
 * Get all comments for a specific video
 * @route GET /api/v1/comments/:videoId
 * @access Public
 * @params {string} videoId - ID of the video to get comments for (required)
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of comments per page (optional)
 * @returns {Object} Paginated list of comments with user information
 * @controller getVideoComments
 */

/**
 * Add a new comment to a video
 * @route POST /api/v1/comments/:videoId
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @params {string} videoId - ID of the video to comment on (required)
 * @body {string} content - Comment text content (required, max: 500 characters)
 * @returns {Object} Created comment object with user information
 * @controller addComment
 */
commentRouter
	.route('/:videoId')
	.get(getVideoComments)
	.post(requireAuth, addComment)

/**
 * Update a specific comment
 * @route PATCH /api/v1/comments/id/:commentId
 * @access Private (comment owner only)
 * @middleware requireAuth
 * @params {string} commentId - ID of the comment to update (required)
 * @body {string} content - Updated comment text content (required, max: 500 characters)
 * @note Only comment owner can update their comment
 * @returns {Object} Updated comment object
 * @controller updateComment
 */

/**
 * Delete a specific comment
 * @route DELETE /api/v1/comments/id/:commentId
 * @access Private (comment owner only)
 * @middleware requireAuth
 * @params {string} commentId - ID of the comment to delete (required)
 * @note Only comment owner can delete their comment
 * @returns {Object} Success message with deleted comment ID
 * @controller deleteComment
 */
commentRouter
	.route('/id/:commentId')
	.patch(requireAuth, updateComment)
	.delete(requireAuth, deleteComment)
export { commentRouter }
