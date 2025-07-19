// Global variables
let currentUser = null
let authToken = localStorage.getItem('authToken')

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
	initializeTheme()
	initializeNavigation()
	initializeAuth()
	initializeResponseTabs()

	// Check authentication status on load
	if (authToken) {
		checkAuthStatus()
	}
})

// Theme Management
function initializeTheme() {
	const themeToggle = document.getElementById('themeToggle')
	const savedTheme = localStorage.getItem('theme') || 'dark'

	document.body.setAttribute('data-theme', savedTheme)
	updateThemeIcon(savedTheme)

	if (themeToggle) {
		themeToggle.addEventListener('click', function () {
			const currentTheme = document.body.getAttribute('data-theme')
			const newTheme = currentTheme === 'dark' ? 'light' : 'dark'

			document.body.setAttribute('data-theme', newTheme)
			localStorage.setItem('theme', newTheme)
			updateThemeIcon(newTheme)
		})
	}
}

function updateThemeIcon(theme) {
	const themeToggle = document.getElementById('themeToggle')
	const icon = themeToggle?.querySelector('i')

	if (icon) {
		if (theme === 'dark') {
			icon.className = 'fas fa-sun'
		} else {
			icon.className = 'fas fa-moon'
		}
	}
}

// Navigation Management
function initializeNavigation() {
	const navItems = document.querySelectorAll('.nav-item')
	const sections = document.querySelectorAll('.api-section')

	navItems.forEach(item => {
		item.addEventListener('click', function () {
			const targetSection = this.getAttribute('data-section')

			// Update active nav item
			navItems.forEach(nav => nav.classList.remove('active'))
			this.classList.add('active')

			// Show target section
			sections.forEach(section => section.classList.remove('active'))
			document.getElementById(targetSection).classList.add('active')

			// Hide response container when switching sections
			hideResponse()
		})
	})
}

// Authentication Management
function initializeAuth() {
	const authBtn = document.getElementById('authBtn')

	if (authBtn) {
		authBtn.addEventListener('click', function () {
			if (currentUser) {
				logout()
			} else {
				// Show login section
				document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'))
				document.querySelector('[data-section="auth"]').classList.add('active')
				document
					.querySelectorAll('.api-section')
					.forEach(section => section.classList.remove('active'))
				document.getElementById('auth').classList.add('active')
			}
		})
	}
}

function updateAuthStatus(user = null) {
	const statusIndicator = document.getElementById('statusIndicator')
	const authBtn = document.getElementById('authBtn')

	if (user && statusIndicator && authBtn) {
		currentUser = user
		statusIndicator.textContent = `Authenticated as ${user.username || user.fullName}`
		statusIndicator.classList.add('authenticated')
		authBtn.textContent = 'Logout'
		authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout'
	} else if (statusIndicator && authBtn) {
		currentUser = null
		authToken = null
		localStorage.removeItem('authToken')
		statusIndicator.textContent = 'Not Authenticated'
		statusIndicator.classList.remove('authenticated')
		authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login'
	}
}

async function checkAuthStatus() {
	try {
		const response = await makeRequest('GET', '/api/v1/users/get-current-user')
		if (response.success) {
			updateAuthStatus(response.data)
		} else {
			updateAuthStatus()
		}
	} catch (error) {
		updateAuthStatus()
	}
}

async function logout() {
	try {
		await makeRequest('DELETE', '/api/v1/users/logout')
		updateAuthStatus()
		showResponse(
			{
				success: true,
				message: 'Logged out successfully',
			},
			200
		)
	} catch (error) {
		updateAuthStatus()
		showResponse(
			{
				success: false,
				message: 'Logout failed',
			},
			500
		)
	}
}

// Response Tabs Management
function initializeResponseTabs() {
	const tabBtns = document.querySelectorAll('.tab-btn')

	tabBtns.forEach(btn => {
		btn.addEventListener('click', function () {
			const targetTab = this.getAttribute('data-tab')

			// Update active tab button
			tabBtns.forEach(tab => tab.classList.remove('active'))
			this.classList.add('active')

			// Show target tab content
			document.querySelectorAll('.tab-content').forEach(content => {
				content.classList.remove('active')
			})
			document.getElementById(targetTab + 'Tab').classList.add('active')
		})
	})
}

// HTTP Request Helper
async function makeRequest(method, url, data = null, isFormData = false) {
	const options = {
		method,
		headers: {},
		credentials: 'include',
	}

	// Add auth token if available
	if (authToken) {
		options.headers['Authorization'] = `Bearer ${authToken}`
	}

	// Handle different data types
	if (data) {
		if (isFormData) {
			options.body = data
		} else if (method === 'GET') {
			const params = new URLSearchParams(data)
			url += '?' + params.toString()
		} else {
			options.headers['Content-Type'] = 'application/json'
			options.body = JSON.stringify(data)
		}
	}

	const response = await fetch(url, options)
	const result = await response.json()

	// Store auth token if present in response
	if (result.data && result.data.accessToken) {
		authToken = result.data.accessToken
		localStorage.setItem('authToken', authToken)
	}

	return { ...result, status: response.status }
}

// Generic API Testing Function
async function testEndpoint(method, url, data = null, isFormData = false) {
	const loadingBtn = event.target
	const originalContent = loadingBtn.innerHTML

	try {
		loadingBtn.innerHTML = '<div class="loading"></div> Loading...'
		loadingBtn.disabled = true

		const response = await makeRequest(method, url, data, isFormData)
		showResponse(response, response.status)

		// Update auth status if this was a login/logout
		if (url.includes('/login') && response.success) {
			updateAuthStatus(response.data.user)
		} else if (url.includes('/logout')) {
			updateAuthStatus()
		}
	} catch (error) {
		showResponse(
			{
				success: false,
				message: 'Network error: ' + error.message,
			},
			500
		)
	} finally {
		loadingBtn.innerHTML = originalContent
		loadingBtn.disabled = false
	}
}

// Form Submission Helper
async function submitForm(formId, method, url) {
	const form = document.getElementById(formId)
	const formData = new FormData(form)

	// Check if form has file input elements (not just files)
	const hasFileInputs = form.querySelector('input[type="file"]') !== null

	let data
	let isFormData = false

	if (hasFileInputs) {
		// Use FormData for forms with file inputs
		data = formData
		isFormData = true
	} else {
		// Convert to plain object for forms without file inputs
		data = {}
		for (let [key, value] of formData.entries()) {
			if (value.trim() !== '') {
				data[key] = value
			}
		}
	}

	// console.log('Form data:', data)
	// console.log('Is FormData:', isFormData)

	await testEndpoint(method, url, data, isFormData)
}

// Specific endpoint functions
async function getVideoById() {
	const form = document.getElementById('getVideoForm')
	const videoId = form.videoId.value.trim()

	if (!videoId) {
		alert('Please enter a video ID')
		return
	}

	await testEndpoint('GET', `/api/v1/videos/${videoId}`)
}

async function getComments() {
	const form = document.getElementById('getCommentsForm')
	const videoId = form.videoId.value.trim()

	if (!videoId) {
		alert('Please enter a video ID')
		return
	}

	const data = {
		page: form.page.value || 1,
		limit: form.limit.value || 10,
	}

	await testEndpoint('GET', `/api/v1/comments/${videoId}`, data)
}

async function addComment() {
	const form = document.getElementById('addCommentForm')
	const videoId = form.videoId.value.trim()
	const content = form.content.value.trim()

	if (!videoId || !content) {
		alert('Please enter both video ID and comment content')
		return
	}

	await testEndpoint('POST', `/api/v1/comments/${videoId}`, { content })
}

async function toggleVideoLike() {
	const form = document.getElementById('likeVideoForm')
	const videoId = form.videoId.value.trim()

	if (!videoId) {
		alert('Please enter a video ID')
		return
	}

	await testEndpoint('POST', `/api/v1/likes/toggle/video/${videoId}`)
}

async function toggleCommentLike() {
	const form = document.getElementById('likeCommentForm')
	const commentId = form.commentId.value.trim()

	if (!commentId) {
		alert('Please enter a comment ID')
		return
	}

	await testEndpoint('POST', `/api/v1/likes/toggle/comment/${commentId}`)
}

async function toggleTweetLike() {
	const form = document.getElementById('likeTweetForm')
	const tweetId = form.tweetId.value.trim()

	if (!tweetId) {
		alert('Please enter a tweet ID')
		return
	}

	await testEndpoint('POST', `/api/v1/likes/toggle/tweet/${tweetId}`)
}

async function toggleSubscription() {
	const form = document.getElementById('subscribeForm')
	const channelId = form.channelId.value.trim()

	if (!channelId) {
		alert('Please enter a channel ID')
		return
	}

	await testEndpoint('POST', `/api/v1/subscriptions/channel/${channelId}`)
}

async function getSubscriberCount() {
	const form = document.getElementById('getSubscriberCountForm')
	const channelId = form.channelId.value.trim()

	if (!channelId) {
		alert('Please enter a channel ID')
		return
	}

	await testEndpoint('GET', `/api/v1/subscriptions/channel/${channelId}`)
}

async function getUserSubscribers() {
	const form = document.getElementById('getUserSubscribersForm')
	const subscriberId = form.subscriberId.value.trim()

	if (!subscriberId) {
		alert('Please enter a subscriber ID')
		return
	}

	await testEndpoint('GET', `/api/v1/subscriptions/user/${subscriberId}`)
}

async function getUserPlaylists() {
	const form = document.getElementById('getUserPlaylistsForm')
	const userId = form.userId.value.trim()

	if (!userId) {
		alert('Please enter a user ID')
		return
	}

	await testEndpoint('GET', `/api/v1/playlists/user/${userId}`)
}

async function getPlaylistById() {
	const form = document.getElementById('getPlaylistForm')
	const playlistId = form.playlistId.value.trim()

	if (!playlistId) {
		alert('Please enter a playlist ID')
		return
	}

	await testEndpoint('GET', `/api/v1/playlists/${playlistId}`)
}

async function updatePlaylist() {
	const form = document.getElementById('updatePlaylistForm')
	const playlistId = form.playlistId.value.trim()

	if (!playlistId) {
		alert('Please enter a playlist ID')
		return
	}

	const data = {}
	if (form.name.value.trim()) data.name = form.name.value.trim()
	if (form.description.value.trim()) data.description = form.description.value.trim()

	if (Object.keys(data).length === 0) {
		alert('Please provide at least one field to update')
		return
	}

	await testEndpoint('PATCH', `/api/v1/playlists/${playlistId}`, data)
}

async function deletePlaylist() {
	const form = document.getElementById('deletePlaylistForm')
	const playlistId = form.playlistId.value.trim()

	if (!playlistId) {
		alert('Please enter a playlist ID')
		return
	}

	if (!confirm('Are you sure you want to delete this playlist?')) {
		return
	}

	await testEndpoint('DELETE', `/api/v1/playlists/${playlistId}`)
}

async function addVideoToPlaylist() {
	const form = document.getElementById('addVideoToPlaylistForm')
	const videoId = form.videoId.value.trim()
	const playlistId = form.playlistId.value.trim()

	if (!videoId || !playlistId) {
		alert('Please enter both video ID and playlist ID')
		return
	}

	await testEndpoint('PATCH', `/api/v1/playlists/add/${videoId}/${playlistId}`)
}

async function removeVideoFromPlaylist() {
	const form = document.getElementById('removeVideoFromPlaylistForm')
	const videoId = form.videoId.value.trim()
	const playlistId = form.playlistId.value.trim()

	if (!videoId || !playlistId) {
		alert('Please enter both video ID and playlist ID')
		return
	}

	await testEndpoint('PATCH', `/api/v1/playlists/remove/${videoId}/${playlistId}`)
}

async function getUserTweets() {
	const form = document.getElementById('getUserTweetsForm')
	const userId = form.userId.value.trim()

	if (!userId) {
		alert('Please enter a user ID')
		return
	}

	await testEndpoint('GET', `/api/v1/tweets/user/${userId}`)
}

async function getChannelProfile() {
	const form = document.getElementById('getChannelProfileForm')
	const username = form.username.value.trim()

	if (!username) {
		alert('Please enter a username')
		return
	}

	await testEndpoint('GET', `/api/v1/users/channel/${username}`)
}

// Video-related functions
async function updateVideo() {
	const form = document.getElementById('updateVideoForm')
	const videoId = form.videoId.value.trim()

	if (!videoId) {
		alert('Please enter a video ID')
		return
	}

	// Create FormData for file upload support
	const formData = new FormData()

	// Add text fields if they have values
	if (form.title.value.trim()) {
		formData.append('title', form.title.value.trim())
	}
	if (form.description.value.trim()) {
		formData.append('description', form.description.value.trim())
	}

	// Add thumbnail file if selected
	if (form.thumbnail.files[0]) {
		formData.append('thumbnail', form.thumbnail.files[0])
	}

	// Check if at least one field is provided
	if (!formData.has('title') && !formData.has('description') && !formData.has('thumbnail')) {
		alert('Please provide at least one field to update')
		return
	}

	// Use the testEndpoint function with FormData
	const loadingBtn = event.target
	const originalContent = loadingBtn.innerHTML

	try {
		loadingBtn.innerHTML = '<div class="loading"></div> Loading...'
		loadingBtn.disabled = true

		const response = await makeRequest('PATCH', `/api/v1/videos/${videoId}`, formData, true)
		showResponse(response, response.status)
	} catch (error) {
		showResponse(
			{
				success: false,
				message: 'Network error: ' + error.message,
			},
			500
		)
	} finally {
		loadingBtn.innerHTML = originalContent
		loadingBtn.disabled = false
	}
}

async function deleteVideo() {
	const form = document.getElementById('deleteVideoForm')
	const videoId = form.videoId.value.trim()

	if (!videoId) {
		alert('Please enter a video ID')
		return
	}

	if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
		return
	}

	await testEndpoint('DELETE', `/api/v1/videos/${videoId}`)
}

async function toggleVideoPublishStatus() {
	const form = document.getElementById('togglePublishForm')
	const videoId = form.videoId.value.trim()

	if (!videoId) {
		alert('Please enter a video ID')
		return
	}

	await testEndpoint('PATCH', `/api/v1/videos/toggle/publish/${videoId}`)
}

// Response Display Management
function showResponse(data, status) {
	const responseContainer = document.getElementById('responseContainer')
	const prettyResponse = document.getElementById('prettyResponse')
	const rawResponse = document.getElementById('rawResponse')
	const responseStatus = document.getElementById('responseStatus')

	// Show container
	responseContainer.classList.add('show')

	// Format and display response
	const jsonString = JSON.stringify(data, null, 2)
	prettyResponse.textContent = jsonString
	rawResponse.textContent = jsonString

	// Highlight syntax
	if (window.Prism) {
		Prism.highlightElement(prettyResponse)
	}

	// Update status
	responseStatus.innerHTML = `
        <span class="status-${Math.floor(status / 100) * 100}">
            <i class="fas fa-circle"></i> ${status} ${getStatusText(status)}
        </span>
        <span>${new Date().toLocaleTimeString()}</span>
    `

	// Scroll to response
	responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function hideResponse() {
	const responseContainer = document.getElementById('responseContainer')
	responseContainer.classList.remove('show')
}

function getStatusText(status) {
	const statusTexts = {
		200: 'OK',
		201: 'Created',
		400: 'Bad Request',
		401: 'Unauthorized',
		403: 'Forbidden',
		404: 'Not Found',
		500: 'Internal Server Error',
	}
	return statusTexts[status] || 'Unknown'
}

// Utility Functions
function formatFileSize(bytes) {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString) {
	const date = new Date(dateString)
	return date.toLocaleString()
}

// Error Handling
window.addEventListener('error', function (event) {
	console.error('JavaScript Error:', event.error)
})

window.addEventListener('unhandledrejection', function (event) {
	console.error('Unhandled Promise Rejection:', event.reason)
})

// Export functions for global access
window.testEndpoint = testEndpoint
window.submitForm = submitForm
window.getVideoById = getVideoById
window.getComments = getComments
window.addComment = addComment
window.toggleVideoLike = toggleVideoLike
window.toggleCommentLike = toggleCommentLike
window.toggleTweetLike = toggleTweetLike
window.toggleSubscription = toggleSubscription
window.getSubscriberCount = getSubscriberCount
window.getUserSubscribers = getUserSubscribers
window.getUserPlaylists = getUserPlaylists
window.getPlaylistById = getPlaylistById
window.updatePlaylist = updatePlaylist
window.deletePlaylist = deletePlaylist
window.addVideoToPlaylist = addVideoToPlaylist
window.removeVideoFromPlaylist = removeVideoFromPlaylist
window.getUserTweets = getUserTweets
window.getChannelProfile = getChannelProfile
window.updateVideo = updateVideo
window.deleteVideo = deleteVideo
window.toggleVideoPublishStatus = toggleVideoPublishStatus
