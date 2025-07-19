/**
 * YouTube Clone API Documentation v3 - Interactive JavaScript
 * Modern UI with VS Code-like navigation and three-column layout
 */

class APIDocsApp {
	constructor() {
		this.state = {
			currentEndpoint: null,
			isAuthenticated: false,
			authToken: localStorage.getItem('authToken') || null,
			userId: localStorage.getItem('userId') || null,
			sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
			theme: localStorage.getItem('theme') || 'light',
			searchTerm: '',
			activeRequests: new Map(),
			searchTimeout: null,
			responseFormatted: false,
		}

		this.endpoints = this.initializeEndpoints()
		this.init()
	}

	init() {
		this.setupEventListeners()
		this.setupTheme()
		this.setupSidebar()
		this.setupKeyboardShortcuts()
		this.setupMobileResponsive()
		this.updateAuthStatus()
		this.hideLoadingScreen()
		this.restoreState()
	}

	initializeEndpoints() {
		return {
			auth: {
				name: 'Authentication',
				icon: 'fas fa-user-shield',
				routes: {
					'auth-register': {
						name: 'Register User',
						method: 'POST',
						url: '/api/v1/users/register',
						auth: false,
						description:
							'Create a new user account with username, email, fullname, password, and avatar image.',
						fields: [
							{ name: 'username', type: 'text', required: true, placeholder: 'Enter username' },
							{ name: 'email', type: 'email', required: true, placeholder: 'Enter email address' },
							{ name: 'fullName', type: 'text', required: true, placeholder: 'Enter full name' },
							{ name: 'password', type: 'password', required: true, placeholder: 'Enter password' },
							{ name: 'avatar', type: 'file', required: true, accept: 'image/*' },
							{ name: 'coverImage', type: 'file', required: false, accept: 'image/*' },
						],
					},
					'auth-login': {
						name: 'Login User',
						method: 'POST',
						url: '/api/v1/users/login',
						auth: false,
						description: 'Authenticate user with username/email and password.',
						fields: [
							{
								name: 'usernameEmail',
								type: 'text',
								required: true,
								placeholder: 'Enter username or email',
							},
							{ name: 'password', type: 'password', required: true, placeholder: 'Enter password' },
						],
					},
					'auth-logout': {
						name: 'Logout User',
						method: 'DELETE',
						url: '/api/v1/users/logout',
						auth: true,
						description: 'Logout the currently authenticated user.',
						fields: [],
					},
					'auth-refresh': {
						name: 'Refresh Token',
						method: 'POST',
						url: '/api/v1/users/refresh-access-token',
						auth: false,
						description: 'Refresh the access token using refresh token.',
						fields: [
							{
								name: 'refreshToken',
								type: 'text',
								required: false,
								placeholder: 'Refresh token (optional if in cookies)',
							},
						],
					},
				},
			},
			users: {
				name: 'User Management',
				icon: 'fas fa-users',
				routes: {
					'user-profile': {
						name: 'Get Current User',
						method: 'GET',
						url: '/api/v1/users/get-current-user',
						auth: true,
						description: 'Get current authenticated user profile information.',
						fields: [],
					},
					'user-update': {
						name: 'Update Account',
						method: 'PATCH',
						url: '/api/v1/users/update-account-details',
						auth: true,
						description: 'Update user account details like fullname and username.',
						fields: [
							{
								name: 'fullName',
								type: 'text',
								required: false,
								placeholder: 'Enter new full name',
							},
							{
								name: 'username',
								type: 'text',
								required: false,
								placeholder: 'Enter new username',
							},
						],
					},
					'user-password': {
						name: 'Change Password',
						method: 'PATCH',
						url: '/api/v1/users/change-current-password',
						auth: true,
						description: 'Change user password with old and new password.',
						fields: [
							{
								name: 'currentPassword',
								type: 'password',
								required: true,
								placeholder: 'Enter current password',
							},
							{
								name: 'newPassword',
								type: 'password',
								required: true,
								placeholder: 'Enter new password',
							},
						],
					},
					'user-avatar': {
						name: 'Update Avatar',
						method: 'PATCH',
						url: '/api/v1/users/update-user-avatar',
						auth: true,
						description: 'Update user avatar image.',
						fields: [{ name: 'avatar', type: 'file', required: true, accept: 'image/*' }],
					},
					'user-cover': {
						name: 'Update Cover Image',
						method: 'PATCH',
						url: '/api/v1/users/update-user-cover-image',
						auth: true,
						description: 'Update user cover image.',
						fields: [{ name: 'coverImage', type: 'file', required: true, accept: 'image/*' }],
					},
					'user-channel': {
						name: 'Get User Channel',
						method: 'GET',
						url: '/api/v1/users/channel/:username',
						auth: false,
						description: 'Get user channel profile by username.',
						fields: [
							{
								name: 'username',
								type: 'text',
								required: true,
								placeholder: 'Enter username',
								urlParam: true,
							},
						],
					},
					'user-history': {
						name: 'Watch History',
						method: 'GET',
						url: '/api/v1/users/get-user-watch-history',
						auth: true,
						description: 'Get user watch history.',
						fields: [
							{
								name: 'page',
								type: 'number',
								required: false,
								placeholder: 'Page number (default: 1)',
							},
							{
								name: 'limit',
								type: 'number',
								required: false,
								placeholder: 'Items per page (default: 10)',
							},
						],
					},
					'user-delete-account': {
						name: 'Delete Account',
						method: 'DELETE',
						url: '/api/v1/users/delete-account',
						auth: true,
						description:
							'Permanently delete user account and all associated data. This action is irreversible.',
						fields: [
							{
								name: 'password',
								type: 'password',
								required: true,
								placeholder: 'Enter current password for confirmation',
							},
						],
					},
				},
			},
			videos: {
				name: 'Video Management',
				icon: 'fas fa-video',
				routes: {
					'video-upload': {
						name: 'Upload Video',
						method: 'POST',
						url: '/api/v1/videos',
						auth: true,
						description: 'Upload a new video with title, description, video file, and thumbnail.',
						fields: [
							{ name: 'title', type: 'text', required: true, placeholder: 'Enter video title' },
							{
								name: 'description',
								type: 'textarea',
								required: true,
								placeholder: 'Enter video description',
							},
							{ name: 'videoFile', type: 'file', required: true, accept: 'video/*' },
							{ name: 'thumbnail', type: 'file', required: true, accept: 'image/*' },
						],
					},
					'video-list': {
						name: 'Get All Videos',
						method: 'GET',
						url: '/api/v1/videos',
						auth: false,
						description: 'Get paginated list of all videos with optional search and sorting.',
						fields: [
							{
								name: 'page',
								type: 'number',
								required: false,
								placeholder: 'Page number (default: 1)',
							},
							{
								name: 'limit',
								type: 'number',
								required: false,
								placeholder: 'Items per page (default: 10)',
							},
							{ name: 'keyword', type: 'text', required: false, placeholder: 'Search keyword' },
							{
								name: 'sortBy',
								type: 'select',
								required: false,
								options: ['createdAt', 'views', 'likesCount'],
								placeholder: 'Sort by field',
							},
							{
								name: 'sortType',
								type: 'select',
								required: false,
								options: ['asc', 'desc'],
								placeholder: 'Sort order',
							},
							{ name: 'userId', type: 'text', required: false, placeholder: 'Filter by user ID' },
						],
					},
					'video-detail': {
						name: 'Get Video by ID',
						method: 'GET',
						url: '/api/v1/videos/:videoId',
						auth: false,
						description: 'Get video details by video ID.',
						fields: [
							{
								name: 'videoId',
								type: 'text',
								required: true,
								placeholder: 'Enter video ID',
								urlParam: true,
							},
						],
					},
					'video-update': {
						name: 'Update Video',
						method: 'PATCH',
						url: '/api/v1/videos/:videoId',
						auth: true,
						description: 'Update video details like title and description.',
						fields: [
							{
								name: 'videoId',
								type: 'text',
								required: true,
								placeholder: 'Enter video ID',
								urlParam: true,
							},
							{ name: 'title', type: 'text', required: false, placeholder: 'Enter new title' },
							{
								name: 'description',
								type: 'textarea',
								required: false,
								placeholder: 'Enter new description',
							},
							{ name: 'thumbnail', type: 'file', required: false, accept: 'image/*' },
						],
					},
					'video-delete': {
						name: 'Delete Video',
						method: 'DELETE',
						url: '/api/v1/videos/:videoId',
						auth: true,
						description: 'Delete a video by ID.',
						fields: [
							{
								name: 'videoId',
								type: 'text',
								required: true,
								placeholder: 'Enter video ID',
								urlParam: true,
							},
						],
					},
					'video-publish': {
						name: 'Toggle Publish Status',
						method: 'PATCH',
						url: '/api/v1/videos/toggle/publish/:videoId',
						auth: true,
						description: 'Toggle video publish status.',
						fields: [
							{
								name: 'videoId',
								type: 'text',
								required: true,
								placeholder: 'Enter video ID',
								urlParam: true,
							},
						],
					},
				},
			},
			playlists: {
				name: 'Playlist Management',
				icon: 'fas fa-list',
				routes: {
					'playlist-create': {
						name: 'Create Playlist',
						method: 'POST',
						url: '/api/v1/playlists',
						auth: true,
						description: 'Create a new playlist with name and description.',
						fields: [
							{ name: 'name', type: 'text', required: true, placeholder: 'Enter playlist name' },
							{
								name: 'description',
								type: 'textarea',
								required: false,
								placeholder: 'Enter playlist description',
							},
							{
								name: 'isPublic',
								type: 'select',
								required: false,
								options: ['true', 'false'],
								placeholder: 'Is playlist public?',
							},
						],
					},
					'playlist-user': {
						name: 'Get User Playlists',
						method: 'GET',
						url: '/api/v1/playlists/user/:userId',
						auth: true,
						description: 'Get all playlists created by a specific user.',
						fields: [
							{
								name: 'userId',
								type: 'text',
								required: true,
								placeholder: 'Enter user ID',
								urlParam: true,
							},
							{
								name: 'page',
								type: 'number',
								required: false,
								placeholder: 'Page number (default: 1)',
							},
							{
								name: 'limit',
								type: 'number',
								required: false,
								placeholder: 'Items per page (default: 10)',
							},
						],
					},
					'playlist-detail': {
						name: 'Get Playlist by ID',
						method: 'GET',
						url: '/api/v1/playlists/:playlistId',
						auth: true,
						description: 'Get playlist details and videos by ID.',
						fields: [
							{
								name: 'playlistId',
								type: 'text',
								required: true,
								placeholder: 'Enter playlist ID',
								urlParam: true,
							},
							{
								name: 'page',
								type: 'number',
								required: false,
								placeholder: 'Page number (default: 1)',
							},
							{
								name: 'limit',
								type: 'number',
								required: false,
								placeholder: 'Items per page (default: 10)',
							},
						],
					},
					'playlist-add-video': {
						name: 'Add Video to Playlist',
						method: 'PATCH',
						url: '/api/v1/playlists/add/:videoId/:playlistId',
						auth: true,
						description: 'Add a video to a playlist.',
						fields: [
							{
								name: 'videoId',
								type: 'text',
								required: true,
								placeholder: 'Enter video ID',
								urlParam: true,
							},
							{
								name: 'playlistId',
								type: 'text',
								required: true,
								placeholder: 'Enter playlist ID',
								urlParam: true,
							},
						],
					},
					'playlist-remove-video': {
						name: 'Remove Video from Playlist',
						method: 'PATCH',
						url: '/api/v1/playlists/remove/:videoId/:playlistId',
						auth: true,
						description: 'Remove a video from a playlist.',
						fields: [
							{
								name: 'videoId',
								type: 'text',
								required: true,
								placeholder: 'Enter video ID',
								urlParam: true,
							},
							{
								name: 'playlistId',
								type: 'text',
								required: true,
								placeholder: 'Enter playlist ID',
								urlParam: true,
							},
						],
					},
					'playlist-update': {
						name: 'Update Playlist',
						method: 'PATCH',
						url: '/api/v1/playlists/:playlistId',
						auth: true,
						description: 'Update playlist name and description.',
						fields: [
							{
								name: 'playlistId',
								type: 'text',
								required: true,
								placeholder: 'Enter playlist ID',
								urlParam: true,
							},
							{ name: 'name', type: 'text', required: false, placeholder: 'Enter new name' },
							{
								name: 'description',
								type: 'textarea',
								required: false,
								placeholder: 'Enter new description',
							},
							{
								name: 'isPublic',
								type: 'select',
								required: false,
								options: ['true', 'false'],
								placeholder: 'Is playlist public?',
							},
						],
					},
					'playlist-delete': {
						name: 'Delete Playlist',
						method: 'DELETE',
						url: '/api/v1/playlists/:playlistId',
						auth: true,
						description: 'Delete a playlist by ID.',
						fields: [
							{
								name: 'playlistId',
								type: 'text',
								required: true,
								placeholder: 'Enter playlist ID',
								urlParam: true,
							},
						],
					},
				},
			},
			comments: {
				name: 'Comment Management',
				icon: 'fas fa-comments',
				routes: {
					'comment-add': {
						name: 'Add Comment',
						method: 'POST',
						url: '/api/v1/comments/:videoId',
						auth: true,
						description: 'Add a comment to a video.',
						fields: [
							{
								name: 'videoId',
								type: 'text',
								required: true,
								placeholder: 'Enter video ID',
								urlParam: true,
							},
							{
								name: 'content',
								type: 'textarea',
								required: true,
								placeholder: 'Enter comment content',
							},
						],
					},
					'comment-list': {
						name: 'Get Video Comments',
						method: 'GET',
						url: '/api/v1/comments/:videoId',
						auth: false,
						description: 'Get all comments for a video with pagination.',
						fields: [
							{
								name: 'videoId',
								type: 'text',
								required: true,
								placeholder: 'Enter video ID',
								urlParam: true,
							},
							{
								name: 'page',
								type: 'number',
								required: false,
								placeholder: 'Page number (default: 1)',
							},
							{
								name: 'limit',
								type: 'number',
								required: false,
								placeholder: 'Items per page (default: 10)',
							},
						],
					},
					'comment-update': {
						name: 'Update Comment',
						method: 'PATCH',
						url: '/api/v1/comments/id/:commentId',
						auth: true,
						description: 'Update comment content.',
						fields: [
							{
								name: 'commentId',
								type: 'text',
								required: true,
								placeholder: 'Enter comment ID',
								urlParam: true,
							},
							{
								name: 'content',
								type: 'textarea',
								required: true,
								placeholder: 'Enter new comment content',
							},
						],
					},
					'comment-delete': {
						name: 'Delete Comment',
						method: 'DELETE',
						url: '/api/v1/comments/id/:commentId',
						auth: true,
						description: 'Delete a comment by ID.',
						fields: [
							{
								name: 'commentId',
								type: 'text',
								required: true,
								placeholder: 'Enter comment ID',
								urlParam: true,
							},
						],
					},
				},
			},
			likes: {
				name: 'Like Management',
				icon: 'fas fa-heart',
				routes: {
					'like-video': {
						name: 'Toggle Video Like',
						method: 'POST',
						url: '/api/v1/likes/toggle/video/:videoId',
						auth: true,
						description: 'Toggle like status for a video.',
						fields: [
							{
								name: 'videoId',
								type: 'text',
								required: true,
								placeholder: 'Enter video ID',
								urlParam: true,
							},
						],
					},
					'like-comment': {
						name: 'Toggle Comment Like',
						method: 'POST',
						url: '/api/v1/likes/toggle/comment/:commentId',
						auth: true,
						description: 'Toggle like status for a comment.',
						fields: [
							{
								name: 'commentId',
								type: 'text',
								required: true,
								placeholder: 'Enter comment ID',
								urlParam: true,
							},
						],
					},
					'like-tweet': {
						name: 'Toggle Tweet Like',
						method: 'POST',
						url: '/api/v1/likes/toggle/tweet/:tweetId',
						auth: true,
						description: 'Toggle like status for a tweet.',
						fields: [
							{
								name: 'tweetId',
								type: 'text',
								required: true,
								placeholder: 'Enter tweet ID',
								urlParam: true,
							},
						],
					},
					'like-list': {
						name: 'Get Liked Videos',
						method: 'GET',
						url: '/api/v1/likes/videos',
						auth: true,
						description: 'Get all videos liked by the current user.',
						fields: [
							{
								name: 'page',
								type: 'number',
								required: false,
								placeholder: 'Page number (default: 1)',
							},
							{
								name: 'limit',
								type: 'number',
								required: false,
								placeholder: 'Items per page (default: 10)',
							},
						],
					},
				},
			},
			subscriptions: {
				name: 'Subscription Management',
				icon: 'fas fa-bell',
				routes: {
					'subscription-toggle': {
						name: 'Toggle Subscription',
						method: 'POST',
						url: '/api/v1/subscriptions/channel/:channelId',
						auth: true,
						description: 'Toggle subscription to a channel.',
						fields: [
							{
								name: 'channelId',
								type: 'text',
								required: true,
								placeholder: 'Enter channel ID',
								urlParam: true,
							},
						],
					},
					'subscription-count': {
						name: 'Get Subscriber Count',
						method: 'GET',
						url: '/api/v1/subscriptions/channel/:channelId',
						auth: false,
						description: 'Get subscriber count for a channel.',
						fields: [
							{
								name: 'channelId',
								type: 'text',
								required: true,
								placeholder: 'Enter channel ID',
								urlParam: true,
							},
						],
					},
					'subscription-subscribers': {
						name: 'Get Channel Subscribers',
						method: 'GET',
						url: '/api/v1/subscriptions/subscribers/:channelId',
						auth: true,
						description: 'Get list of subscribers for a channel (channel owner only).',
						fields: [
							{
								name: 'channelId',
								type: 'text',
								required: true,
								placeholder: 'Enter channel ID',
								urlParam: true,
							},
							{
								name: 'page',
								type: 'number',
								required: false,
								placeholder: 'Page number (default: 1)',
							},
							{
								name: 'limit',
								type: 'number',
								required: false,
								placeholder: 'Items per page (default: 10, max: 100)',
							},
						],
					},
					'subscription-subscribed': {
						name: 'Get Subscribed Channels',
						method: 'GET',
						url: '/api/v1/subscriptions',
						auth: true,
						description: 'Get list of channels the user is subscribed to.',
						fields: [
							{
								name: 'page',
								type: 'number',
								required: false,
								placeholder: 'Page number (default: 1)',
							},
							{
								name: 'limit',
								type: 'number',
								required: false,
								placeholder: 'Items per page (default: 10, max: 100)',
							},
						],
					},
				},
			},
			tweets: {
				name: 'Tweet Management',
				icon: 'fas fa-twitter',
				routes: {
					'tweet-create': {
						name: 'Create Tweet',
						method: 'POST',
						url: '/api/v1/tweets',
						auth: true,
						description: 'Create a new tweet.',
						fields: [
							{
								name: 'content',
								type: 'textarea',
								required: true,
								placeholder: 'Enter tweet content',
							},
						],
					},
					'tweet-user': {
						name: 'Get User Tweets',
						method: 'GET',
						url: '/api/v1/tweets/user/:userId',
						auth: false,
						description: 'Get all tweets by a specific user.',
						fields: [
							{
								name: 'userId',
								type: 'text',
								required: true,
								placeholder: 'Enter user ID',
								urlParam: true,
							},
						],
					},
					'tweet-update': {
						name: 'Update Tweet',
						method: 'PATCH',
						url: '/api/v1/tweets/:tweetId',
						auth: true,
						description: 'Update tweet content.',
						fields: [
							{
								name: 'tweetId',
								type: 'text',
								required: true,
								placeholder: 'Enter tweet ID',
								urlParam: true,
							},
							{
								name: 'content',
								type: 'textarea',
								required: true,
								placeholder: 'Enter new tweet content',
							},
						],
					},
					'tweet-delete': {
						name: 'Delete Tweet',
						method: 'DELETE',
						url: '/api/v1/tweets/:tweetId',
						auth: true,
						description: 'Delete a tweet by ID.',
						fields: [
							{
								name: 'tweetId',
								type: 'text',
								required: true,
								placeholder: 'Enter tweet ID',
								urlParam: true,
							},
						],
					},
				},
			},
			dashboard: {
				name: 'Dashboard',
				icon: 'fas fa-chart-line',
				routes: {
					'dashboard-stats': {
						name: 'Get Channel Stats',
						method: 'GET',
						url: '/api/v1/dashboard/stats',
						auth: true,
						description:
							'Get channel statistics including total videos, views, subscribers, and likes.',
						fields: [],
					},
					'dashboard-videos': {
						name: 'Get Channel Videos',
						method: 'GET',
						url: '/api/v1/dashboard/videos',
						auth: true,
						description: 'Get all videos uploaded by the current user.',
						fields: [],
					},
				},
			},
			health: {
				name: 'Health Check',
				icon: 'fas fa-heartbeat',
				routes: {
					'health-check': {
						name: 'Health Check',
						method: 'GET',
						url: '/api/v1/health-check',
						auth: false,
						description: 'Check API server health status.',
						fields: [],
					},
				},
			},
		}
	}

	setupEventListeners() {
		// Sidebar toggle
		document.getElementById('sidebarToggle')?.addEventListener('click', () => {
			this.toggleSidebar()
		})

		// Mobile hamburger menu
		this.setupMobileMenu()

		// Theme toggle
		document.getElementById('themeToggle')?.addEventListener('click', () => {
			this.toggleTheme()
		})

		// Search functionality
		const searchInput = document.getElementById('searchInput')
		searchInput?.addEventListener('input', e => {
			this.handleSearch(e.target.value)
		})

		// Search clear
		document.getElementById('searchClear')?.addEventListener('click', () => {
			this.clearSearch()
		})

		// Auth button - use event delegation since ID changes dynamically
		document.addEventListener('click', e => {
			if (e.target.closest('#authBtn')) {
				const authBtn = e.target.closest('#authBtn')
				if (authBtn.id === 'loginBtn' || authBtn.classList.contains('login-btn')) {
					this.showAuthModal('login')
				} else if (authBtn.id === 'logoutBtn' || authBtn.classList.contains('logout-btn')) {
					this.logout()
				}
			}
		})

		// Help button
		document.getElementById('helpBtn')?.addEventListener('click', () => {
			this.showHelpModal()
		})

		// Navigation items
		this.setupNavigationListeners()

		// Modal close events
		document.addEventListener('click', e => {
			if (e.target.classList.contains('modal-overlay')) {
				this.closeModal()
			}
		})

		// Form submission
		document.getElementById('apiForm')?.addEventListener('submit', e => {
			e.preventDefault()
			this.submitForm()
		})

		// Response actions
		document.getElementById('copyResponse')?.addEventListener('click', () => {
			this.copyResponse()
		})

		document.getElementById('clearResponse')?.addEventListener('click', () => {
			this.clearResponse()
		})

		// Response panel buttons (new IDs from EJS)
		document.getElementById('copyResponseBtn')?.addEventListener('click', () => {
			this.copyResponse()
		})

		document.getElementById('clearResponseBtn')?.addEventListener('click', () => {
			this.clearResponse()
		})

		// Header action buttons
		document.getElementById('copyUrlBtn')?.addEventListener('click', () => {
			this.copyEndpointUrl()
		})

		document.getElementById('exportBtn')?.addEventListener('click', () => {
			this.copyCurlCommand()
		})

		document.getElementById('githubBtn')?.addEventListener('click', () => {
			window.open('https://github.com/SayanBanerjee-007/youtube-clone-backend-api', '_blank')
		})

		// Form action buttons
		document.getElementById('clearBtn')?.addEventListener('click', () => {
			this.resetForm()
		})

		document.getElementById('fillExampleBtn')?.addEventListener('click', () => {
			this.fillExampleData()
		})

		// Folder toggle events
		document.addEventListener('click', e => {
			if (e.target.closest('.folder-header')) {
				const folder = e.target.closest('.nav-folder')
				this.toggleFolder(folder)
			}
		})
	}

	setupNavigationListeners() {
		// Add click listeners to all navigation items
		const navItems = document.querySelectorAll('.nav-item')

		navItems.forEach(item => {
			const endpointName = item.getAttribute('data-endpoint')

			item.addEventListener('click', e => {
				e.preventDefault()
				e.stopPropagation()

				if (endpointName) {
					this.loadEndpointByName(endpointName)
				}
			})
		})
	}

	setupTheme() {
		// Remove old theme classes
		document.documentElement.classList.remove('theme-light', 'theme-dark')
		document.body.classList.remove('theme-light', 'theme-dark')

		// Set theme on both html and body elements
		document.documentElement.setAttribute('data-theme', this.state.theme)
		document.body.setAttribute('data-theme', this.state.theme)

		// Add theme class
		document.documentElement.classList.add(`theme-${this.state.theme}`)
		document.body.classList.add(`theme-${this.state.theme}`)

		this.updateThemeIcon()
	}

	setupSidebar() {
		const sidebar = document.getElementById('sidebar')
		if (this.state.sidebarCollapsed) {
			sidebar?.classList.add('collapsed')
		}
	}

	setupKeyboardShortcuts() {
		document.addEventListener('keydown', e => {
			// Ctrl/Cmd + B: Toggle sidebar
			if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
				e.preventDefault()
				this.toggleSidebar()
			}

			// Ctrl/Cmd + Shift + X: Toggle theme
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'X') {
				e.preventDefault()
				this.toggleTheme()
			}

			// Ctrl/Cmd + K: Focus search
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault()
				document.getElementById('searchInput')?.focus()
			}

			// Escape: Close modals
			if (e.key === 'Escape') {
				this.closeModal()
			}

			// Ctrl/Cmd + Enter: Submit form
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault()
				this.submitForm()
			}
		})
	}

	setupMobileMenu() {
		// Create mobile hamburger button if it doesn't exist
		this.createMobileHamburger()

		// Handle hamburger click
		document.addEventListener('click', e => {
			if (e.target.closest('.mobile-hamburger') || e.target.closest('.content-header::before')) {
				this.toggleMobileSidebar()
			}
		})

		// Handle clicks outside sidebar to close it on mobile
		document.addEventListener('click', e => {
			const sidebar = document.getElementById('sidebar')
			const hamburger = document.querySelector('.mobile-hamburger')

			if (
				window.innerWidth <= 767 &&
				sidebar?.classList.contains('open') &&
				!sidebar.contains(e.target) &&
				!hamburger?.contains(e.target)
			) {
				this.closeMobileSidebar()
			}
		})

		// Handle window resize
		window.addEventListener('resize', () => {
			this.handleWindowResize()
		})

		// Handle escape key to close mobile sidebar
		document.addEventListener('keydown', e => {
			if (e.key === 'Escape' && window.innerWidth <= 767) {
				this.closeMobileSidebar()
			}
		})
	}

	createMobileHamburger() {
		// Check if hamburger already exists
		if (document.querySelector('.mobile-hamburger')) return

		const contentHeader = document.querySelector('.content-header')
		if (!contentHeader) return

		const hamburger = document.createElement('button')
		hamburger.className = 'mobile-hamburger'
		hamburger.innerHTML = '<i class="fas fa-bars"></i>'
		hamburger.setAttribute('aria-label', 'Open navigation menu')

		// Insert at the beginning of content header
		contentHeader.insertBefore(hamburger, contentHeader.firstChild)
	}

	toggleMobileSidebar() {
		const sidebar = document.getElementById('sidebar')
		if (!sidebar) return

		const isOpen = sidebar.classList.contains('open')

		if (isOpen) {
			this.closeMobileSidebar()
		} else {
			this.openMobileSidebar()
		}
	}

	openMobileSidebar() {
		const sidebar = document.getElementById('sidebar')
		const overlay = this.createMobileOverlay()

		if (sidebar) {
			sidebar.classList.add('open')
			document.body.style.overflow = 'hidden' // Prevent background scrolling
		}

		if (overlay) {
			overlay.classList.add('show')
		}
	}

	closeMobileSidebar() {
		const sidebar = document.getElementById('sidebar')
		const overlay = document.querySelector('.mobile-sidebar-overlay')

		if (sidebar) {
			sidebar.classList.remove('open')
			document.body.style.overflow = '' // Restore scrolling
		}

		if (overlay) {
			overlay.classList.remove('show')
			setTimeout(() => overlay.remove(), 300)
		}
	}

	createMobileOverlay() {
		// Check if overlay already exists
		let overlay = document.querySelector('.mobile-sidebar-overlay')
		if (overlay) return overlay

		overlay = document.createElement('div')
		overlay.className = 'mobile-sidebar-overlay'
		overlay.addEventListener('click', () => this.closeMobileSidebar())

		document.body.appendChild(overlay)
		return overlay
	}

	handleWindowResize() {
		const sidebar = document.getElementById('sidebar')

		// Close mobile sidebar when switching to desktop view
		if (window.innerWidth > 767) {
			this.closeMobileSidebar()
			if (sidebar) {
				sidebar.classList.remove('open')
			}
		}

		// Update response panel visibility
		this.updateResponsePanelVisibility()
	}

	setupMobileResponsive() {
		// Handle initial load
		this.updateResponsePanelVisibility()
		this.setupMobileResponseToggle()
	}

	updateResponsePanelVisibility() {
		const responsePanel = document.querySelector('.response-panel')
		if (!responsePanel) return

		if (window.innerWidth <= 767) {
			// Hide response panel on mobile by default
			responsePanel.style.display = 'none'
			this.createMobileResponseToggle()
		} else {
			// Show response panel on desktop
			responsePanel.style.display = 'flex'
			this.removeMobileResponseToggle()
		}
	}

	createMobileResponseToggle() {
		// Check if toggle already exists
		if (document.querySelector('.mobile-response-toggle')) return

		const formActions = document.querySelector('.form-actions')
		if (!formActions) return

		const toggleBtn = document.createElement('button')
		toggleBtn.className = 'btn btn-outline mobile-response-toggle'
		toggleBtn.innerHTML = '<i class="fas fa-eye"></i> <span>View Response</span>'
		toggleBtn.type = 'button'

		toggleBtn.addEventListener('click', () => {
			this.toggleMobileResponse()
		})

		formActions.appendChild(toggleBtn)
	}

	removeMobileResponseToggle() {
		const toggle = document.querySelector('.mobile-response-toggle')
		if (toggle) {
			toggle.remove()
		}
	}

	toggleMobileResponse() {
		const responsePanel = document.querySelector('.response-panel')
		const mainContent = document.querySelector('.main-content')
		const toggleBtn = document.querySelector('.mobile-response-toggle')

		if (!responsePanel || !toggleBtn) return

		const isVisible = responsePanel.style.display !== 'none'

		if (isVisible) {
			// Hide response panel
			responsePanel.style.display = 'none'
			mainContent?.classList.remove('response-visible')
			toggleBtn.innerHTML = '<i class="fas fa-eye"></i> <span>View Response</span>'
		} else {
			// Show response panel
			responsePanel.style.display = 'flex'
			mainContent?.classList.add('response-visible')
			toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> <span>Hide Response</span>'

			// Scroll to response panel
			responsePanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	}

	setupMobileResponseToggle() {
		// Update toggle button when response changes
		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				if (
					mutation.target.classList.contains('response-content') ||
					mutation.target.classList.contains('response-status')
				) {
					this.updateMobileResponseToggle()
				}
			})
		})

		const responseContent = document.querySelector('.response-content')
		const responseStatus = document.querySelector('.response-status')

		if (responseContent) {
			observer.observe(responseContent, { childList: true, subtree: true })
		}
		if (responseStatus) {
			observer.observe(responseStatus, { childList: true, subtree: true })
		}
	}

	updateMobileResponseToggle() {
		const toggleBtn = document.querySelector('.mobile-response-toggle')
		const responseContent = document.querySelector('.response-content')

		if (!toggleBtn || !responseContent) return

		const hasResponse = !responseContent.querySelector('.response-placeholder')

		if (hasResponse) {
			toggleBtn.style.display = 'inline-flex'
			toggleBtn.classList.add('has-response')
		} else {
			toggleBtn.style.display = 'none'
			toggleBtn.classList.remove('has-response')
		}
	}

	updateAuthStatus() {
		const statusIndicator = document.querySelector('.status-indicator')
		const authBtn = document.getElementById('authBtn')

		// Check for auth token in localStorage or cookies
		const accessTokenFromCookie = this.getCookie('																																																														')
		const authTokenExists = this.state.authToken || accessTokenFromCookie

		// Update state if token found in cookies but not in localStorage
		if (accessTokenFromCookie && !this.state.authToken) {
			this.state.authToken = accessTokenFromCookie
			this.state.isAuthenticated = true
			localStorage.setItem('authToken', accessTokenFromCookie)
		}

		// Check if we have a stored token and update the authenticated state
		if (authTokenExists && !this.state.isAuthenticated) {
			this.state.isAuthenticated = true
		}

		if (this.state.isAuthenticated && authTokenExists) {
			statusIndicator?.classList.add('authenticated')
			if (statusIndicator?.querySelector('span')) {
				statusIndicator.querySelector('span').textContent = 'Authenticated'
			}
			if (authBtn) {
				authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>'
				authBtn.className = 'auth-btn logout-btn'
				authBtn.title = 'Logout'
			}
		} else {
			statusIndicator?.classList.remove('authenticated')
			if (statusIndicator?.querySelector('span')) {
				statusIndicator.querySelector('span').textContent = 'Not Authenticated'
			}
			if (authBtn) {
				authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>'
				authBtn.className = 'auth-btn login-btn'
				authBtn.title = 'Login'
			}
		}
	}

	hideLoadingScreen() {
		setTimeout(() => {
			const loadingScreen = document.getElementById('loadingScreen')
			loadingScreen?.classList.add('hidden')
		}, 1000)
	}

	restoreState() {
		// Restore folder states
		const folderStates = JSON.parse(localStorage.getItem('folderStates') || '{}')
		document.querySelectorAll('.nav-folder').forEach(folder => {
			const folderId = folder.getAttribute('data-section')
			if (folderStates[folderId] !== undefined) {
				folder.classList.toggle('expanded', folderStates[folderId])
			}
		})

		// Restore last selected endpoint
		const lastEndpoint = localStorage.getItem('lastEndpoint')
		if (lastEndpoint && this.findEndpointById(lastEndpoint)) {
			this.loadEndpoint(lastEndpoint)
		} else {
			// Load default endpoint
			this.loadEndpoint('auth-register')
		}
	}

	toggleSidebar() {
		const sidebar = document.getElementById('sidebar')
		this.state.sidebarCollapsed = !this.state.sidebarCollapsed

		sidebar?.classList.toggle('collapsed', this.state.sidebarCollapsed)
		localStorage.setItem('sidebarCollapsed', this.state.sidebarCollapsed)
	}

	toggleTheme() {
		this.state.theme = this.state.theme === 'light' ? 'dark' : 'light'

		// Remove old theme classes and add new ones
		document.documentElement.classList.remove('theme-light', 'theme-dark')
		document.body.classList.remove('theme-light', 'theme-dark')

		// Set the data-theme attribute on multiple elements for better compatibility
		document.documentElement.setAttribute('data-theme', this.state.theme)
		document.body.setAttribute('data-theme', this.state.theme)

		// Add theme class as well
		document.documentElement.classList.add(`theme-${this.state.theme}`)
		document.body.classList.add(`theme-${this.state.theme}`)

		localStorage.setItem('theme', this.state.theme)
		this.updateThemeIcon()

		// Force multiple repaints to ensure changes are applied
		document.body.offsetHeight
		document.documentElement.style.display = 'none'
		document.documentElement.offsetHeight
		document.documentElement.style.display = ''

		// Debug logging
		console.log('Theme changed to:', this.state.theme)
		console.log('HTML data-theme:', document.documentElement.getAttribute('data-theme'))
		console.log('Body data-theme:', document.body.getAttribute('data-theme'))
		console.log(
			'CSS bg-primary:',
			getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')
		)
	}

	updateThemeIcon() {
		const themeIcon = document.querySelector('#themeToggle i')
		const themeText = document.querySelector('#themeToggle .theme-text')

		if (themeIcon) {
			themeIcon.className = this.state.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'
		}

		if (themeText) {
			themeText.textContent = this.state.theme === 'light' ? 'Dark Mode' : 'Light Mode'
		}
	}

	toggleFolder(folder) {
		const isExpanded = folder.classList.contains('expanded')
		folder.classList.toggle('expanded', !isExpanded)

		// Save folder state
		const folderId = folder.getAttribute('data-section')
		const folderStates = JSON.parse(localStorage.getItem('folderStates') || '{}')
		folderStates[folderId] = !isExpanded
		localStorage.setItem('folderStates', JSON.stringify(folderStates))
	}

	handleSearch(term) {
		this.state.searchTerm = term.toLowerCase()

		// Clear previous timeout
		if (this.state.searchTimeout) {
			clearTimeout(this.state.searchTimeout)
		}

		// Debounce search
		this.state.searchTimeout = setTimeout(() => {
			this.filterNavigation()
		}, 300)
	}

	clearSearch() {
		const searchInput = document.getElementById('searchInput')
		if (searchInput) {
			searchInput.value = ''
			this.state.searchTerm = ''
			this.filterNavigation()
		}
	}

	filterNavigation() {
		const navItems = document.querySelectorAll('.nav-item')
		const navFolders = document.querySelectorAll('.nav-folder')

		if (!this.state.searchTerm) {
			// Show all items
			navItems.forEach(item => (item.style.display = 'flex'))
			navFolders.forEach(folder => (folder.style.display = 'block'))
			return
		}

		// Filter items
		navItems.forEach(item => {
			const text = item.textContent.toLowerCase()
			const matches = text.includes(this.state.searchTerm)
			item.style.display = matches ? 'flex' : 'none'
		})

		// Show/hide folders based on visible items
		navFolders.forEach(folder => {
			const visibleItems = folder.querySelectorAll('.nav-item[style*="flex"]')
			folder.style.display = visibleItems.length > 0 ? 'block' : 'none'
		})
	}

	loadEndpoint(endpointId) {
		const endpoint = this.findEndpointById(endpointId)
		if (!endpoint) return

		this.state.currentEndpoint = endpointId
		localStorage.setItem('lastEndpoint', endpointId)

		// Update active navigation item
		document.querySelectorAll('.nav-item').forEach(item => {
			item.classList.remove('active')
		})
		const activeNavItem = document.querySelector(`[data-endpoint="${endpointId}"]`)
		activeNavItem?.classList.add('active')

		// Update breadcrumb
		this.updateBreadcrumb(endpoint)

		// Load form
		this.loadForm(endpoint)

		// Clear response
		this.clearResponse()
	}

	loadEndpointByName(endpointName) {
		// Check if endpointName exists directly in endpoints
		const endpoint = this.findEndpointById(endpointName)
		if (endpoint) {
			this.loadEndpoint(endpointName)
		} else {
			console.warn('Endpoint not found:', endpointName)
		}
	}

	getEndpointNameFromId(endpointId) {
		// Since we now use consistent IDs, just return the ID
		return endpointId
	}

	findEndpointById(id) {
		for (const category of Object.values(this.endpoints)) {
			if (category.routes[id]) {
				return category.routes[id]
			}
		}
		return null
	}

	updateBreadcrumb(endpoint) {
		const breadcrumb = document.querySelector('.breadcrumb')
		if (breadcrumb) {
			const categoryName = this.findCategoryName(endpoint)
			breadcrumb.innerHTML = `
        <span class="breadcrumb-item">API</span>
        <i class="fas fa-chevron-right"></i>
        <span class="breadcrumb-item">${categoryName}</span>
        <i class="fas fa-chevron-right"></i>
        <span class="breadcrumb-item current">${endpoint.name}</span>
      `
		}
	}

	findCategoryName(endpoint) {
		for (const [categoryId, category] of Object.entries(this.endpoints)) {
			for (const route of Object.values(category.routes)) {
				if (route === endpoint) {
					return category.name
				}
			}
		}
		return 'Unknown'
	}

	loadForm(endpoint) {
		const formContainer = document.querySelector('.form-container')
		if (!formContainer) return

		// Special handling for delete account endpoint
		if (this.state.currentEndpoint === 'user-delete-account') {
			this.loadDeleteAccountForm(endpoint)
			return
		}

		formContainer.innerHTML = `
      <div class="endpoint-info fade-in-up">
        <div class="endpoint-header">
          <div class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</div>
          <div class="endpoint-url">${endpoint.url}</div>
          <div class="auth-badge ${endpoint.auth ? 'private' : 'public'}">
            ${endpoint.auth ? 'Private' : 'Public'}
          </div>
        </div>
        <p class="endpoint-description">${endpoint.description}</p>
      </div>

      <div class="form-content fade-in-up">
        <form id="apiForm" class="api-form">
          ${this.generateFormFields(endpoint)}
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" id="submitBtn">
              <i class="fas fa-paper-plane"></i>
              <span>Send Request</span>
            </button>
            <button type="button" class="btn btn-secondary" id="resetBtn">
              <i class="fas fa-undo"></i>
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>
    `

		// Setup form event listeners
		this.setupFormListeners()
	}

	loadDeleteAccountForm(endpoint) {
		const formContainer = document.querySelector('.form-container')
		if (!formContainer) return

		formContainer.innerHTML = `
      <div class="endpoint-info fade-in-up">
        <div class="endpoint-header">
          <div class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</div>
          <div class="endpoint-url">${endpoint.url}</div>
          <div class="auth-badge ${endpoint.auth ? 'private' : 'public'}">
            ${endpoint.auth ? 'Private' : 'Public'}
          </div>
        </div>
        <p class="endpoint-description">${endpoint.description}</p>
      </div>

      <div class="form-content fade-in-up">
        <!-- Danger Warning Section -->
        <div class="danger-warning" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h4 style="color: var(--color-error); margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; font-size: 18px;">
            <i class="fas fa-exclamation-triangle"></i>
            Permanent Account Deletion
          </h4>
          <p style="margin: 0 0 16px 0; color: var(--text-primary); font-weight: 500; font-size: 16px;">
            ⚠️ This action is <strong>IRREVERSIBLE</strong> and will permanently delete your account and all associated data.
          </p>
          <div style="margin-bottom: 16px;">
            <h5 style="color: var(--color-error); margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
              Data that will be permanently deleted:
            </h5>
            <ul style="margin: 0; padding-left: 24px; color: var(--text-secondary); font-size: 14px;">
              <li>Your user profile and account information</li>
              <li>All uploaded videos and thumbnails</li>
              <li>All comments you've made</li>
              <li>All tweets/posts you've created</li>
              <li>All playlists you've created</li>
              <li>All likes and subscriptions</li>
              <li>All stored media files on Cloudinary</li>
            </ul>
          </div>
          <p style="margin: 0; color: var(--color-error); font-weight: 600; font-size: 14px;">
            💀 Once deleted, this data cannot be recovered by any means.
          </p>
        </div>

        <style>
          [data-theme='dark'] .danger-warning {
            background-color: #450a0a !important;
            border-color: #7f1d1d !important;
          }
          .btn-danger {
            background-color: var(--color-error);
            color: white;
            border: none;
            transition: all var(--transition-fast);
          }
          .btn-danger:hover:not(:disabled) {
            background-color: #dc2626;
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
          }
          .btn-danger:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
        </style>

        <form id="apiForm" class="api-form">
          <div class="form-section">
            <h4 style="margin-bottom: 1rem; color: var(--text-primary);">
              <i class="fas fa-key"></i> Confirmation Required
            </h4>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">
                  Current Password <span class="required">*</span>
                </label>
                <input type="password" class="form-input" name="password" placeholder="Enter your current password to confirm" required>
                <p class="form-help">Enter your account password to verify your identity before deletion.</p>
              </div>
            </div>

            <div style="margin: 24px 0;">
              <label class="checkbox-container" style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
                <input type="checkbox" id="confirmUnderstand" required style="margin-top: 2px; accent-color: var(--color-error);">
                <span style="font-size: 14px; line-height: 1.4; color: var(--text-primary);">
                  I understand that this action is permanent and irreversible. I acknowledge that all my data including videos, comments, playlists, and account information will be permanently deleted and cannot be recovered.
                </span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-danger" id="submitBtn" disabled style="background-color: var(--color-error); color: white; border: none;">
              <i class="fas fa-trash-alt"></i>
              <span>Permanently Delete My Account</span>
            </button>
            <button type="button" class="btn btn-secondary" id="resetBtn">
              <i class="fas fa-undo"></i>
              <span>Reset Form</span>
            </button>
          </div>
        </form>
      </div>
    `

		// Setup form event listeners with special handling for delete account
		this.setupDeleteAccountFormListeners()
	}

	setupDeleteAccountFormListeners() {
		const passwordInput = document.querySelector('input[name="password"]')
		const checkbox = document.getElementById('confirmUnderstand')
		const submitBtn = document.getElementById('submitBtn')
		const resetBtn = document.getElementById('resetBtn')

		// Validate form and enable/disable submit button
		const validateForm = () => {
			const hasPassword = passwordInput.value.trim().length > 0
			const isChecked = checkbox.checked
			submitBtn.disabled = !(hasPassword && isChecked)
		}

		// Add event listeners
		passwordInput.addEventListener('input', validateForm)
		checkbox.addEventListener('change', validateForm)

		// Reset button
		resetBtn.addEventListener('click', () => {
			passwordInput.value = ''
			checkbox.checked = false
			submitBtn.disabled = true
		})

		// Form submission
		document.getElementById('apiForm').addEventListener('submit', async e => {
			e.preventDefault()

			// Check authentication
			if (!this.state.isAuthenticated) {
				this.showNotification('Please login first to delete your account.', 'warning')
				return
			}

			const password = passwordInput.value.trim()

			if (!password) {
				this.showNotification('Please enter your password.', 'error')
				return
			}

			if (!checkbox.checked) {
				this.showNotification(
					'Please confirm that you understand this action is irreversible.',
					'error'
				)
				return
			}

			// Disable button and show loading
			submitBtn.disabled = true
			submitBtn.innerHTML =
				'<i class="fas fa-spinner fa-spin"></i> <span>Deleting Account...</span>'

			try {
				const response = await fetch('/api/v1/users/delete-account', {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: this.state.authToken ? `Bearer ${this.state.authToken}` : '',
					},
					credentials: 'include',
					body: JSON.stringify({ password }),
				})

				const data = await response.json()

				// Show response
				this.showResponse(response, data, 0)

				if (response.ok) {
					// Account deleted successfully
					this.showNotification('Account deleted successfully. You will be redirected.', 'success')

					// Clear auth state
					this.state.isAuthenticated = false
					this.state.authToken = null
					this.state.userId = null
					localStorage.removeItem('authToken')
					localStorage.removeItem('userId')

					// Update UI
					this.updateAuthStatus()

					// Redirect after a delay
					setTimeout(() => {
						window.location.reload()
					}, 3000)
				} else {
					// Show error notification
					this.showNotification(
						data.message || 'Failed to delete account. Please try again.',
						'error'
					)
				}
			} catch (error) {
				console.error('Delete account error:', error)
				this.showNotification('Network error. Please try again.', 'error')
				this.showResponse(null, { error: error.message }, 0)
			} finally {
				// Re-enable button
				submitBtn.disabled = false
				submitBtn.innerHTML =
					'<i class="fas fa-trash-alt"></i> <span>Permanently Delete My Account</span>'
			}
		})
	}

	generateFormFields(endpoint) {
		if (!endpoint.fields || endpoint.fields.length === 0) {
			return '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No parameters required for this endpoint.</p>'
		}

		const urlParams = endpoint.fields.filter(field => field.urlParam)
		const bodyParams = endpoint.fields.filter(field => !field.urlParam)

		let html = ''

		if (urlParams.length > 0) {
			html += `
        <div class="form-section">
          <h4 style="margin-bottom: 1rem; color: var(--text-primary);">
            <i class="fas fa-link"></i> URL Parameters
          </h4>
          <div class="form-grid">
            ${urlParams.map(field => this.generateField(field)).join('')}
          </div>
        </div>
      `
		}

		if (bodyParams.length > 0) {
			html += `
        <div class="form-section">
          <h4 style="margin-bottom: 1rem; color: var(--text-primary);">
            <i class="fas fa-database"></i> Request Body
          </h4>
          <div class="form-grid">
            ${bodyParams.map(field => this.generateField(field)).join('')}
          </div>
        </div>
      `
		}

		return html
	}

	generateField(field) {
		const required = field.required ? 'required' : ''
		const requiredMark = field.required ? '<span class="required">*</span>' : ''

		let input = ''

		switch (field.type) {
			case 'textarea':
				input = `<textarea class="form-textarea" name="${field.name}" placeholder="${field.placeholder}" ${required}></textarea>`
				break
			case 'file':
				input = `<input type="file" class="form-file" name="${field.name}" accept="${
					field.accept || ''
				}" ${required}>`
				break
			case 'select':
				const options = field.options || []
				input = `
          <select class="form-select" name="${field.name}" ${required}>
            <option value="">${field.placeholder}</option>
            ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
          </select>
        `
				break
			default:
				input = `<input type="${field.type}" class="form-input" name="${field.name}" placeholder="${field.placeholder}" ${required}>`
		}

		return `
      <div class="form-group">
        <label class="form-label">
          ${field.name}${requiredMark}
        </label>
        ${input}
        ${field.help ? `<p class="form-help">${field.help}</p>` : ''}
      </div>
    `
	}

	setupFormListeners() {
		// Form submission
		document.getElementById('apiForm')?.addEventListener('submit', e => {
			e.preventDefault()
			this.submitForm()
		})

		// Reset button
		document.getElementById('resetBtn')?.addEventListener('click', () => {
			this.resetForm()
		})
	}

	async submitForm() {
		const endpoint = this.findEndpointById(this.state.currentEndpoint)
		if (!endpoint) return

		const form = document.getElementById('apiForm')
		const submitBtn = document.getElementById('submitBtn')
		const formData = new FormData(form)

		// Check if auth is required
		if (endpoint.auth && !this.state.authToken) {
			this.showToast('error', 'Authentication Required', 'Please login to access this endpoint')
			return
		}

		// Disable submit button and show loading
		submitBtn.disabled = true
		submitBtn.innerHTML = `
      <div class="spinner-small"></div>
      <span>Sending...</span>
    `

		try {
			// Build URL with parameters
			let url = endpoint.url
			const urlParams = endpoint.fields.filter(field => field.urlParam)

			urlParams.forEach(param => {
				const value = formData.get(param.name)
				if (value) {
					url = url.replace(`:${param.name}`, encodeURIComponent(value))
				}
			})

			// Prepare request options
			const options = {
				method: endpoint.method,
				headers: {},
			}

			// Add auth header if required
			if (endpoint.auth && this.state.authToken) {
				options.headers['Authorization'] = `Bearer ${this.state.authToken}`
			}

			// Handle request body
			if (endpoint.method !== 'GET' && endpoint.method !== 'DELETE') {
				const bodyParams = endpoint.fields.filter(field => !field.urlParam)
				const hasFileField = bodyParams.some(field => field.type === 'file')

				if (hasFileField) {
					// Use FormData for file uploads
					const bodyFormData = new FormData()
					bodyParams.forEach(param => {
						const value = formData.get(param.name)
						if (value) {
							bodyFormData.append(param.name, value)
						}
					})
					options.body = bodyFormData
				} else {
					// Use JSON for regular data
					const jsonData = {}
					bodyParams.forEach(param => {
						const value = formData.get(param.name)
						if (value) {
							jsonData[param.name] = value
						}
					})
					options.headers['Content-Type'] = 'application/json'
					options.body = JSON.stringify(jsonData)
				}
			}

			// Add query parameters for GET requests
			if (endpoint.method === 'GET') {
				const queryParams = endpoint.fields.filter(field => !field.urlParam)
				const urlParams = new URLSearchParams()

				queryParams.forEach(param => {
					const value = formData.get(param.name)
					if (value) {
						urlParams.append(param.name, value)
					}
				})

				if (urlParams.toString()) {
					url += (url.includes('?') ? '&' : '?') + urlParams.toString()
				}
			}

			// Make request
			const startTime = Date.now()
			const response = await fetch(url, options)
			const endTime = Date.now()
			const responseTime = endTime - startTime

			// Parse response
			let responseData
			const contentType = response.headers.get('content-type')

			if (contentType && contentType.includes('application/json')) {
				responseData = await response.json()
			} else {
				responseData = await response.text()
			}

			// Show response
			this.showResponse(response, responseData, responseTime)

			// Update mobile response toggle
			if (window.innerWidth <= 767) {
				this.updateMobileResponseToggle()
			} // Handle auth responses
			if (this.state.currentEndpoint === 'auth-login' && response.ok) {
				this.handleLoginSuccess(responseData)
			} else if (this.state.currentEndpoint === 'auth-logout' && response.ok) {
				this.handleLogoutSuccess()
			}

			// Show success toast
			if (response.ok) {
				this.showToast('success', 'Request Successful', `${endpoint.method} ${response.status}`)
			} else {
				this.showToast(
					'error',
					'Request Failed',
					`${endpoint.method} ${response.status}: ${response.statusText}`
				)
			}
		} catch (error) {
			console.error('Request error:', error)
			this.showToast('error', 'Request Error', error.message)
			this.showResponse(null, { error: error.message }, 0)
		} finally {
			// Reset submit button
			submitBtn.disabled = false
			submitBtn.innerHTML = `
        <i class="fas fa-paper-plane"></i>
        <span>Send Request</span>
      `
		}
	}

	showResponse(response, data, responseTime) {
		const responseContent = document.querySelector('.response-content')
		const responseStatus = document.querySelector('.response-status')

		if (!responseContent || !responseStatus) return

		// Clear placeholder
		responseContent.innerHTML = ''

		// Show response data
		if (data) {
			const jsonContainer = document.createElement('div')
			jsonContainer.className = 'response-json'

			// Use enhanced JSON formatting
			const formattedJson = this.formatJsonWithSyntaxHighlighting(data)
			jsonContainer.innerHTML = formattedJson

			responseContent.appendChild(jsonContainer)
		}

		// Show response status
		if (response) {
			responseStatus.innerHTML = `
        <div class="status-info">
          <span class="status-code ${response.ok ? 'success' : 'error'}">${response.status}</span>
          <span class="status-text">${response.statusText}</span>
        </div>
        <div class="response-meta">
          <span>Time: ${responseTime}ms</span>
          <span>Size: ${JSON.stringify(data).length} bytes</span>
        </div>
      `
		} else {
			responseStatus.innerHTML = `
        <div class="status-info">
          <span class="status-code error">ERROR</span>
          <span class="status-text">Request Failed</span>
        </div>
      `
		}
	}

	handleLoginSuccess(responseData) {
		if (responseData.data && responseData.data.accessToken) {
			this.state.isAuthenticated = true
			this.state.authToken = responseData.data.accessToken
			this.state.userId = responseData.data.user?._id

			localStorage.setItem('authToken', this.state.authToken)
			localStorage.setItem('userId', this.state.userId)

			this.updateAuthStatus()
			this.showToast('success', 'Login Successful', 'You are now authenticated')
		}
	}

	handleLogoutSuccess() {
		this.logout()
	}

	logout() {
		// Call logout API endpoint first if authenticated
		if (this.state.isAuthenticated && this.state.authToken) {
			fetch('/api/v1/users/logout', {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${this.state.authToken}`,
				},
			}).catch(error => {
				console.log('Logout API call failed, but continuing with frontend logout:', error)
			})
		}

		// Clear state
		this.state.isAuthenticated = false
		this.state.authToken = null
		this.state.userId = null

		// Clear localStorage
		localStorage.removeItem('authToken')
		localStorage.removeItem('userId')

		// Clear cookies from browser - multiple attempts
		this.deleteCookie('accessToken')
		this.deleteCookie('refreshToken')

		// Additional immediate cookie clearing attempt
		setTimeout(() => {
			this.deleteCookie('accessToken')
			this.deleteCookie('refreshToken')
		}, 100)

		// Update UI
		this.updateAuthStatus()
		this.showToast('info', 'Logged Out', 'You have been logged out')

		// Log current cookies for debugging
		console.log('All cookies after logout:', document.cookie)
	}

	// Helper function to delete cookies
	deleteCookie(name) {
		// Multiple strategies to ensure cookie deletion
		const cookieStrings = [
			`${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
			`${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`,
			`${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`,
			`${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`,
			`${name}=; max-age=0; path=/;`,
			`${name}=; max-age=0; path=/; domain=${window.location.hostname};`,
			`${name}=; max-age=0;`,
		]

		// Apply all deletion strategies
		cookieStrings.forEach(cookieString => {
			document.cookie = cookieString
		})

		// Force immediate check and log
		console.log(`Attempting to delete cookie: ${name}`)
		console.log(`Cookie after deletion attempt: ${this.getCookie(name)}`)
	}

	// Helper function to read cookies
	getCookie(name) {
		const value = `; ${document.cookie}`
		const parts = value.split(`; ${name}=`)
		if (parts.length === 2) return parts.pop().split(';').shift()
		return null
	}

	resetForm() {
		const form = document.getElementById('apiForm')
		if (form) {
			form.reset()
		}
	}

	copyResponse() {
		const responseJson = document.querySelector('.response-json')
		if (responseJson) {
			navigator.clipboard
				.writeText(responseJson.textContent)
				.then(() => {
					this.showToast('success', 'Copied', 'Response copied to clipboard')
				})
				.catch(() => {
					this.showToast('error', 'Copy Failed', 'Failed to copy response')
				})
		}
	}

	clearResponse() {
		const responseContent = document.querySelector('.response-content')
		const responseStatus = document.querySelector('.response-status')

		if (responseContent) {
			responseContent.innerHTML = `
        <div class="response-placeholder">
          <i class="fas fa-rocket"></i>
          <h3>No Response Yet</h3>
          <p>Send a request to see the response here</p>
        </div>
      `
		}

		if (responseStatus) {
			responseStatus.innerHTML = ''
		}
	}

	formatJsonWithSyntaxHighlighting(obj) {
		const jsonString = JSON.stringify(obj, null, 2)
		return `<pre style="margin: 0; color: var(--text-primary);">${this.escapeHtml(
			jsonString
		)}</pre>`
	}

	escapeHtml(text) {
		const div = document.createElement('div')
		div.textContent = text
		return div.innerHTML
	}

	copyEndpointUrl() {
		const endpoint = this.findEndpointById(this.state.currentEndpoint)
		if (!endpoint) {
			this.showToast('error', 'No Endpoint', 'No endpoint selected')
			return
		}

		const baseUrl = window.location.origin
		const fullUrl = baseUrl + endpoint.url

		console.log('Copying URL:', fullUrl)
		navigator.clipboard
			.writeText(fullUrl)
			.then(() => {
				this.showToast('success', 'URL Copied', 'Endpoint URL copied to clipboard')
			})
			.catch(() => {
				this.showToast('error', 'Copy Failed', 'Failed to copy URL')
			})
	}

	copyCurlCommand() {
		const endpoint = this.findEndpointById(this.state.currentEndpoint)
		if (!endpoint) {
			this.showToast('error', 'No Endpoint', 'No endpoint selected')
			return
		}

		const form = document.getElementById('apiForm')
		if (!form) return

		const formData = new FormData(form)
		const baseUrl = window.location.origin
		let url = baseUrl + endpoint.url

		// Replace URL parameters
		const urlParams = endpoint.fields?.filter(field => field.urlParam) || []
		urlParams.forEach(param => {
			const value = formData.get(param.name)
			if (value) {
				url = url.replace(`:${param.name}`, encodeURIComponent(value))
			}
		})

		// Build cURL command
		let curlCommand = `curl -X ${endpoint.method} "${url}"`

		// Add headers
		if (endpoint.auth && this.state.authToken) {
			curlCommand += ` \\\n  -H "Authorization: Bearer ${this.state.authToken}"`
		}

		// Handle request body
		if (endpoint.method !== 'GET' && endpoint.method !== 'DELETE') {
			const bodyParams = endpoint.fields?.filter(field => !field.urlParam) || []
			const hasFileField = bodyParams.some(field => field.type === 'file')

			if (hasFileField) {
				// Add multipart form data
				curlCommand += ` \\\n  -H "Content-Type: multipart/form-data"`
				bodyParams.forEach(param => {
					const value = formData.get(param.name)
					if (value) {
						if (param.type === 'file') {
							curlCommand += ` \\\n  -F "${param.name}=@/path/to/your/${param.name}"`
						} else {
							curlCommand += ` \\\n  -F "${param.name}=${value}"`
						}
					}
				})
			} else {
				// Add JSON data
				const jsonData = {}
				bodyParams.forEach(param => {
					const value = formData.get(param.name)
					if (value) {
						jsonData[param.name] = value
					}
				})

				if (Object.keys(jsonData).length > 0) {
					curlCommand += ` \\\n  -H "Content-Type: application/json"`
					curlCommand += ` \\\n  -d '${JSON.stringify(jsonData, null, 2)}'`
				}
			}
		}

		// Add query parameters for GET requests
		if (endpoint.method === 'GET') {
			const queryParams = endpoint.fields?.filter(field => !field.urlParam) || []
			const urlSearchParams = new URLSearchParams()

			queryParams.forEach(param => {
				const value = formData.get(param.name)
				if (value) {
					urlSearchParams.append(param.name, value)
				}
			})

			if (urlSearchParams.toString()) {
				const separator = url.includes('?') ? '&' : '?'
				curlCommand = curlCommand.replace(
					`"${url}"`,
					`"${url}${separator}${urlSearchParams.toString()}"`
				)
			}
		}

		navigator.clipboard
			.writeText(curlCommand)
			.then(() => {
				this.showToast('success', 'cURL Copied', 'cURL command copied to clipboard')
			})
			.catch(() => {
				this.showToast('error', 'Copy Failed', 'Failed to copy cURL command')
			})
	}

	fillExampleData() {
		const endpoint = this.findEndpointById(this.state.currentEndpoint)
		if (!endpoint || !endpoint.fields) {
			this.showToast('info', 'No Fields', 'This endpoint has no parameters')
			return
		}

		const form = document.getElementById('apiForm')
		if (!form) return

		// Example data for different field types
		const exampleData = {
			username: 'john_doe',
			email: 'john.doe@example.com',
			fullname: 'John Doe',
			password: 'securePassword123',
			title: 'Sample Video Title',
			description: 'This is a sample description for testing purposes.',
			content: 'This is sample content for comments or tweets.',
			name: 'Sample Playlist Name',
			page: '1',
			limit: '10',
			query: 'sample search',
			sortBy: 'createdAt',
			sortType: 'desc',
			videoId: '64f0b5e123456789abcdef12',
			userId: '64f0b5e123456789abcdef34',
			playlistId: '64f0b5e123456789abcdef56',
			commentId: '64f0b5e123456789abcdef78',
			tweetId: '64f0b5e123456789abcdef90',
			channelId: '64f0b5e123456789abcdefab',
			subscriberId: '64f0b5e123456789abcdefcd',
			oldPassword: 'oldPassword123',
			newPassword: 'newPassword456',
		}

		endpoint.fields.forEach(field => {
			if (field.type === 'file') {
				// Skip file fields as they can't be auto-filled
				return
			}

			const input = form.querySelector(`[name="${field.name}"]`)
			if (input && exampleData[field.name]) {
				input.value = exampleData[field.name]
			}
		})

		this.showToast('success', 'Example Data Filled', 'Form filled with example data')
	}

	showToast(type, title, message) {
		const toastContainer = document.querySelector('.toast-container') || this.createToastContainer()

		const toast = document.createElement('div')
		toast.className = `toast ${type}`
		toast.innerHTML = `
      <div class="toast-content">
        <i class="toast-icon ${type} fas ${this.getToastIcon(type)}"></i>
        <div class="toast-message">
          <div class="toast-title">${title}</div>
          <div class="toast-text">${message}</div>
        </div>
        <button class="toast-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `

		// Add close functionality
		toast.querySelector('.toast-close').addEventListener('click', () => {
			this.removeToast(toast)
		})

		toastContainer.appendChild(toast)

		// Show toast
		setTimeout(() => toast.classList.add('show'), 100)

		// Auto remove after 5 seconds
		setTimeout(() => this.removeToast(toast), 5000)
	}

	createToastContainer() {
		const container = document.createElement('div')
		container.className = 'toast-container'
		document.body.appendChild(container)
		return container
	}

	removeToast(toast) {
		toast.classList.remove('show')
		setTimeout(() => toast.remove(), 300)
	}

	getToastIcon(type) {
		const icons = {
			success: 'fa-check-circle',
			error: 'fa-exclamation-circle',
			info: 'fa-info-circle',
			warning: 'fa-exclamation-triangle',
		}
		return icons[type] || 'fa-info-circle'
	}

	showAuthModal(type) {
		// Simple auth modal implementation
		const isLogin = type === 'login'
		this.showModal(
			isLogin ? 'Login' : 'Register',
			`
        <form id="authForm" class="auth-modal-form">
          <div class="form-group">
            <label class="form-label">Username/Email</label>
            <input type="text" class="form-input" name="usernameEmail" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" required>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              ${isLogin ? 'Login' : 'Register'}
            </button>
            <button type="button" class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
              Cancel
            </button>
          </div>
        </form>
      `
		)

		// Add form submission handler
		setTimeout(() => {
			const authForm = document.getElementById('authForm')
			if (authForm) {
				authForm.addEventListener('submit', e => {
					e.preventDefault()
					if (isLogin) {
						this.handleAuthLogin(authForm)
					} else {
						this.showToast(
							'info',
							'Demo Mode',
							'Registration is disabled in demo mode. Use the Login endpoint instead.'
						)
					}
				})
			}
		}, 100)
	}

	async handleAuthLogin(form) {
		const formData = new FormData(form)
		const usernameEmail = formData.get('usernameEmail')
		const password = formData.get('password')

		try {
			const response = await fetch('/api/v1/users/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ usernameEmail, password }),
			})

			const data = await response.json()

			if (response.ok && data.data && data.data.accessToken) {
				this.state.isAuthenticated = true
				this.state.authToken = data.data.accessToken
				this.state.userId = data.data.user?._id

				localStorage.setItem('authToken', this.state.authToken)
				localStorage.setItem('userId', this.state.userId)

				this.updateAuthStatus()
				this.closeModal()
				this.showToast('success', 'Login Successful', 'You are now authenticated')
			} else {
				this.showToast('error', 'Login Failed', data.message || 'Invalid credentials')
			}
		} catch (error) {
			this.showToast('error', 'Login Error', 'Failed to connect to server')
		}
	}

	showHelpModal() {
		this.showModal(
			'Help & Shortcuts',
			`
        <div class="help-section">
          <h4><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h4>
          <div class="shortcuts">
            <div class="shortcut">
              <span>Toggle Sidebar</span>
              <kbd>Ctrl + B</kbd>
            </div>
            <div class="shortcut">
              <span>Toggle Theme</span>
              <kbd>Ctrl + Shift + X</kbd>
            </div>
            <div class="shortcut">
              <span>Focus Search</span>
              <kbd>Ctrl + K</kbd>
            </div>
            <div class="shortcut">
              <span>Submit Form</span>
              <kbd>Ctrl + Enter</kbd>
            </div>
            <div class="shortcut">
              <span>Close Modal</span>
              <kbd>Escape</kbd>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h4><i class="fas fa-question-circle"></i> How to Use</h4>
          <ul>
            <li>Select an endpoint from the sidebar navigation</li>
            <li>Fill in the required parameters</li>
            <li>Click "Send Request" to test the API</li>
            <li>View the response in the right panel</li>
            <li>Use authentication endpoints to login/logout</li>
          </ul>
        </div>

        <div class="help-section">
          <h4><i class="fas fa-lightbulb"></i> Tips</h4>
          <ul>
            <li>Required fields are marked with a red asterisk (*)</li>
            <li>File uploads use multipart/form-data automatically</li>
            <li>Authentication token is stored automatically after login</li>
            <li>Use search to quickly find endpoints</li>
            <li>Responses can be copied to clipboard</li>
          </ul>
        </div>
      `
		)
	}

	showModal(title, content) {
		const existingModal = document.querySelector('.modal-overlay')
		if (existingModal) {
			existingModal.remove()
		}

		const modal = document.createElement('div')
		modal.className = 'modal-overlay'
		modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          ${content}
        </div>
      </div>
    `

		// Add close functionality
		modal.querySelector('.modal-close').addEventListener('click', () => {
			this.closeModal()
		})

		document.body.appendChild(modal)

		// Show modal
		setTimeout(() => modal.classList.add('show'), 100)
	}

	closeModal() {
		const modal = document.querySelector('.modal-overlay')
		if (modal) {
			modal.classList.remove('show')
			setTimeout(() => modal.remove(), 300)
		}
	}

	showNotification(message, type = 'info') {
		// Remove existing notifications
		const existingNotification = document.querySelector('.notification')
		if (existingNotification) {
			existingNotification.remove()
		}

		// Create notification element
		const notification = document.createElement('div')
		notification.className = `notification notification-${type}`
		notification.innerHTML = `
			<div class="notification-content">
				<i class="fas ${this.getNotificationIcon(type)}"></i>
				<span>${message}</span>
				<button class="notification-close">
					<i class="fas fa-times"></i>
				</button>
			</div>
		`

		// Add styles if not already added
		if (!document.querySelector('#notificationStyles')) {
			const styles = document.createElement('style')
			styles.id = 'notificationStyles'
			styles.textContent = `
				.notification {
					position: fixed;
					top: 20px;
					right: 20px;
					background: var(--bg-card);
					border: 1px solid var(--border-color);
					border-radius: var(--radius-md);
					box-shadow: var(--shadow-lg);
					z-index: 10000;
					min-width: 300px;
					max-width: 500px;
					transform: translateX(100%);
					transition: transform var(--transition-normal);
				}
				.notification.show {
					transform: translateX(0);
				}
				.notification-content {
					display: flex;
					align-items: center;
					gap: 12px;
					padding: 16px;
				}
				.notification-success {
					border-left: 4px solid var(--color-success);
				}
				.notification-error {
					border-left: 4px solid var(--color-error);
				}
				.notification-warning {
					border-left: 4px solid var(--color-warning);
				}
				.notification-info {
					border-left: 4px solid var(--color-info);
				}
				.notification-close {
					background: none;
					border: none;
					color: var(--text-secondary);
					cursor: pointer;
					padding: 4px;
					margin-left: auto;
				}
				.notification-close:hover {
					color: var(--text-primary);
				}
			`
			document.head.appendChild(styles)
		}

		// Add close functionality
		notification.querySelector('.notification-close').addEventListener('click', () => {
			notification.classList.remove('show')
			setTimeout(() => notification.remove(), 300)
		})

		// Add to page
		document.body.appendChild(notification)

		// Show notification
		setTimeout(() => notification.classList.add('show'), 100)

		// Auto-hide after 5 seconds
		setTimeout(() => {
			if (notification.parentNode) {
				notification.classList.remove('show')
				setTimeout(() => notification.remove(), 300)
			}
		}, 5000)
	}

	getNotificationIcon(type) {
		switch (type) {
			case 'success':
				return 'fa-check-circle'
			case 'error':
				return 'fa-exclamation-circle'
			case 'warning':
				return 'fa-exclamation-triangle'
			default:
				return 'fa-info-circle'
		}
	}
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	new APIDocsApp()
})

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = APIDocsApp
}
