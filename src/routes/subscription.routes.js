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
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of channels per page (optional)
 * @returns {Object} Paginated list of subscribed channels
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
 * Get all subscribers for a specific user's channel
 * @route GET /api/v1/subscriptions/user/:subscriberId
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @params {string} subscriberId - The unique identifier of the user whose subscribers to fetch (required)
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of subscribers per page (optional)
 * @note Typically only the channel owner should access this
 * @returns {Object} Paginated list of channel subscribers
 * @controller getUserChannelSubscribers
 */
subscriptionRouter.route('/user/:subscriberId').get(requireAuth, getUserChannelSubscribers)

export { subscriptionRouter }
