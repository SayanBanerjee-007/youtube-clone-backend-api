import mongoose from 'mongoose'
import { Video, Subscription, Like } from '../models/index.js'
import { asyncHandler, ApiError, ApiResponse } from '../utils/index.js'

/**
 * Get channel statistics including total views, subscribers, videos, and likes
 * @route GET /api/v1/dashboard/stats
 * @access Private
 */
const getChannelStats = asyncHandler(async (req, res) => {
	// Validate user authentication
	if (!req.user?._id) {
		throw new ApiError(401, 'User not authenticated')
	}

	const owner = req.user._id

	// Validate ObjectId format
	if (!mongoose.Types.ObjectId.isValid(owner)) {
		throw new ApiError(400, 'Invalid user ID format')
	}

	try {
		// Get all videos for the channel to calculate total views
		const videos = await Video.find({ owner }).select('views')

		// Calculate total video views with null/undefined safety
		const totalVideoViews = videos.reduce((total, video) => total + (video.views || 0), 0)

		// Get total number of subscribers for the channel
		const totalSubscribers = await Subscription.countDocuments({
			channel: owner,
		})

		// Get total number of videos uploaded by the channel
		const totalVideos = await Video.countDocuments({ owner })

		// Get all video IDs for like count calculation
		const videoIds = videos.map(video => video._id)

		// Count total likes across all videos of the channel
		const totalLikes =
			videoIds.length > 0
				? await Like.countDocuments({
						video: { $in: videoIds },
				  })
				: 0

		// Prepare response data
		const channelStats = {
			totalVideoViews,
			totalSubscribers,
			totalVideos,
			totalLikes,
		}

		// Return successful response
		res.status(200).json(new ApiResponse(200, channelStats, 'Channel statistics fetched successfully'))
	} catch (error) {
		// Handle database errors
		if (error instanceof ApiError) {
			throw error
		}
		throw new ApiError(500, 'Failed to fetch channel statistics')
	}
})

/**
 * Get all ONLY PUBLISHED videos uploaded by the channel with details
 * @route GET /api/v1/dashboard/videos
 * @access Private
 */
const getChannelVideos = asyncHandler(async (req, res) => {
	// Validate user authentication
	if (!req.user?._id) {
		throw new ApiError(401, 'User not authenticated')
	}

	const owner = req.user._id

	// Validate ObjectId format
	if (!mongoose.Types.ObjectId.isValid(owner)) {
		throw new ApiError(400, 'Invalid user ID format')
	}

	try {
		// Fetch all videos belonging to the channel with populated owner details
		const videos = await Video.find({ owner, isPublished: true })
			.populate('owner', 'username avatar fullName') // Added fullName for better user info
			.sort({ createdAt: -1 }) // Sort by newest first
			.lean() // Use lean() for better performance when no document modification needed

		// Check if any videos exist
		if (!videos || videos.length === 0) {
			return res.status(200).json(new ApiResponse(200, [], 'No videos found for this channel'))
		}

		// Return successful response with videos
		res.status(200).json(new ApiResponse(200, videos, `${videos.length} video(s) fetched successfully`))
	} catch (error) {
		// Handle database errors
		if (error instanceof ApiError) {
			throw error
		}
		throw new ApiError(500, 'Failed to fetch channel videos')
	}
})

export { getChannelStats, getChannelVideos }
