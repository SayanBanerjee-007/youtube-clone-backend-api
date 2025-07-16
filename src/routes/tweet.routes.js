import { Router } from 'express'
import { requireAuth } from '../middlewares/index.js'
import {
	createTweet,
	deleteTweet,
	getUserTweets,
	updateTweet,
} from '../controllers/tweet.controller.js'

// Initialize tweet router
const tweetRouter = Router()

/**
 * Tweet Routes Configuration
 *
 * @description All routes handle tweet-related operations with proper authentication
 * @baseRoute /api/v1/tweets
 */

/**
 * Create a new tweet
 * @route POST /api/v1/tweets
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @body {string} content - Tweet text content (required, max: 280 characters)
 * @returns {Object} Created tweet object with user information
 * @controller createTweet
 */
tweetRouter.route('/').post(requireAuth, createTweet)

/**
 * Get all tweets for a specific user
 * @route GET /api/v1/tweets/user/:userId
 * @access Public
 * @params {string} userId - ID of the user whose tweets to fetch (required)
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of tweets per page (optional)
 * @returns {Object} Paginated list of tweets by the user
 * @controller getUserTweets
 */
tweetRouter.route('/user/:userId').get(getUserTweets)

/**
 * Update a specific tweet
 * @route PATCH /api/v1/tweets/:tweetId
 * @access Private (tweet owner only)
 * @middleware requireAuth
 * @params {string} tweetId - ID of the tweet to update (required)
 * @body {string} content - Updated tweet text content (required, max: 280 characters)
 * @note Only tweet owner can update their tweet
 * @returns {Object} Updated tweet object
 * @controller updateTweet
 */

/**
 * Delete a specific tweet
 * @route DELETE /api/v1/tweets/:tweetId
 * @access Private (tweet owner only)
 * @middleware requireAuth
 * @params {string} tweetId - ID of the tweet to delete (required)
 * @note Only tweet owner can delete their tweet
 * @returns {Object} Success message with deleted tweet ID
 * @controller deleteTweet
 */
tweetRouter.route('/:tweetId').patch(requireAuth, updateTweet).delete(requireAuth, deleteTweet)
export { tweetRouter }
