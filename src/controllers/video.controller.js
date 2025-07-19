import mongoose, { isValidObjectId } from 'mongoose'
import { Video, Like, Comment } from '../models/index.js'
import {
	asyncHandler,
	ApiError,
	ApiResponse,
	uploadOnCloudinary,
	deleteImageFromCloudinary,
	deleteVideoFromCloudinary,
	paginateArray,
} from '../utils/index.js'

/**
 * Get all published videos with pagination, sorting, and filtering
 * @route GET /api/v1/videos
 * @access Public
 */
// TODO : GET all isPublished : false videos if user is the owner
const getAllVideos = asyncHandler(async (req, res) => {
	const {
		page = 1,
		limit = 10,
		keyword,
		sortBy = 'createdAt',
		sortType = 'desc',
		userId,
	} = req.query

	// Validate sortBy field against allowed values
	const validSortByFields = ['createdAt', 'views', 'likesCount']
	if (!validSortByFields.includes(sortBy)) {
		throw new ApiError(
			400,
			`Invalid sortBy field. Valid fields are: ${validSortByFields.join(', ')}`
		)
	}

	// Validate sortType to ensure proper ordering
	if (!['asc', 'desc'].includes(sortType)) {
		throw new ApiError(400, 'sortType must be either "asc" or "desc".')
	}

	// Parse and validate pagination parameters
	const pageNum = parseInt(page)
	const limitNum = parseInt(limit)

	if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
		throw new ApiError(400, 'Page and limit must be positive integers.')
	}

	// Prevent excessive data retrieval
	if (limitNum > 100) {
		throw new ApiError(400, 'Limit cannot exceed 100 videos per request.')
	}

	// Validate userId if filtering by specific user
	if (userId && !isValidObjectId(userId)) {
		throw new ApiError(400, 'Invalid userId format.')
	}

	// Validate search keyword
	if (keyword && (typeof keyword !== 'string' || keyword.trim().length === 0)) {
		throw new ApiError(400, 'Keyword must be a non-empty string.')
	}

	// Build match conditions for aggregation pipeline
	const matchConditions = {
		isPublished: true, // Only fetch published videos for public access
	}

	// Add user filter if specified
	if (userId) {
		matchConditions.owner = new mongoose.Types.ObjectId(userId)
	}

	// Add search functionality for title and description
	if (keyword) {
		matchConditions.$or = [
			{ title: { $regex: keyword.trim(), $options: 'i' } },
			{ description: { $regex: keyword.trim(), $options: 'i' } },
		]
	}

	try {
		// Aggregate videos with owner information and sorting
		const videos = await Video.aggregate([
			{ $match: matchConditions },
			{
				// Join with users collection to get owner details
				$lookup: {
					from: 'users',
					localField: 'owner',
					foreignField: '_id',
					as: 'owner',
					pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } }],
				},
			},
			{ $unwind: '$owner' }, // Convert owner array to object
			{ $sort: { [sortBy]: sortType === 'desc' ? -1 : 1 } },
		])

		// Apply pagination to the results
		const paginatedVideos = paginateArray(videos, pageNum, limitNum, 'videos')

		res.status(200).json(new ApiResponse(200, paginatedVideos, 'Videos fetched successfully.'))
	} catch (error) {
		throw new ApiError(500, 'Failed to fetch videos. Please try again.')
	}
})

/**
 * Upload and publish a new video
 * @route POST /api/v1/videos
 * @access Private (requires authentication)
 */
const publishAVideo = asyncHandler(async (req, res) => {
	const { title, description } = req.body

	// Validate required text fields
	if (!title?.trim()) {
		throw new ApiError(400, 'Video title is required and cannot be empty.')
	}

	if (!description?.trim()) {
		throw new ApiError(400, 'Video description is required and cannot be empty.')
	}

	// Validate title and description length
	if (title.trim().length > 100) {
		throw new ApiError(400, 'Video title cannot exceed 100 characters.')
	}

	if (description.trim().length > 1000) {
		throw new ApiError(400, 'Video description cannot exceed 1000 characters.')
	}

	// Validate file uploads structure
	if (!req.files || typeof req.files !== 'object') {
		throw new ApiError(400, 'Video file and thumbnail are required.')
	}

	if (!Array.isArray(req.files.videoFile) || !Array.isArray(req.files.thumbnail)) {
		throw new ApiError(400, 'Video file and thumbnail must be provided.')
	}

	if (req.files.videoFile.length === 0 || req.files.thumbnail.length === 0) {
		throw new ApiError(400, 'Both video file and thumbnail are required.')
	}

	const videoLocalPath = req.files.videoFile[0]?.path
	const thumbnailLocalPath = req.files.thumbnail[0]?.path

	if (!videoLocalPath || !thumbnailLocalPath) {
		throw new ApiError(400, 'Video file and thumbnail paths are invalid.')
	}

	// Validate video file type
	if (req.files.videoFile[0].mimetype !== 'video/mp4') {
		throw new ApiError(400, 'Video must be in MP4 format.')
	}

	// Validate video file size (e.g., max 100MB)
	if (req.files.videoFile[0].size > 100 * 1024 * 1024) {
		throw new ApiError(400, 'Video file size cannot exceed 100MB.')
	}

	// Validate thumbnail file type
	const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg']
	if (!validImageTypes.includes(req.files.thumbnail[0].mimetype)) {
		throw new ApiError(400, 'Thumbnail must be a JPEG, JPG, or PNG image.')
	}

	// Validate thumbnail file size (e.g., max 5MB)
	if (req.files.thumbnail[0].size > 5 * 1024 * 1024) {
		throw new ApiError(400, 'Thumbnail size cannot exceed 5MB.')
	}

	let videoFile, thumbnail

	try {
		// Upload files to cloudinary concurrently for better performance
		;[videoFile, thumbnail] = await Promise.all([
			uploadOnCloudinary(videoLocalPath),
			uploadOnCloudinary(thumbnailLocalPath),
		])
	} catch (error) {
		throw new ApiError(500, 'Failed to upload files to cloud storage.')
	}

	// Verify uploads were successful
	if (!videoFile?.url || !thumbnail?.url) {
		// Cleanup any partially uploaded files
		await Promise.allSettled([
			videoFile?.url && deleteVideoFromCloudinary(videoFile.url),
			thumbnail?.url && deleteImageFromCloudinary(thumbnail.url),
		])
		throw new ApiError(500, 'File upload failed. Please try again.')
	}

	let video
	try {
		// Create video document in database
		video = await Video.create({
			videoFile: videoFile.url,
			thumbnail: thumbnail.url,
			owner: req.user._id,
			title: title.trim(),
			description: description.trim(),
			duration: videoFile.duration || 0,
			isPublished: false, // Videos start as unpublished
		})
	} catch (error) {
		// Cleanup uploaded files if database operation fails
		await Promise.allSettled([
			deleteVideoFromCloudinary(videoFile.url),
			deleteImageFromCloudinary(thumbnail.url),
		])
		throw new ApiError(500, 'Failed to save video information. Please try again.')
	}

	// Fetch the created video to return complete information
	const uploadedVideo = await Video.findById(video._id).populate(
		'owner',
		'username fullName avatar'
	)

	if (!uploadedVideo) {
		// Cleanup if video retrieval fails
		await Promise.allSettled([
			deleteVideoFromCloudinary(videoFile.url),
			deleteImageFromCloudinary(thumbnail.url),
		])
		throw new ApiError(500, 'Failed to retrieve uploaded video information.')
	}

	res.status(201).json(new ApiResponse(201, uploadedVideo, 'Video uploaded successfully.'))
})

/**
 * Get a single video by its ID with owner and likes information
 * Can get unpublished videos if the user is the owner
 * @route GET /api/v1/videos/:videoId
 * @access Public (with view count increment for non-owners)
 */
const getVideoById = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	// Validate video ID format
	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, 'Invalid video ID format.')
	}

	// Get current user if authenticated
	const currentUser = req.user
	let isPublished = true
	let shouldIncrementViews = false

	// Handle view count and access permissions
	if (currentUser) {
		try {
			const video = await Video.findById(videoId)

			if (!video) {
				throw new ApiError(404, 'Video not found.')
			}

			const isOwner = video.owner.toString() === currentUser._id.toString()

			// Only increment views for published videos viewed by non-owners
			if (!isOwner && video.isPublished) {
				shouldIncrementViews = true
			}
			// Allow owners to view their own unpublished videos
			else if (isOwner) {
				isPublished = false // This allows fetching unpublished videos for owners
			}
		} catch (error) {
			if (error instanceof ApiError) throw error
			throw new ApiError(500, 'Failed to process video access.')
		}
	}

	try {
		const videoData = await Video.aggregate([
			{
				$match: {
					_id: new mongoose.Types.ObjectId(videoId),
					...(isPublished ? { isPublished: true } : { isPublished: { $exists: true } }),
				},
			},
			{
				$lookup: {
					from: 'users',
					localField: 'owner',
					foreignField: '_id',
					as: 'owner',
					pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } }],
				},
			},
			{
				$lookup: {
					from: 'likes',
					localField: '_id',
					foreignField: 'video',
					as: 'likes',
				},
			},
			{
				$addFields: {
					likesCount: { $size: '$likes' },
					isLikedByUser: currentUser ? { $in: [currentUser._id, '$likes.likedBy'] } : false,
					owner: { $arrayElemAt: ['$owner', 0] },
				},
			},
			{ $project: { likes: 0 } },
		])

		if (!videoData || videoData.length === 0) {
			throw new ApiError(404, 'Video not found or access denied.')
		}

		// Increment view count if applicable
		if (shouldIncrementViews) {
			try {
				await Video.findByIdAndUpdate(
					videoId,
					{ $inc: { views: 1 } },
					{ validateBeforeSave: false }
				)
				videoData[0].views += 1 // Update the returned data
			} catch (error) {
				// Don't fail the request if view increment fails
				console.error('Failed to increment view count:', error)
			}
		}

		res.status(200).json(new ApiResponse(200, videoData[0], 'Video fetched successfully.'))
	} catch (error) {
		if (error instanceof ApiError) throw error
		throw new ApiError(500, 'Failed to fetch video information.')
	}
})

/**
 * Update video information (title, description, thumbnail)
 * @route PATCH /api/v1/videos/:videoId
 * @access Private (owner only)
 */
const updateVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	// Validate video ID format
	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, 'Invalid video ID format.')
	}

	let { title, description } = req.body
	title = title?.trim()
	description = description?.trim()

	// Ensure at least one field is being updated
	if (!req.file && !title?.trim() && !description?.trim()) {
		throw new ApiError(
			400,
			'At least one field (title, description, or thumbnail) must be provided for update.'
		)
	}

	// Validate field lengths if provided
	if (title && title.length > 100) {
		throw new ApiError(400, 'Video title cannot exceed 100 characters.')
	}

	if (description && description.length > 1000) {
		throw new ApiError(400, 'Video description cannot exceed 1000 characters.')
	}

	// Find video and verify ownership
	const video = await Video.findOne({
		_id: videoId,
		owner: req.user._id,
	})

	if (!video) {
		throw new ApiError(404, 'Video not found or you do not have permission to update it.')
	}

	const oldThumbnailUrl = video.thumbnail

	try {
		// Update text fields if provided
		if (title) {
			video.title = title
		}

		if (description) {
			video.description = description
		}

		// Handle thumbnail update if new file provided
		if (req.file?.path) {
			try {
				const newThumbnail = await uploadOnCloudinary(req.file.path)

				if (!newThumbnail?.url) {
					throw new Error('Failed to upload new thumbnail.')
				}

				video.thumbnail = newThumbnail.url
			} catch (error) {
				throw new ApiError(500, 'Failed to upload new thumbnail. Please try again.')
			}
		}

		// Save updated video
		await video.save({ validateBeforeSave: false })

		// Delete old thumbnail if a new one was uploaded successfully
		if (req.file?.path && oldThumbnailUrl !== video.thumbnail) {
			try {
				await deleteImageFromCloudinary(oldThumbnailUrl)
			} catch (error) {
				// Log error but don't fail the request
				console.error('Failed to delete old thumbnail:', error)
			}
		}

		res.status(200).json(new ApiResponse(200, video, 'Video updated successfully.'))
	} catch (error) {
		if (error instanceof ApiError) throw error
		throw new ApiError(500, 'Failed to update video. Please try again.')
	}
})

/**
 * Delete a video and its associated files
 * @route DELETE /api/v1/videos/:videoId
 * @access Private (owner only)
 */
const deleteVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	// Validate video ID format
	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, 'Invalid video ID format.')
	}

	// Find and delete video, verify ownership
	const video = await Video.findOneAndDelete({
		_id: videoId,
		owner: req.user._id,
	})

	await Like.deleteMany({ video: videoId })
	await Comment.deleteMany({ video: videoId })

	if (!video) {
		throw new ApiError(404, 'Video not found or you do not have permission to delete it.')
	}

	// Store file URLs for cleanup
	const { videoFile: videoFileUrl, thumbnail: thumbnailUrl } = video

	// Delete associated files from cloudinary
	try {
		await Promise.allSettled([
			deleteVideoFromCloudinary(videoFileUrl),
			deleteImageFromCloudinary(thumbnailUrl),
		])
	} catch (error) {
		// Log error but don't fail the request since video is already deleted from DB
		console.error('Failed to delete some files from cloud storage:', error)
	}

	// TODO: Consider deleting related data (likes, comments, etc.) in a background job

	res
		.status(200)
		.json(new ApiResponse(200, { deletedVideoId: videoId }, 'Video deleted successfully.'))
})

/**
 * Toggle the publish status of a video
 * @route PATCH /api/v1/videos/:videoId/toggle-publish
 * @access Private (owner only)
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	// Validate video ID format
	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, 'Invalid video ID format.')
	}

	// Find video and verify ownership
	const video = await Video.findOne({
		_id: videoId,
		owner: req.user._id,
	})

	if (!video) {
		throw new ApiError(404, 'Video not found or you do not have permission to modify it.')
	}

	// Toggle publish status
	const previousStatus = video.isPublished
	video.isPublished = !video.isPublished

	try {
		await video.save({ validateBeforeSave: false })
	} catch (error) {
		throw new ApiError(500, 'Failed to update publish status. Please try again.')
	}

	const statusMessage = video.isPublished
		? 'Video published successfully.'
		: 'Video unpublished successfully.'

	res.status(200).json(
		new ApiResponse(
			200,
			{
				video,
				previousStatus,
				currentStatus: video.isPublished,
			},
			statusMessage
		)
	)
})

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus }
