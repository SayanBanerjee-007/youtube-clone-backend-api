import mongoose, { isValidObjectId } from 'mongoose'
import { Video, Playlist } from '../models/index.js'
import { asyncHandler, ApiError, ApiResponse } from '../utils/index.js'

/**
 * Create a new playlist
 * @route POST /api/v1/playlist
 * @access Private
 */
const createPlaylist = asyncHandler(async (req, res) => {
	const { name, description, isPublic } = req.body

	// Validate required fields
	if (!name || name.trim().length === 0) {
		throw new ApiError(400, 'Name is required and cannot be empty.')
	}

	// Validate name length
	if (name.trim().length > 100) {
		throw new ApiError(400, 'Playlist name cannot exceed 100 characters.')
	}

	// Validate description length if provided
	if (description && description.length > 500) {
		throw new ApiError(400, 'Description cannot exceed 500 characters.')
	}

	// Create new playlist with validated data
	const newPlaylist = await Playlist.create({
		name: name.trim(),
		description: description?.trim() || '',
		owner: req.user._id,
		isPublic: Boolean(isPublic),
	})

	return res.status(201).json(new ApiResponse(201, newPlaylist, 'Playlist created successfully.'))
})

/**
 * Get playlist details with populated videos by playlist ID
 * @route GET /api/v1/playlist/:playlistId
 * @access Public
 */
const getPlaylistVideosById = asyncHandler(async (req, res) => {
	const { playlistId } = req.params

	// Validate playlist ID format
	if (!isValidObjectId(playlistId)) {
		throw new ApiError(400, 'Invalid playlist ID format.')
	}

	// Find playlist and populate videos with essential fields
	const playlist = await Playlist.findById(playlistId)
		.populate({
			path: 'videos',
			select: 'title description thumbnail duration views createdAt owner',
			populate: {
				path: 'owner',
				select: 'username avatar',
			},
		})
		.populate('owner', 'username avatar')

	if (!playlist) {
		throw new ApiError(404, 'Playlist not found.')
	}

	// Check if playlist is private and user is not the owner
	if (
		!playlist.isPublic &&
		(!req.user || playlist.owner._id.toString() !== req.user._id.toString())
	) {
		throw new ApiError(403, 'This playlist is private.')
	}

	return res.status(200).json(new ApiResponse(200, playlist, 'Playlist retrieved successfully.'))
})

/**
 * Update playlist details (name, description, visibility)
 * @route PATCH /api/v1/playlist/:playlistId
 * @access Private
 */
const updatePlaylist = asyncHandler(async (req, res) => {
	const { playlistId } = req.params
	const { name, description } = req.body
	let { isPublic } = req.body

	// Validate playlist ID format
	if (!isValidObjectId(playlistId)) {
		throw new ApiError(400, 'Invalid playlist ID format.')
	}

	// Check if at least one field is provided for update
	if (!name && !description && isPublic === undefined) {
		throw new ApiError(
			400,
			'At least one field (name, description, or visibility) is required for update.'
		)
	}

	// Validate name if provided
	if (name && (name.trim().length === 0 || name.trim().length > 100)) {
		throw new ApiError(400, 'Name must be between 1 and 100 characters.')
	}

	// Validate description if provided
	if (description && description.length > 500) {
		throw new ApiError(400, 'Description cannot exceed 500 characters.')
	}

	// Validate isPublic if provided
	if (isPublic && !['true', 'false'].includes(isPublic)) {
		throw new ApiError(400, 'isPublic must be a boolean value (true or false).')
	}

	// Find playlist
	const playlist = await Playlist.findById(playlistId)
	if (!playlist) {
		throw new ApiError(404, 'Playlist not found.')
	}

	// Check ownership authorization
	if (playlist.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, 'You are not authorized to update this playlist.')
	}

	console.log(isPublic)

	// Update fields conditionally
	if (name) playlist.name = name.trim()
	if (description !== undefined) playlist.description = description.trim()
	if (isPublic !== undefined) playlist.isPublic = isPublic === 'true'

	// Save updated playlist
	await playlist.save()

	return res.status(200).json(new ApiResponse(200, playlist, 'Playlist updated successfully.'))
})

/**
 * Delete a playlist permanently
 * @route DELETE /api/v1/playlist/:playlistId
 * @access Private
 */
const deletePlaylist = asyncHandler(async (req, res) => {
	const { playlistId } = req.params

	// Validate playlist ID format
	if (!isValidObjectId(playlistId)) {
		throw new ApiError(400, 'Invalid playlist ID format.')
	}

	// Find playlist
	const playlist = await Playlist.findById(playlistId)
	if (!playlist) {
		throw new ApiError(404, 'Playlist not found.')
	}

	// Check ownership authorization
	if (playlist.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, 'You are not authorized to delete this playlist.')
	}

	// Delete playlist
	await Playlist.deleteOne({ _id: playlistId })

	return res.status(200).json(new ApiResponse(200, null, 'Playlist deleted successfully.'))
})

/**
 * Add a video to an existing playlist
 * @route POST /api/v1/playlist/:playlistId/video/:videoId
 * @access Private
 */
const addVideoToPlaylist = asyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params

	// Validate both IDs format
	if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
		throw new ApiError(400, 'Invalid playlist or video ID format.')
	}

	// Check if video exists and is published
	const video = await Video.findById(videoId).select('isPublished owner')
	if (!video) {
		throw new ApiError(404, 'Video not found.')
	}

	if (!video.isPublished) {
		throw new ApiError(400, 'Cannot add unpublished video to playlist.')
	}

	// Find playlist
	const playlist = await Playlist.findById(playlistId)
	if (!playlist) {
		throw new ApiError(404, 'Playlist not found.')
	}

	// Check ownership authorization
	if (playlist.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, 'You are not authorized to modify this playlist.')
	}

	// Check if video already exists in playlist
	const videoExists = playlist.videos.some(v => v.toString() === videoId.toString())
	if (videoExists) {
		throw new ApiError(409, 'Video already exists in playlist.')
	}

	// Add video to playlist
	playlist.videos.push(videoId)
	await playlist.save()

	return res
		.status(200)
		.json(new ApiResponse(200, playlist, 'Video added to playlist successfully.'))
})

/**
 * Remove a video from a playlist
 * @route DELETE /api/v1/playlist/:playlistId/video/:videoId
 * @access Private
 */
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params

	// Validate both IDs format
	if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
		throw new ApiError(400, 'Invalid playlist or video ID format.')
	}

	// Find playlist
	const playlist = await Playlist.findById(playlistId)
	if (!playlist) {
		throw new ApiError(404, 'Playlist not found.')
	}

	// Check ownership authorization
	if (playlist.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, 'You are not authorized to modify this playlist.')
	}

	// Find video index in playlist
	const videoIndex = playlist.videos.findIndex(v => v.toString() === videoId.toString())
	if (videoIndex === -1) {
		throw new ApiError(404, 'Video not found in playlist.')
	}

	// Remove video from playlist
	playlist.videos.splice(videoIndex, 1)
	await playlist.save()

	return res
		.status(200)
		.json(new ApiResponse(200, playlist, 'Video removed from playlist successfully.'))
})

/**
 * Get all playlists created by a specific user
 * @route GET /api/v1/playlist/user/:userId
 * @access Public
 */
const getUserPlaylists = asyncHandler(async (req, res) => {
	const { userId } = req.params

	// Validate user ID format
	if (!isValidObjectId(userId)) {
		throw new ApiError(400, 'Invalid user ID format.')
	}

	// Build query based on user authentication
	let query = { owner: userId }

	// If requesting user is not the playlist owner, only show public playlists
	if (!req.user || req.user._id.toString() !== userId.toString()) {
		query.isPublic = true
	}

	// Find playlists with basic video info
	const playlists = await Playlist.find(query)
		.populate('owner', 'username avatar')
		.populate({
			path: 'videos',
			select: ' thumbnail',
			options: { limit: 1 }, // Only show first video for preview
		})
		.sort({ createdAt: -1 }) // Sort by newest first

	return res.status(200).json(new ApiResponse(200, playlists, 'Playlists retrieved successfully.'))
})

export {
	createPlaylist,
	getUserPlaylists,
	updatePlaylist,
	deletePlaylist,
	getPlaylistVideosById,
	addVideoToPlaylist,
	removeVideoFromPlaylist,
}
