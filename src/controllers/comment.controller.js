import mongoose from 'mongoose'
import { Video, Comment, Like } from '../models/index.js'
import { asyncHandler, ApiError, ApiResponse, paginateArray } from '../utils/index.js'

/**
 * Get paginated comments for a specific video with user details and like counts
 * @route GET /api/v1/comments/:videoId
 * @access Public
 */
const getVideoComments = asyncHandler(async (req, res) => {
	const { videoId } = req.params
	const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc' } = req.query

	// Validate video ID format
	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, 'Invalid video id format.')
	}

	// Validate pagination parameters
	const pageNum = parseInt(page)
	const limitNum = parseInt(limit)

	if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
		throw new ApiError(
			400,
			'Invalid pagination parameters. Page must be >= 1 and limit must be between 1-100.'
		)
	}

	// Validate sort parameters
	const allowedSortFields = ['createdAt', 'updatedAt', 'likeCount']
	const allowedSortTypes = ['asc', 'desc']

	if (!allowedSortFields.includes(sortBy)) {
		throw new ApiError(400, `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`)
	}

	if (!allowedSortTypes.includes(sortType)) {
		throw new ApiError(400, `Invalid sort type. Allowed types: ${allowedSortTypes.join(', ')}`)
	}

	// Verify video exists
	const videoExists = await Video.findById(videoId).select('_id')
	if (!videoExists) {
		throw new ApiError(404, 'Video not found.')
	}

	// Aggregate pipeline to fetch comments with user details and like counts
	const comments = await Comment.aggregate([
		{
			// Match comments for the specific video
			$match: {
				video: new mongoose.Types.ObjectId(videoId),
			},
		},
		{
			// Lookup user details for comment owner
			$lookup: {
				from: 'users',
				localField: 'owner',
				foreignField: '_id',
				as: 'owner',
				pipeline: [
					{
						$project: {
							_id: 1,
							username: 1,
							fullName: 1,
							avatar: 1,
						},
					},
				],
			},
		},
		{
			// Convert owner array to object
			$unwind: '$owner',
		},
		{
			// Lookup like count for each comment
			$lookup: {
				from: 'likes',
				localField: '_id',
				foreignField: 'comment',
				as: 'likeCount',
				pipeline: [
					{
						$count: 'count',
					},
				],
			},
		},
		{
			// Add likeCount field with default value 0
			$addFields: {
				likeCount: {
					$ifNull: [{ $arrayElemAt: ['$likeCount.count', 0] }, 0],
				},
			},
		},
		{
			// Sort comments based on provided parameters
			$sort: {
				[sortBy]: sortType === 'asc' ? 1 : -1,
			},
		},
	])

	// Apply pagination to the results
	const paginatedComments = paginateArray(comments, pageNum, limitNum)

	return res
		.status(200)
		.json(new ApiResponse(200, paginatedComments, 'Comments fetched successfully.'))
})

/**
 * Add a new comment to a video
 * @route POST /api/v1/comments/:videoId
 * @access Private
 */
const addComment = asyncHandler(async (req, res) => {
	const { videoId } = req.params
	const { content } = req.body
	const userId = req.user._id

	// Validate video ID format
	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, 'Invalid video id format.')
	}

	// Validate and sanitize content
	if (!content || typeof content !== 'string') {
		throw new ApiError(400, 'Content is required and must be a string.')
	}

	const trimmedContent = content.trim()

	if (!trimmedContent) {
		throw new ApiError(400, 'Content cannot be empty.')
	}

	if (trimmedContent.length > 1000) {
		throw new ApiError(400, 'Comment content cannot exceed 1000 characters.')
	}

	// Verify video exists and is not deleted
	const video = await Video.findById(videoId).select('_id isPublished')
	if (!video) {
		throw new ApiError(404, 'Video not found.')
	}

	if (!video.isPublished) {
		throw new ApiError(403, 'Cannot comment on unpublished video.')
	}

	// Check if user has already commented (if business logic requires unique comments per user)
	const alreadyCommented = await Comment.findOne({
		owner: userId,
		video: videoId,
	})

	if (alreadyCommented) {
		throw new ApiError(400, 'You have already commented on this video.')
	}

	// Create new comment
	const comment = await Comment.create({
		content: trimmedContent,
		owner: userId,
		video: videoId,
	})

	// Populate owner details for response
	await comment.populate('owner', 'username fullName avatar')

	return res.status(201).json(new ApiResponse(201, comment, 'Comment added successfully.'))
})

/**
 * Update an existing comment
 * @route PATCH /api/v1/comments/:commentId
 * @access Private
 */
const updateComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params
	const { content } = req.body
	const userId = req.user._id

	// Validate comment ID format
	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new ApiError(400, 'Invalid comment id format.')
	}

	// Validate and sanitize content
	if (!content || typeof content !== 'string') {
		throw new ApiError(400, 'Content is required and must be a string.')
	}

	const trimmedContent = content.trim()

	if (!trimmedContent) {
		throw new ApiError(400, 'Content cannot be empty.')
	}

	if (trimmedContent.length > 1000) {
		throw new ApiError(400, 'Comment content cannot exceed 1000 characters.')
	}

	// Find comment and verify ownership
	const comment = await Comment.findById(commentId)
	if (!comment) {
		throw new ApiError(404, 'Comment not found.')
	}

	// Check authorization - only comment owner can update
	if (comment.owner.toString() !== userId.toString()) {
		throw new ApiError(403, 'You are not authorized to update this comment.')
	}

	// Update comment content
	comment.content = trimmedContent
	await comment.save({ validateBeforeSave: false })

	// Populate owner details for response
	await comment.populate('owner', 'username fullName avatar')

	return res.status(200).json(new ApiResponse(200, comment, 'Comment updated successfully.'))
})

/**
 * Delete a comment
 * @route DELETE /api/v1/comments/:commentId
 * @access Private
 */
const deleteComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params
	const userId = req.user._id

	// Validate comment ID format
	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new ApiError(400, 'Invalid comment id format.')
	}

	// Find comment with video details
	const comment = await Comment.findById(commentId).populate('video', 'owner')
	if (!comment) {
		throw new ApiError(404, 'Comment not found.')
	}

	// Verify video still exists
	if (!comment.video) {
		console.warn(`Orphaned comment found: ${comment._id}`)
		if (comment.owner.toString() !== userId.toString()) {
			throw new ApiError(403, 'You are not authorized to delete this comment.')
		}
		await Comment.findByIdAndDelete(comment._id)
		return res
			.status(200)
			.json(new ApiResponse(200, null, 'Associated video not found. Comment has been removed.'))
	}

	const videoOwnerId = comment.video.owner
	const commentOwnerId = comment.owner

	// Check authorization - comment owner or video owner can delete
	const isCommentOwner = commentOwnerId.toString() === userId.toString()
	const isVideoOwner = videoOwnerId.toString() === userId.toString()

	if (!isCommentOwner && !isVideoOwner) {
		throw new ApiError(
			403,
			'You are not authorized to delete this comment. Only the comment author or video owner can delete comments.'
		)
	}

	// Delete the comment
	await Comment.deleteOne({ _id: commentId })
	await Like.deleteMany({ comment: commentId })

	return res.status(200).json(new ApiResponse(200, null, 'Comment deleted successfully.'))
})

export { getVideoComments, addComment, updateComment, deleteComment }
