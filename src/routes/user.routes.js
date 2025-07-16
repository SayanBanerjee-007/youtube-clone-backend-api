import { Router } from 'express'
import { requireAuth, requireGuest } from '../middlewares/authentication.middleware.js'
import { uploadImages, autoCleanupTemp } from '../middlewares/multer.middleware.js'
import {
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
} from '../controllers/user.controller.js'

// Initialize router instance
const userRouter = Router()

/**
 * User Routes Configuration
 *
 * @description All routes handle user authentication, profile management, and user data operations
 * @baseRoute /api/v1/users
 */

/**
 * Register a new user account
 * @route POST /api/v1/users/register
 * @access Public (guest users only)
 * @middleware requireGuest, uploadImages, autoCleanupTemp
 * @files {File} avatar - User avatar image (optional, max: 2MB, formats: JPEG, PNG, GIF, WebP)
 * @files {File} coverImage - User cover image (optional, max: 2MB, formats: JPEG, PNG, GIF, WebP)
 * @body {string} username - Unique username (required, 3-20 characters)
 * @body {string} email - Valid email address (required)
 * @body {string} fullName - User's full name (required)
 * @body {string} password - Strong password (required, min: 6 characters)
 * @returns {Object} Created user object with tokens
 * @controller userRegister
 */
userRouter.route('/register').post(
	requireGuest,
	uploadImages.fields([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'coverImage', maxCount: 1 },
	]),
	autoCleanupTemp,
	userRegister
)

/**
 * User login
 * @route POST /api/v1/users/login
 * @access Public (guest users only)
 * @middleware requireGuest
 * @body {string} email - User email or username (required)
 * @body {string} password - User password (required)
 * @returns {Object} User object with access and refresh tokens
 * @controller userLogin
 */
userRouter.route('/login').post(requireGuest, userLogin)

/**
 * User logout
 * @route DELETE /api/v1/users/logout
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @note Clears refresh token from database and cookies
 * @returns {Object} Success message
 * @controller userLogout
 */
userRouter.route('/logout').delete(requireAuth, userLogout)

/**
 * Refresh access token using refresh token
 * @route POST /api/v1/users/refresh-access-token
 * @access Public (guest users only)
 * @middleware requireGuest
 * @body {string} refreshToken - Valid refresh token (required, can be from cookies or body)
 * @returns {Object} New access and refresh tokens
 * @controller refreshAccessToken
 */
userRouter.route('/refresh-access-token').post(requireGuest, refreshAccessToken)

/**
 * Change current user password
 * @route PATCH /api/v1/users/change-current-password
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @body {string} oldPassword - Current password (required)
 * @body {string} newPassword - New password (required, min: 6 characters)
 * @returns {Object} Success message
 * @controller changeCurrentPassword
 */

/**
 * Get current authenticated user details
 * @route GET /api/v1/users/get-current-user
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @returns {Object} Current user object without sensitive data
 * @controller getCurrentUser
 */

/**
 * Update current user account details
 * @route PATCH /api/v1/users/update-account-details
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @body {string} fullName - Updated full name (optional)
 * @body {string} email - Updated email address (optional)
 * @note Username cannot be changed after registration
 * @returns {Object} Updated user object
 * @controller updateAccountDetails
 */

/**
 * Update user avatar image
 * @route PATCH /api/v1/users/update-user-avatar
 * @access Private (authenticated users only)
 * @middleware requireAuth, uploadImages, autoCleanupTemp
 * @files {File} avatar - New avatar image (required, max: 2MB, formats: JPEG, PNG, GIF, WebP)
 * @note Deletes old avatar from cloud storage
 * @returns {Object} User object with updated avatar URL
 * @controller updateUserAvatar
 */

/**
 * Update user cover image
 * @route PATCH /api/v1/users/update-user-cover-image
 * @access Private (authenticated users only)
 * @middleware requireAuth, uploadImages, autoCleanupTemp
 * @files {File} coverImage - New cover image (required, max: 2MB, formats: JPEG, PNG, GIF, WebP)
 * @note Deletes old cover image from cloud storage
 * @returns {Object} User object with updated cover image URL
 * @controller updateUserCoverImage
 */

userRouter.route('/change-current-password').patch(requireAuth, changeCurrentPassword)
userRouter.route('/get-current-user').get(requireAuth, getCurrentUser)
userRouter.route('/update-account-details').patch(requireAuth, updateAccountDetails)
userRouter
	.route('/update-user-avatar')
	.patch(requireAuth, uploadImages.single('avatar'), autoCleanupTemp, updateUserAvatar)
userRouter
	.route('/update-user-cover-image')
	.patch(requireAuth, uploadImages.single('coverImage'), autoCleanupTemp, updateUserCoverImage)

/**
 * Get user channel profile (public)
 * @route GET /api/v1/users/channel/:username
 * @access Public
 * @params {string} username - Username of the channel to fetch (required)
 * @returns {Object} Public channel information including subscriber count, videos, playlists
 * @controller getUserChannelProfile
 */
userRouter.route('/channel/:username').get(getUserChannelProfile)

/**
 * Get user watch history
 * @route GET /api/v1/users/get-user-watch-history
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of items per page (optional)
 * @returns {Object} List of videos watched by the user with pagination
 * @controller getUserWatchHistory
 */
userRouter.route('/get-user-watch-history').get(requireAuth, getUserWatchHistory)

export { userRouter }
