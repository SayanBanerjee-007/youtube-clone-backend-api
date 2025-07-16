import { isValidObjectId } from 'mongoose'
import { Video, Comment, Tweet, Like } from '../models/index.js'
import { asyncHandler, ApiError, ApiResponse, paginateArray } from '../utils/index.js'

/**
 * Toggle like/dislike on a video
 * @desc If user already liked the video, it removes the like (dislike)
 * @desc If user hasn't liked the video, it adds a like
 * @route POST /api/v1/likes/toggle/v/:videoId
 * @access Private
 */
const toggleVideoLike = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	// Validate video ID format
	if (!videoId || !isValidObjectId(videoId)) {
		throw new ApiError(400, 'Invalid or missing video ID.')
	}

	// Check if video exists and is published
	const video = await Video.findById(videoId)
	if (!video) {
		throw new ApiError(404, 'Video not found.')
	}

	if (video.isPublished === false) {
		throw new ApiError(403, 'Cannot like an unpublished video.')
	}

	const likedBy = req.user._id

	// Check if user has already liked this video
	const existingLike = await Like.findOne({ likedBy, video: videoId })

	if (existingLike) {
		// Remove like (dislike action)
		await Like.deleteOne({ _id: existingLike._id })
		return res.status(200).json(new ApiResponse(200, null, 'Video disliked successfully.'))
	}

	// Add like
	const newLike = await Like.create({ likedBy, video: videoId })
	if (!newLike) {
		throw new ApiError(500, 'Failed to like video. Please try again.')
	}

	res.status(201).json(new ApiResponse(201, null, 'Video liked successfully.'))
})

/**
 * Toggle like/dislike on a comment
 * @desc If user already liked the comment, it removes the like (dislike)
 * @desc If user hasn't liked the comment, it adds a like
 * @route POST /api/v1/likes/toggle/c/:commentId
 * @access Private
 */
const toggleCommentLike = asyncHandler(async (req, res) => {
	const { commentId } = req.params

	// Validate comment ID format
	if (!commentId || !isValidObjectId(commentId)) {
		throw new ApiError(400, 'Invalid or missing comment ID.')
	}

	// Check if comment exists
	const comment = await Comment.findById(commentId)
	if (!comment) {
		throw new ApiError(404, 'Comment not found.')
	}

	const likedBy = req.user._id

	// Check if user has already liked this comment
	const existingLike = await Like.findOne({ likedBy, comment: commentId })

	if (existingLike) {
		// Remove like (dislike action)
		await Like.deleteOne({ _id: existingLike._id })
		return res.status(200).json(new ApiResponse(200, null, 'Comment disliked successfully.'))
	}

	// Add like
	const newLike = await Like.create({ likedBy, comment: commentId })
	if (!newLike) {
		throw new ApiError(500, 'Failed to like comment. Please try again.')
	}

	res.status(201).json(new ApiResponse(201, null, 'Comment liked successfully.'))
})

/**
 * Toggle like/dislike on a tweet
 * @desc If user already liked the tweet, it removes the like (dislike)
 * @desc If user hasn't liked the tweet, it adds a like
 * @route POST /api/v1/likes/toggle/t/:tweetId
 * @access Private
 */
const toggleTweetLike = asyncHandler(async (req, res) => {
	const { tweetId } = req.params

	// Validate tweet ID format
	if (!tweetId || !isValidObjectId(tweetId)) {
		throw new ApiError(400, 'Invalid or missing tweet ID.')
	}

	// Check if tweet exists
	const tweet = await Tweet.findById(tweetId)
	if (!tweet) {
		throw new ApiError(404, 'Tweet not found.')
	}

	const likedBy = req.user._id

	// Check if user has already liked this tweet
	const existingLike = await Like.findOne({ likedBy, tweet: tweetId })

	if (existingLike) {
		// Remove like (dislike action)
		await Like.deleteOne({ _id: existingLike._id })
		return res.status(200).json(new ApiResponse(200, null, 'Tweet disliked successfully.'))
	}

	// Add like
	const newLike = await Like.create({ likedBy, tweet: tweetId })
	if (!newLike) {
		throw new ApiError(500, 'Failed to like tweet. Please try again.')
	}

	res.status(201).json(new ApiResponse(201, null, 'Tweet liked successfully.'))
})

/**
 * Get all videos liked by the authenticated user
 * @desc Fetches paginated list of videos that the user has liked
 * @route GET /api/v1/likes/videos
 * @access Private
 */
const getLikedVideos = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10 } = req.query
	const likedBy = req.user._id

	// Validate pagination parameters
	const pageNum = parseInt(page)
	const limitNum = parseInt(limit)

	if (pageNum < 1 || limitNum < 1) {
		throw new ApiError(400, 'Page and limit must be positive numbers.')
	}

	if (limitNum > 50) {
		throw new ApiError(400, 'Limit cannot exceed 50 items per page.')
	}

	// Find all video likes by the user and populate video data
	const likes = await Like.find({
		likedBy,
		video: { $exists: true },
	})
		.populate({
			path: 'video',
			select: 'title description thumbnail duration views createdAt owner',
			populate: {
				path: 'owner',
				select: 'username fullName avatar',
			},
		})
		.sort({ createdAt: -1 })

	// Filter out likes where video might have been deleted
	const validLikes = likes.filter(like => like.video !== null)

	// Extract video data from likes
	const videos = validLikes.map(like => like.video)

	// Apply pagination
	const paginatedVideos = paginateArray(videos, pageNum, limitNum)

	// Check if any videos were found
	if (!paginatedVideos.data || paginatedVideos.data.length === 0) {
		return res.status(200).json(
			new ApiResponse(
				200,
				{
					data: [],
					pagination: {
						page: pageNum,
						limit: limitNum,
						total: 0,
						pages: 0,
					},
				},
				'No liked videos found.'
			)
		)
	}

	return res
		.status(200)
		.json(new ApiResponse(200, paginatedVideos, 'Liked videos fetched successfully.'))
})

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos }
