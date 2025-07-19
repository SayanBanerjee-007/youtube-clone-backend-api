import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { User, Video, Comment, Like, Tweet, Playlist, Subscription } from '../models/index.js'
import { deleteImageFromCloudinary } from '../utils/cloudinary.js'
import { REFRESH_TOKEN_SECRET, cookieOptions } from '../constants.js'
import { asyncHandler, ApiError, ApiResponse, uploadOnCloudinary } from '../utils/index.js'

/**
 * Generates access token and refresh token for a user
 * @param {Object} user - User object from database
 * @returns {Object} Object containing accessToken and refreshToken
 * @throws {ApiError} When token generation fails
 */
const generateAccessTokenAndRefreshToken = async user => {
	try {
		// Validate user object
		if (!user || !user._id) {
			throw new ApiError(400, 'Invalid user object provided.')
		}

		// Generate tokens
		const accessToken = await user.generateAccessToken()
		const refreshToken = await user.generateRefreshToken()

		// Validate token generation
		if (!accessToken || !refreshToken) {
			throw new ApiError(500, 'Failed to generate tokens.')
		}

		// Save refresh token to database
		user.refreshToken = refreshToken
		await user.save({ validateBeforeSave: false })

		return { accessToken, refreshToken }
	} catch (error) {
		// Handle specific error types
		if (error instanceof ApiError) {
			throw error
		}
		throw new ApiError(500, 'Something went wrong while generating access token and refresh token.')
	}
}

/**
 * Registers a new user with avatar and optional cover image
 * @route POST /api/v1/users/register
 * @access Public
 */
const userRegister = asyncHandler(async (req, res) => {
	// Extract and validate required fields
	const { username, email, fullName, password } = req.body

	// Check for empty or undefined fields
	if ([username, email, fullName, password].some(field => !field?.trim())) {
		throw new ApiError(400, 'All fields are required.')
	}

	// Validate email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!emailRegex.test(email)) {
		throw new ApiError(400, 'Please provide a valid email address.')
	}

	// Validate username format (alphanumeric and underscore only)
	const usernameRegex = /^[a-zA-Z0-9_]+$/
	if (!usernameRegex.test(username)) {
		throw new ApiError(400, 'Username can only contain letters, numbers, and underscores.')
	}

	// Validate password strength
	if (password.length < 6) {
		throw new ApiError(400, 'Password must be at least 6 characters long.')
	}

	// Check if user already exists
	const doesUserExist = await User.findOne({
		$or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
	})

	if (doesUserExist) {
		throw new ApiError(409, 'User with same username or email already exists.')
	}

	// Handle optional avatar file upload
	let avatar = null
	if (
		req.files &&
		req.files.avatar &&
		Array.isArray(req.files.avatar) &&
		req.files.avatar.length > 0
	) {
		const avatarLocalPath = req.files.avatar[0].path
		if (avatarLocalPath) {
			avatar = await uploadOnCloudinary(avatarLocalPath)
			if (!avatar?.url) {
				// Clean up failed upload
				if (avatar?.public_id) {
					await deleteImageFromCloudinary(avatar.public_id)
				}
				throw new ApiError(500, 'Error uploading avatar.')
			}
		}
	}

	// Handle optional cover image upload
	let coverImage
	if (
		req.files.coverImage &&
		Array.isArray(req.files.coverImage) &&
		req.files.coverImage.length > 0
	) {
		const coverImageLocalPath = req.files.coverImage[0].path
		if (coverImageLocalPath) {
			coverImage = await uploadOnCloudinary(coverImageLocalPath)
			if (!coverImage?.url) {
				// Clean up failed uploads
				await deleteImageFromCloudinary(avatar.public_id)
				if (coverImage?.public_id) {
					await deleteImageFromCloudinary(coverImage.public_id)
				}
				throw new ApiError(500, 'Error uploading cover image.')
			}
		}
	}

	// Create user in database
	const user = await User.create({
		username: username.toLowerCase(),
		email: email.toLowerCase(),
		fullName,
		avatar: avatar?.url || '',
		coverImage: coverImage?.url || '',
		password,
	})

	// Retrieve created user without sensitive information
	const createdUser = await User.findById(user._id).select('-password -refreshToken')

	// Validate user creation
	if (!createdUser) {
		// Clean up on failure
		await User.findByIdAndDelete(user._id)
		if (avatar?.public_id) {
			await deleteImageFromCloudinary(avatar.public_id)
		}
		if (coverImage?.public_id) {
			await deleteImageFromCloudinary(coverImage.public_id)
		}
		throw new ApiError(500, 'Something went wrong while registering. Please try again.')
	}

	return res.status(201).json(new ApiResponse(201, createdUser, 'User registered successfully'))
})

/**
 * Authenticates user and provides access token
 * @route POST /api/v1/users/login
 * @access Public
 */
const userLogin = asyncHandler(async (req, res) => {
	const { usernameEmail, password } = req.body

	// Validate required fields
	if ([usernameEmail, password].some(field => field?.trim() === '' || field === undefined)) {
		throw new ApiError(400, 'Both username/email and password are required.')
	}

	// Find user by username or email (case-insensitive)
	const user = await User.findOne({
		$or: [{ username: usernameEmail.toLowerCase() }, { email: usernameEmail.toLowerCase() }],
	})

	if (!user) {
		// Generic error message for security reasons
		throw new ApiError(401, 'Invalid user credentials.')
	}

	// Verify password
	const isPasswordCorrect = await user.isPasswordCorrect(password)
	if (!isPasswordCorrect) {
		throw new ApiError(401, 'Invalid user credentials.')
	}

	// Generate tokens
	const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user)

	// Remove sensitive data before sending response
	const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

	return res
		.status(200)
		.cookie('accessToken', accessToken, cookieOptions)
		.cookie('refreshToken', refreshToken, cookieOptions)
		.json(
			new ApiResponse(
				200,
				{
					user: loggedInUser,
					accessToken,
					refreshToken,
				},
				'Login successful'
			)
		)
})

/**
 * Logs out user and clears refresh token
 * @route DELETE /api/v1/users/logout
 * @access Private
 */
const userLogout = asyncHandler(async (req, res) => {
	// Validate authenticated user
	if (!req.user || !req.user._id) {
		res.clearCookie('accessToken', cookieOptions)
		res.clearCookie('refreshToken', cookieOptions)
		throw new ApiError(401, 'Unauthorized access.')
	}

	// Clear refresh token from database
	await User.findByIdAndUpdate(
		req.user._id,
		{
			$unset: {
				refreshToken: 1,
			},
		},
		{
			new: true,
		}
	)

	return res
		.status(200)
		.clearCookie('accessToken', cookieOptions)
		.clearCookie('refreshToken', cookieOptions)
		.json(new ApiResponse(200, {}, 'Logout successful.'))
})

/**
 * Refreshes access token using valid refresh token
 * @route POST /api/v1/users/refresh-token
 * @access Public
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
	// Get refresh token from cookies or request body
	const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

	if (!incomingRefreshToken || incomingRefreshToken.trim() === '') {
		throw new ApiError(401, 'Unauthorized access.')
	}

	try {
		// Verify refresh token
		const decodedRefreshToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET)

		// Validate decoded token structure
		if (
			!decodedRefreshToken ||
			typeof decodedRefreshToken !== 'object' ||
			!decodedRefreshToken._id
		) {
			throw new ApiError(401, 'Invalid refresh token.')
		}

		// Find user and validate refresh token
		const user = await User.findById(decodedRefreshToken._id)
		if (!user || !user.refreshToken || user.refreshToken !== incomingRefreshToken) {
			throw new ApiError(401, 'Refresh token is expired or used.')
		}

		// Generate new tokens
		const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user)

		return res
			.status(200)
			.cookie('accessToken', accessToken, cookieOptions)
			.cookie('refreshToken', refreshToken, cookieOptions)
			.json(
				new ApiResponse(
					200,
					{
						accessToken,
						refreshToken,
					},
					'Access token refreshed successfully.'
				)
			)
	} catch (error) {
		// Handle JWT specific errors
		if (error.name === 'JsonWebTokenError') {
			throw new ApiError(401, 'Invalid refresh token.')
		}
		if (error.name === 'TokenExpiredError') {
			throw new ApiError(401, 'Refresh token expired.')
		}
		throw error
	}
})

/**
 * Changes user's current password
 * @route PATCH /api/v1/users/change-password
 * @access Private
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
	const { currentPassword, newPassword } = req.body

	// Validate required fields
	if ([currentPassword, newPassword].some(field => field?.trim() === '' || field === undefined)) {
		throw new ApiError(400, 'Both current and new password are required.')
	}

	// Ensure new password is different
	if (currentPassword === newPassword) {
		throw new ApiError(400, 'New password must be different from current password.')
	}

	// Validate new password strength
	if (newPassword.length < 6) {
		throw new ApiError(400, 'New password must be at least 6 characters long.')
	}

	// Verify current password
	const isPasswordCorrect = await req.user.isPasswordCorrect(currentPassword)
	if (!isPasswordCorrect) {
		throw new ApiError(401, 'Invalid current password.')
	}

	// Update password
	req.user.password = newPassword
	await req.user.save({ validateBeforeSave: false })

	return res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully.'))
})

/**
 * Gets current authenticated user's information
 * @route GET /api/v1/users/current-user
 * @access Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
	// Validate user exists in request
	if (!req.user) {
		throw new ApiError(401, 'Unauthorized access.')
	}

	// Create clean user object without sensitive data
	const currentUser = await User.findById(req.user._id).select('-password -refreshToken')

	if (!currentUser) {
		throw new ApiError(404, 'User not found.')
	}

	return res
		.status(200)
		.json(new ApiResponse(200, currentUser, 'Current user retrieved successfully.'))
})

/**
 * Updates user's account details (username and fullName)
 * @route PATCH /api/v1/users/update-account
 * @access Private
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
	const { username, fullName } = req.body

	// Validate at least one field is provided
	if (!username && !fullName) {
		throw new ApiError(400, 'At least one field (username or fullName) is required.')
	}

	// Validate username format if provided
	if (username) {
		const usernameRegex = /^[a-zA-Z0-9_]+$/
		if (!usernameRegex.test(username)) {
			throw new ApiError(400, 'Username can only contain letters, numbers, and underscores.')
		}

		// Check if username is already taken
		const existingUser = await User.findOne({
			username: username.toLowerCase(),
			_id: { $ne: req.user._id },
		})

		if (existingUser) {
			throw new ApiError(409, 'Username is already taken.')
		}

		req.user.username = username.toLowerCase()
	}

	// Update fullName if provided
	if (fullName && fullName.trim()) {
		req.user.fullName = fullName.trim()
	}

	// Save changes
	await req.user.save({ validateBeforeSave: false })

	// Get updated user without sensitive data
	const updatedUser = await User.findById(req.user._id).select('-password -refreshToken')

	return res
		.status(200)
		.json(new ApiResponse(200, updatedUser, 'Account details updated successfully.'))
})

/**
 * Updates user's avatar image
 * @route PATCH /api/v1/users/avatar
 * @access Private
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
	// Validate file upload
	if (!req.file?.path) {
		throw new ApiError(400, 'Avatar file is required.')
	}

	// Upload new avatar
	const avatar = await uploadOnCloudinary(req.file.path)
	if (!avatar?.url) {
		throw new ApiError(500, 'Error uploading avatar.')
	}

	// Store old avatar URL for cleanup
	const oldAvatarUrl = req.user.avatar

	// Update user avatar
	req.user.avatar = avatar.url
	await req.user.save({ validateBeforeSave: false })

	// Delete old avatar from cloudinary (if exists)
	if (oldAvatarUrl) {
		try {
			await deleteImageFromCloudinary(oldAvatarUrl)
		} catch (error) {
			// Log error but don't fail the request
			console.error('Failed to delete old avatar:', error)
		}
	}

	// Get updated user without sensitive data
	const updatedUser = await User.findById(req.user._id).select('-password -refreshToken')

	return res.status(200).json(new ApiResponse(200, updatedUser, 'Avatar updated successfully.'))
})

/**
 * Updates user's cover image
 * @route PATCH /api/v1/users/cover-image
 * @access Private
 */
const updateUserCoverImage = asyncHandler(async (req, res) => {
	// Validate file upload
	if (!req.file?.path) {
		throw new ApiError(400, 'Cover image file is required.')
	}

	// Upload new cover image
	const coverImage = await uploadOnCloudinary(req.file.path)
	if (!coverImage?.url) {
		throw new ApiError(500, 'Error uploading cover image.')
	}

	// Store old cover image URL for cleanup
	const oldCoverImageUrl = req.user.coverImage

	// Update user cover image
	req.user.coverImage = coverImage.url
	await req.user.save({ validateBeforeSave: false })

	// Delete old cover image from cloudinary (if exists)
	if (oldCoverImageUrl) {
		try {
			await deleteImageFromCloudinary(oldCoverImageUrl)
		} catch (error) {
			// Log error but don't fail the request
			console.error('Failed to delete old cover image:', error)
		}
	}

	// Get updated user without sensitive data
	const updatedUser = await User.findById(req.user._id).select('-password -refreshToken')

	return res
		.status(200)
		.json(new ApiResponse(200, updatedUser, 'Cover image updated successfully.'))
})

/**
 * Gets user channel profile with subscription information
 * @route GET /api/v1/users/c/:username
 * @access Public
 */
const getUserChannelProfile = asyncHandler(async (req, res) => {
	const { username } = req.params

	// Validate username parameter
	if (!username?.trim()) {
		throw new ApiError(400, 'Username is required.')
	}

	try {
		// Aggregate pipeline to get channel profile with subscription data
		const channel = await User.aggregate([
			{ $match: { username: username.toLowerCase().trim() } },
			{
				$lookup: {
					from: 'subscriptions',
					localField: '_id',
					foreignField: 'channel',
					as: 'subscribers',
				},
			},
			{
				$lookup: {
					from: 'subscriptions',
					localField: '_id',
					foreignField: 'subscriber',
					as: 'subscribedTo',
				},
			},
			{
				$addFields: {
					subscriberCount: { $size: '$subscribers' },
					subscribedToCount: { $size: '$subscribedTo' },
					isSubscribed: { $in: [req.user?._id, '$subscribers.subscriber'] },
				},
			},
			{
				$project: {
					fullName: 1,
					username: 1,
					subscriberCount: 1,
					subscribedToCount: 1,
					isSubscribed: 1,
					avatar: 1,
					coverImage: 1,
					email: 1,
					createdAt: 1,
				},
			},
		])

		// Validate channel exists
		if (!channel || channel.length === 0) {
			throw new ApiError(404, 'Channel not found.')
		}

		return res
			.status(200)
			.json(new ApiResponse(200, channel[0], 'Channel profile retrieved successfully.'))
	} catch (error) {
		if (error instanceof ApiError) {
			throw error
		}
		throw new ApiError(500, 'Error retrieving channel profile.')
	}
})

/**
 * Gets user's watch history with video and owner details
 * @route GET /api/v1/users/history
 * @access Private
 */
const getUserWatchHistory = asyncHandler(async (req, res) => {
	// Validate user authentication
	if (!req.user?._id) {
		throw new ApiError(401, 'Unauthorized access.')
	}

	try {
		// Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
			throw new ApiError(400, 'Invalid user ID format.')
		}

		// Aggregate pipeline to get watch history with video and owner details
		const userWithWatchHistory = await User.aggregate([
			{
				$match: {
					_id: new mongoose.Types.ObjectId(req.user._id),
				},
			},
			{
				// Lookup videos in watch history
				$lookup: {
					from: 'videos',
					localField: 'watchHistory',
					foreignField: '_id',
					as: 'watchHistory',
					pipeline: [
						{
							// Lookup video owner details
							$lookup: {
								from: 'users',
								localField: 'owner',
								foreignField: '_id',
								as: 'owner',
								pipeline: [
									{
										$project: {
											fullName: 1,
											username: 1,
											avatar: 1,
										},
									},
								],
							},
						},
						{
							// Extract owner from array
							$addFields: {
								owner: {
									$first: '$owner',
								},
							},
						},
						{
							// Project required video fields
							$project: {
								title: 1,
								description: 1,
								thumbnail: 1,
								videoFile: 1,
								duration: 1,
								views: 1,
								createdAt: 1,
								owner: 1,
							},
						},
					],
				},
			},
			{
				// Project only watch history
				$project: {
					watchHistory: 1,
				},
			},
		])

		// Validate aggregation result
		if (!userWithWatchHistory || userWithWatchHistory.length === 0) {
			return res
				.status(200)
				.json(new ApiResponse(200, { watchHistory: [] }, 'Watch history retrieved successfully.'))
		}

		return res
			.status(200)
			.json(new ApiResponse(200, userWithWatchHistory[0], 'Watch history retrieved successfully.'))
	} catch (error) {
		if (error instanceof ApiError) {
			throw error
		}
		throw new ApiError(500, 'Error retrieving watch history.')
	}
})

/**
 * Delete user account and all associated data
 * @desc Permanently deletes user account and all related content including videos, comments, tweets, playlists, likes, and subscriptions
 * @route DELETE /api/v1/users/delete-account
 * @access Private
 * @body {string} password - Current user password for confirmation
 */
const deleteUserAccount = asyncHandler(async (req, res) => {
	const userId = req.user._id
	const { password } = req.body

	// Ensure user is authenticated
	if (!userId) {
		throw new ApiError(401, 'User not authenticated.')
	}

	// Validate password is provided
	if (!password) {
		throw new ApiError(400, 'Password is required to delete account.')
	}

	try {
		// Find the user to get avatar and cover image URLs for deletion
		const user = await User.findById(userId)
		if (!user) {
			throw new ApiError(404, 'User not found.')
		}

		// Verify password before proceeding with deletion
		const isPasswordValid = await user.isPasswordCorrect(password)
		if (!isPasswordValid) {
			throw new ApiError(401, 'Invalid password. Account deletion cancelled.')
		}

		// Get all user's videos to delete from cloudinary
		const userVideos = await Video.find({ owner: userId })

		// Delete all video files from cloudinary
		for (const video of userVideos) {
			if (video.videoFile) {
				try {
					await deleteImageFromCloudinary(video.videoFile)
				} catch (error) {
					console.warn(`Failed to delete video file: ${video.videoFile}`, error)
				}
			}
			if (video.thumbnail) {
				try {
					await deleteImageFromCloudinary(video.thumbnail)
				} catch (error) {
					console.warn(`Failed to delete thumbnail: ${video.thumbnail}`, error)
				}
			}
		}

		// Delete user's avatar and cover image from cloudinary
		if (user.avatar) {
			try {
				await deleteImageFromCloudinary(user.avatar)
			} catch (error) {
				console.warn(`Failed to delete avatar: ${user.avatar}`, error)
			}
		}
		if (user.coverImage) {
			try {
				await deleteImageFromCloudinary(user.coverImage)
			} catch (error) {
				console.warn(`Failed to delete cover image: ${user.coverImage}`, error)
			}
		}

		// Delete all user-related data in order of dependencies
		// 1. Delete likes on user's content
		await Like.deleteMany({
			$or: [
				{ video: { $in: userVideos.map(v => v._id) } },
				{ comment: { $in: await Comment.find({ owner: userId }).distinct('_id') } },
				{ tweet: { $in: await Tweet.find({ owner: userId }).distinct('_id') } },
			],
		})

		// 2. Delete likes made by user
		await Like.deleteMany({ likedBy: userId })

		// 3. Delete comments on user's videos
		await Comment.deleteMany({ video: { $in: userVideos.map(v => v._id) } })

		// 4. Delete user's comments
		await Comment.deleteMany({ owner: userId })

		// 5. Delete user's tweets
		await Tweet.deleteMany({ owner: userId })

		// 6. Delete user's playlists
		await Playlist.deleteMany({ owner: userId })

		// 7. Delete user's videos
		await Video.deleteMany({ owner: userId })

		// 8. Delete user's subscriptions (both as subscriber and channel)
		await Subscription.deleteMany({
			$or: [{ subscriber: userId }, { channel: userId }],
		})

		// 9. Finally, delete the user account
		await User.findByIdAndDelete(userId)

		// Clear cookies
		res
			.status(200)
			.clearCookie('accessToken', cookieOptions)
			.clearCookie('refreshToken', cookieOptions)
			.json(
				new ApiResponse(200, null, 'User account and all associated data deleted successfully.')
			)
	} catch (error) {
		if (error instanceof ApiError) {
			throw error
		}
		throw new ApiError(500, 'Failed to delete user account. Please try again.')
	}
})

export {
	userRegister,
	userLogin,
	userLogout,
	refreshAccessToken,
	changeCurrentPassword,
	getCurrentUser,
	updateAccountDetails,
	updateUserAvatar,
	updateUserCoverImage,
	getUserChannelProfile,
	getUserWatchHistory,
	deleteUserAccount,
}
