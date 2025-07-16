import { Router } from 'express'
import { requireAuth } from '../middlewares/index.js'
import {
	createPlaylist,
	getPlaylistVideosById,
	updatePlaylist,
	deletePlaylist,
	addVideoToPlaylist,
	removeVideoFromPlaylist,
	getUserPlaylists,
} from '../controllers/playlist.controller.js'

// Initialize playlist router
const playlistRouter = Router()

/**
 * Playlist Routes Configuration
 *
 * @description All routes handle playlist-related operations
 * @baseRoute /api/v1/playlists
 * @middleware requireAuth - All routes require authentication
 */

// Apply authentication middleware to all playlist routes
playlistRouter.use(requireAuth)

/**
 * Create a new playlist
 * @route POST /api/v1/playlists
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @body {string} name - Playlist name (required)
 * @body {string} description - Playlist description (optional)
 * @body {boolean} isPublic - Whether playlist is public (optional, default: false)
 * @returns {Object} Created playlist object with generated ID
 * @controller createPlaylist
 */
playlistRouter.route('/').post(createPlaylist)

/**
 * Get videos from a specific playlist
 * @route GET /api/v1/playlists/:playlistId
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @params {string} playlistId - ID of the playlist to fetch (required)
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of items per page (optional)
 * @returns {Object} Playlist details with video list
 * @controller getPlaylistVideosById
 */

/**
 * Update playlist details
 * @route PATCH /api/v1/playlists/:playlistId
 * @access Private (playlist owner only)
 * @middleware requireAuth
 * @params {string} playlistId - ID of the playlist to update (required)
 * @body {string} name - Updated playlist name (optional)
 * @body {string} description - Updated playlist description (optional)
 * @body {boolean} isPublic - Updated public status (optional)
 * @note Only playlist owner can update
 * @returns {Object} Updated playlist object
 * @controller updatePlaylist
 */

/**
 * Delete a playlist
 * @route DELETE /api/v1/playlists/:playlistId
 * @access Private (playlist owner only)
 * @middleware requireAuth
 * @params {string} playlistId - ID of the playlist to delete (required)
 * @note Only playlist owner can delete, removes all video associations
 * @returns {Object} Success message with deleted playlist ID
 * @controller deletePlaylist
 */
playlistRouter
	.route('/:playlistId')
	.get(getPlaylistVideosById)
	.patch(updatePlaylist)
	.delete(deletePlaylist)

/**
 * Add a video to playlist
 * @route PATCH /api/v1/playlists/add/:videoId/:playlistId
 * @access Private (playlist owner only)
 * @middleware requireAuth
 * @params {string} videoId - ID of the video to add (required)
 * @params {string} playlistId - ID of the playlist (required)
 * @note Only playlist owner can add videos
 * @note Validates video exists and is accessible
 * @returns {Object} Updated playlist with added video
 * @controller addVideoToPlaylist
 */
playlistRouter.route('/add/:videoId/:playlistId').patch(addVideoToPlaylist)

/**
 * Remove video from playlist
 * @route PATCH /api/v1/playlists/remove/:videoId/:playlistId
 * @access Private (playlist owner only)
 * @middleware requireAuth
 * @params {string} videoId - ID of the video to remove (required)
 * @params {string} playlistId - ID of the playlist (required)
 * @note Only playlist owner can remove videos
 * @returns {Object} Updated playlist with video removed
 * @controller removeVideoFromPlaylist
 */
playlistRouter.route('/remove/:videoId/:playlistId').patch(removeVideoFromPlaylist)

/**
 * Get all playlists by user
 * @route GET /api/v1/playlists/user/:userId
 * @access Private (authenticated users only)
 * @middleware requireAuth
 * @params {string} userId - ID of the user whose playlists to fetch (required)
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of items per page (optional)
 * @returns {Object} List of playlists (public playlists or own playlists if owner)
 * @controller getUserPlaylists
 */
playlistRouter.route('/user/:userId').get(getUserPlaylists)

export { playlistRouter }
