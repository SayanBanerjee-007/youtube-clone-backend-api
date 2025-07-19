import { Router } from 'express'
import { requireAuth } from '../middlewares/index.js'
import {
	getSubscribedChannels,
	getSubscriberCount,
	getUserChannelSubscribers,
	toggleSubscription,
} from '../controllers/subscription.controller.js'

// Initialize subscription router
const subscriptionRouter = Router()

/**
 * Subscription Routes Configuration
 *
 * @description All routes handle channel subscription operations
 * @baseRoute /api/v1/subscriptions
 */

/**
 * Get all channels that the authenticated user is subscribed to
 * @route GET /api/v1/subscriptions
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of channels per page (optional, default: 10, max: 100)
 * @returns {Object} Paginated list of subscribed channels with pagination metadata
 * @controller getSubscribedChannels
 */
subscriptionRouter.route('/').get(requireAuth, getSubscribedChannels)

/**
 * Get the total number of subscribers for a specific channel
 * @route GET /api/v1/subscriptions/channel/:channelId
 * @access Public
 * @params {string} channelId - The unique identifier of the channel (required)
 * @returns {Object} Channel subscriber count and subscription status
 * @controller getSubscriberCount
 */

/**
 * Toggle subscription status for a channel (subscribe/unsubscribe)
 * @route POST /api/v1/subscriptions/channel/:channelId
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @params {string} channelId - The unique identifier of the channel to toggle subscription (required)
 * @note Users cannot subscribe to their own channel
 * @returns {Object} Updated subscription status
 * @controller toggleSubscription
 */
subscriptionRouter
	.route('/channel/:channelId')
	.get(getSubscriberCount)
	.post(requireAuth, toggleSubscription)

/**
 * Get all subscribers for a specific channel
 * @route GET /api/v1/subscriptions/subscribers/:channelId
 * @access Private (Channel Owner Only)
 * @middleware requireAuth
 * @params {string} channelId - The unique identifier of the channel whose subscribers to fetch (required)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of subscribers per page (optional, default: 10, max: 100)
 * @note Only the channel owner can access their subscriber list
 * @returns {Object} Paginated list of channel subscribers with pagination metadata
 * @controller getUserChannelSubscribers
 */
subscriptionRouter.route('/subscribers/:channelId').get(requireAuth, getUserChannelSubscribers)

export { subscriptionRouter }
