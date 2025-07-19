import { Like, Tweet, User } from '../models/index.js'
import mongoose, { isValidObjectId } from 'mongoose'
import { asyncHandler, ApiError, ApiResponse, paginateArray } from '../utils/index.js'

/**
 * Create a new tweet
 * @desc Creates a new tweet with the provided content for the authenticated user
 * @route POST /api/v1/tweets
 * @access Private
 */
const createTweet = asyncHandler(async (req, res) => {
	const { content } = req.body

	// Validate content presence and length
	if (!content?.trim()) {
		throw new ApiError(400, 'Content is required.')
	}

	const trimmedContent = content.trim()

	// Check content length (assuming max 280 characters like Twitter)
	if (trimmedContent.length > 280) {
		throw new ApiError(400, 'Content cannot exceed 280 characters.')
	}

	// Ensure user is authenticated
	if (!req.user?._id) {
		throw new ApiError(401, 'User not authenticated.')
	}

	try {
		// Create the tweet
		const tweet = await Tweet.create({
			content: trimmedContent,
			owner: req.user._id,
		})

		// Return success response
		res.status(201).json(new ApiResponse(201, tweet, 'Tweet created successfully.'))
	} catch (error) {
		throw new ApiError(500, 'Failed to create tweet. Please try again.')
	}
})

/**
 * Get all tweets for a specific user
 * @desc Fetches paginated tweets for a user with like counts
 * @route GET /api/v1/tweets/user/:userId
 * @access Public
 */
const getUserTweets = asyncHandler(async (req, res) => {
	const { userId } = req.params
	const { page = 1, limit = 10 } = req.query

	// Validate user ID format
	if (!isValidObjectId(userId)) {
		throw new ApiError(400, 'Invalid user ID format.')
	}

	// Validate pagination parameters
	const pageNum = parseInt(page)
	const limitNum = parseInt(limit)

	if (pageNum < 1 || limitNum < 1) {
		throw new ApiError(400, 'Page and limit must be positive numbers.')
	}

	if (limitNum > 100) {
		throw new ApiError(400, 'Limit cannot exceed 100 items per page.')
	}

	try {
		// Check if user exists
		const userExists = await User.findById(userId)
		if (!userExists) {
			throw new ApiError(404, 'User not found.')
		}

		// Aggregate tweets with like counts
		const tweets = await Tweet.aggregate([
			{
				// Match tweets by user ID
				$match: { owner: new mongoose.Types.ObjectId(userId) },
			},
			{
				// Lookup likes for each tweet
				$lookup: {
					from: 'likes',
					localField: '_id',
					foreignField: 'tweet',
					as: 'likes',
				},
			},
			{
				// Add computed fields
				$addFields: {
					totalLikes: { $size: '$likes' },
					isLiked: false, // This would need current user context to determine
				},
			},
			{
				// Project only necessary fields
				$project: {
					content: 1,
					totalLikes: 1,
					createdAt: 1,
					updatedAt: 1,
					owner: 1,
				},
			},
			{
				// Sort by creation date (newest first)
				$sort: { createdAt: -1 },
			},
		])

		// Apply pagination
		const paginatedTweets = paginateArray(tweets, pageNum, limitNum, 'tweets')

		res.status(200).json(new ApiResponse(200, paginatedTweets, 'Tweets fetched successfully.'))
	} catch (error) {
		// Handle specific errors or throw generic error
		if (error instanceof ApiError) {
			throw error
		}
		throw new ApiError(500, 'Failed to fetch tweets. Please try again.')
	}
})

/**
 * Update an existing tweet
 * @desc Updates tweet content for the authenticated user (only owner can update)
 * @route PATCH /api/v1/tweets/:tweetId
 * @access Private
 */
const updateTweet = asyncHandler(async (req, res) => {
	const { tweetId } = req.params
	const { content } = req.body

	// Validate tweet ID format
	if (!isValidObjectId(tweetId)) {
		throw new ApiError(400, 'Invalid tweet ID format.')
	}

	// Validate content
	if (!content?.trim()) {
		throw new ApiError(400, 'Content is required.')
	}

	const trimmedContent = content.trim()

	// Check content length
	if (trimmedContent.length > 280) {
		throw new ApiError(400, 'Content cannot exceed 280 characters.')
	}

	// Ensure user is authenticated
	if (!req.user?._id) {
		throw new ApiError(401, 'User not authenticated.')
	}

	try {
		// Update tweet (only if user is the owner)
		const tweet = await Tweet.findOneAndUpdate(
			{
				_id: tweetId,
				owner: req.user._id, // Ensures only owner can update
			},
			{
				$set: {
					content: trimmedContent,
					updatedAt: new Date(),
				},
			},
			{
				new: true, // Return updated document
				runValidators: true, // Run model validations
			}
		)

		if (!tweet) {
			throw new ApiError(404, 'Tweet not found or you are not authorized to update this tweet.')
		}

		res.status(200).json(new ApiResponse(200, tweet, 'Tweet updated successfully.'))
	} catch (error) {
		if (error instanceof ApiError) {
			throw error
		}
		throw new ApiError(500, 'Failed to update tweet. Please try again.')
	}
})

/**
 * Delete a tweet
 * @desc Deletes a tweet (only owner can delete)
 * @route DELETE /api/v1/tweets/:tweetId
 * @access Private
 */
const deleteTweet = asyncHandler(async (req, res) => {
	const { tweetId } = req.params
	const userId = req.user._id

	// Validate tweet ID format
	if (!isValidObjectId(tweetId)) {
		throw new ApiError(400, 'Invalid tweet ID format.')
	}

	// Find tweet
	const tweet = await Tweet.findById(tweetId)
	if (!tweet) {
		throw new ApiError(404, 'Tweet not found.')
	}

	const tweetOwnerId = tweet.owner

	// Check authorization - only tweet owner can delete
	const isTweetOwner = tweetOwnerId.toString() === userId.toString()

	if (!isTweetOwner) {
		throw new ApiError(
			403,
			'You are not authorized to delete this tweet. Only the tweet author can delete tweets.'
		)
	}

	// Delete the tweet
	await Tweet.deleteOne({ _id: tweetId })
	await Like.deleteMany({ tweet: tweetId })

	return res.status(200).json(new ApiResponse(200, null, 'Tweet deleted successfully.'))
})

export { createTweet, getUserTweets, updateTweet, deleteTweet }
