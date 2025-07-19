import mongoose, { isValidObjectId } from 'mongoose'
import { Subscription } from '../models/index.js'
import { asyncHandler, ApiError, ApiResponse, paginateArray } from '../utils/index.js'

/**
 * Get all channels that the current user is subscribed to
 * @route GET /api/v1/subscriptions/channels
 * @access Private
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10 } = req.query

	// Validate user authentication
	if (!req.user?._id) {
		throw new ApiError(401, 'User not authenticated.')
	}

	// Validate pagination parameters
	const pageNumber = parseInt(page)
	const limitNumber = parseInt(limit)

	if (pageNumber < 1) {
		throw new ApiError(400, 'Page number must be greater than 0.')
	}

	if (limitNumber < 1 || limitNumber > 100) {
		throw new ApiError(400, 'Limit must be between 1 and 100.')
	}

	try {
		// Find all subscribed channels and populate channel details
		const subscriptions = await Subscription.find({
			subscriber: new mongoose.Types.ObjectId(req.user._id),
		})
			.populate('channel', '_id username fullName avatar')
			.sort({ createdAt: -1 }) // Most recent subscriptions first

		// Extract channel data from subscriptions
		const channels = subscriptions.map(subscription => subscription.channel)

		// Use paginateArray utility for pagination
		const paginationInfo = paginateArray(channels, pageNumber, limitNumber, 'channels')

		res
			.status(200)
			.json(new ApiResponse(200, paginationInfo, 'Subscribed channels list fetched successfully.'))
	} catch (error) {
		throw new ApiError(500, 'Failed to fetch subscribed channels.')
	}
})

/**
 * Get the total number of subscribers for a specific channel
 * @route GET /api/v1/subscriptions/count/:channelId
 * @access Public
 */
const getSubscriberCount = asyncHandler(async (req, res) => {
	const { channelId } = req.params

	// Validate channel ID format
	if (!channelId || !isValidObjectId(channelId)) {
		throw new ApiError(400, 'Invalid or missing channel ID.')
	}

	// Count total subscribers for the channel
	const subscriberCount = await Subscription.countDocuments({
		channel: channelId,
	})

	res
		.status(200)
		.json(new ApiResponse(200, { subscriberCount }, 'Subscriber count fetched successfully.'))
})

/**
 * Toggle subscription status for a channel (subscribe/unsubscribe)
 * @route POST /api/v1/subscriptions/toggle/:channelId
 * @access Private
 */
const toggleSubscription = asyncHandler(async (req, res) => {
	const { channelId } = req.params

	// Validate user authentication
	if (!req.user?._id) {
		throw new ApiError(401, 'User not authenticated.')
	}

	// Validate channel ID format
	if (!channelId || !isValidObjectId(channelId)) {
		throw new ApiError(400, 'Invalid or missing channel ID.')
	}

	// Prevent users from subscribing to their own channel
	if (req.user._id.toString() === channelId) {
		throw new ApiError(400, 'You cannot subscribe to your own channel.')
	}

	try {
		// Check if subscription already exists
		const existingSubscription = await Subscription.findOne({
			channel: channelId,
			subscriber: req.user._id,
		})

		if (existingSubscription) {
			// Unsubscribe: Remove existing subscription
			await Subscription.findByIdAndDelete(existingSubscription._id)
			res
				.status(200)
				.json(new ApiResponse(200, { isSubscribed: false }, 'Unsubscribed successfully.'))
		} else {
			// Subscribe: Create new subscription
			await Subscription.create({
				channel: channelId,
				subscriber: req.user._id,
			})
			res.status(201).json(new ApiResponse(201, { isSubscribed: true }, 'Subscribed successfully.'))
		}
	} catch (error) {
		// Handle potential database errors
		if (error.code === 11000) {
			throw new ApiError(409, 'Subscription already exists.')
		}
		throw new ApiError(500, 'Failed to toggle subscription.')
	}
})

/**
 * Get all subscribers for a specific channel (only accessible by channel owner)
 * @route GET /api/v1/subscriptions/subscribers/:channelId
 * @access Private (Channel Owner Only)
 */
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
	const { channelId } = req.params
	const { page = 1, limit = 10 } = req.query

	// Validate user authentication
	if (!req.user?._id) {
		throw new ApiError(401, 'User not authenticated.')
	}

	// Validate channel ID format
	if (!channelId || !isValidObjectId(channelId)) {
		throw new ApiError(400, 'Invalid or missing channel ID.')
	}

	// Authorization check: Only channel owner can view subscribers
	if (req.user._id.toString() !== channelId) {
		throw new ApiError(403, 'You are not authorized to view this resource.')
	}

	// Validate pagination parameters
	const pageNumber = parseInt(page)
	const limitNumber = parseInt(limit)

	if (pageNumber < 1) {
		throw new ApiError(400, 'Page number must be greater than 0.')
	}

	if (limitNumber < 1 || limitNumber > 100) {
		throw new ApiError(400, 'Limit must be between 1 and 100.')
	}

	try {
		// Find all subscribers and populate subscriber details
		const subscriptions = await Subscription.find({
			channel: channelId,
		})
			.populate('subscriber', '_id username fullName avatar')
			.sort({ createdAt: -1 }) // Most recent subscribers first

		// Extract subscriber data from subscriptions
		const subscribers = subscriptions.map(subscription => subscription.subscriber)

		// Use paginateArray utility for pagination
		const paginationInfo = paginateArray(subscribers, pageNumber, limitNumber, 'subscribers')

		res
			.status(200)
			.json(new ApiResponse(200, paginationInfo, 'Subscribers list fetched successfully.'))
	} catch (error) {
		throw new ApiError(500, 'Failed to fetch subscribers list.')
	}
})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels, getSubscriberCount }
