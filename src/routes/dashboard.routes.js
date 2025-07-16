import { Router } from 'express'
import { requireAuth } from '../middlewares/index.js'
import { getChannelStats, getChannelVideos } from '../controllers/dashboard.controller.js'

// Initialize dashboard router
const dashboardRouter = Router()

/**
 * Dashboard Routes Configuration
 *
 * @description All routes require authentication and provide channel analytics and management data
 * @baseRoute /api/v1/dashboard
 * @middleware requireAuth - Applied to all routes
 */

// Apply authentication middleware to all dashboard routes
dashboardRouter.use(requireAuth)

/**
 * Get channel statistics and analytics
 * @route GET /api/v1/dashboard/stats
 * @access Private (authenticated channel owners only)
 * @middleware requireAuth
 * @description Provides comprehensive channel analytics including views, subscribers, videos count, and revenue data
 * @returns {Object} Channel statistics with metrics like total views, subscriber count, video count, likes, etc.
 * @controller getChannelStats
 */
dashboardRouter.route('/stats').get(getChannelStats)

/**
 * Get channel videos with management data
 * @route GET /api/v1/dashboard/videos
 * @access Private (authenticated channel owners only)
 * @middleware requireAuth
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of videos per page (optional)
 * @query {string} sortBy - Sort field: 'createdAt', 'views', 'likes' (optional)
 * @query {string} sortType - Sort order: 'asc' or 'desc' (optional)
 * @description Get all videos owned by the authenticated user with detailed analytics
 * @returns {Object} Paginated list of user's videos with performance metrics
 * @controller getChannelVideos
 */
dashboardRouter.route('/videos').get(getChannelVideos)

export { dashboardRouter }
