# YouTube Clone Backend API

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D%2018.x-brightgreen.svg)
![Express.js](https://img.shields.io/badge/express-%5E4.18.2-orange.svg)
![MongoDB](https://img.shields.io/badge/mongoDB-%5E6.0.0-green.svg)
![JWT](https://img.shields.io/badge/JWT-auth-red.svg)
![Cloudinary](https://img.shields.io/badge/Cloudinary-media-blue.svg)

## 📖 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Videos](#videos)
  - [Comments](#comments)
  - [Likes](#likes)
  - [Playlists](#playlists)
  - [Tweets](#tweets)
  - [Subscriptions](#subscriptions)
  - [Dashboard](#dashboard)
  - [Health Check](#health-check)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [File Upload](#file-upload)
- [Testing](#testing)
- [Contributing](#contributing)

## 🚀 Overview

A robust, scalable backend API for a YouTube-like video sharing platform built with Node.js, Express.js, and MongoDB. This API provides comprehensive functionality including user authentication, video management, social features, and real-time interactions.

### Key Highlights

- **RESTful API Design** - Clean, intuitive endpoints
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **File Upload & Cloud Storage** - Cloudinary integration for media files
- **Advanced Search & Filtering** - Powerful video discovery features
- **Social Features** - Likes, comments, subscriptions, playlists
- **Rate Limiting** - Protection against abuse and spam
- **Comprehensive Error Handling** - Structured error responses
- **Professional Documentation** - Complete API reference

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT)
- **File Storage:** Cloudinary
- **File Upload:** Multer
- **Security:** bcrypt, express-rate-limit
- **Validation:** Custom middleware
- **Environment:** dotenv

## ✨ Features

### Core Features

- 🔐 **User Authentication & Authorization**
- 🎥 **Video Upload & Management**
- 💬 **Comments System**
- 👍 **Likes & Reactions**
- 📝 **Tweet-like Posts**
- 📋 **Playlist Management**
- 👥 **User Subscriptions**
- 📊 **Channel Analytics Dashboard**

### Advanced Features

- 🔍 **Advanced Search & Filtering**
- 📄 **Pagination & Sorting**
- 🚀 **Rate Limiting & Security**
- 📱 **Responsive File Upload**
- 🎯 **View Tracking**
- 🔄 **Real-time Updates**
- 📈 **Performance Monitoring**

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd youtube-clone-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.sample .env
   ```

4. **Configure your `.env` file** (see [Environment Variables](#environment-variables))

5. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:8000`

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/youtube-clone

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📚 API Documentation

**Base URL:** `http://localhost:8000/api/v1`

All API responses follow this structure:

```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Success message",
  "success": true
}
```

### 🔐 Authentication

#### Register User

```http
POST /users/register
```

**Body (multipart/form-data):**

```json
{
	"username": "johndoe",
	"email": "john@example.com",
	"fullName": "John Doe",
	"password": "password123",
	"avatar": "file (optional, max 2MB)",
	"coverImage": "file (optional, max 2MB)"
}
```

**Response:**

```json
{
	"statusCode": 201,
	"data": {
		"user": {
			"_id": "user_id",
			"username": "johndoe",
			"email": "john@example.com",
			"fullName": "John Doe",
			"avatar": "cloudinary_url",
			"coverImage": "cloudinary_url"
		},
		"accessToken": "jwt_token",
		"refreshToken": "refresh_token"
	},
	"message": "User registered successfully"
}
```

#### Login User

```http
POST /users/login
```

**Body:**

```json
{
	"email": "john@example.com",
	"password": "password123"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "user": {...},
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  },
  "message": "User logged in successfully"
}
```

#### Logout User

```http
DELETE /users/logout
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:**

```json
{
	"statusCode": 200,
	"data": {},
	"message": "User logged out successfully"
}
```

#### Refresh Access Token

```http
POST /users/refresh-access-token
```

**Body:**

```json
{
	"refreshToken": "refresh_token"
}
```

### 👤 Users

#### Get Current User

```http
GET /users/get-current-user
```

**Headers:** `Authorization: Bearer <access_token>`

#### Update Account Details

```http
PATCH /users/update-account-details
```

**Headers:** `Authorization: Bearer <access_token>`

**Body:**

```json
{
	"fullName": "Updated Name",
	"email": "updated@example.com"
}
```

#### Update User Avatar

```http
PATCH /users/update-user-avatar
```

**Headers:** `Authorization: Bearer <access_token>`

**Body (multipart/form-data):**

```json
{
	"avatar": "file (required, max 2MB, JPEG/PNG/GIF/WebP)"
}
```

#### Update Cover Image

```http
PATCH /users/update-user-cover-image
```

**Headers:** `Authorization: Bearer <access_token>`

**Body (multipart/form-data):**

```json
{
	"coverImage": "file (required, max 2MB, JPEG/PNG/GIF/WebP)"
}
```

#### Change Password

```http
PATCH /users/change-current-password
```

**Headers:** `Authorization: Bearer <access_token>`

**Body:**

```json
{
	"oldPassword": "current_password",
	"newPassword": "new_password"
}
```

#### Get User Channel Profile

```http
GET /users/channel/:username
```

**Parameters:**

- `username` (string, required) - Username of the channel

**Response:**

```json
{
	"statusCode": 200,
	"data": {
		"channel": {
			"_id": "user_id",
			"username": "johndoe",
			"fullName": "John Doe",
			"avatar": "cloudinary_url",
			"coverImage": "cloudinary_url",
			"subscribersCount": 150,
			"videosCount": 25,
			"isSubscribed": false
		}
	},
	"message": "Channel profile fetched successfully"
}
```

#### Get Watch History

```http
GET /users/get-user-watch-history
```

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**

- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 10)

### 🎥 Videos

#### Get All Videos

```http
GET /videos
```

**Query Parameters:**

- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Videos per page (default: 10, max: 100)
- `keyword` (string, optional) - Search in title/description
- `sortBy` (string, optional) - Sort by: 'createdAt', 'views', 'likesCount' (default: 'createdAt')
- `sortType` (string, optional) - Sort order: 'asc', 'desc' (default: 'desc')
- `userId` (string, optional) - Filter by user ID

**Response:**

```json
{
	"statusCode": 200,
	"data": {
		"videos": [
			{
				"_id": "video_id",
				"title": "Video Title",
				"description": "Video Description",
				"videoFile": "cloudinary_url",
				"thumbnail": "cloudinary_url",
				"duration": 300,
				"views": 1250,
				"isPublished": true,
				"owner": {
					"_id": "user_id",
					"username": "johndoe",
					"fullName": "John Doe",
					"avatar": "cloudinary_url"
				},
				"createdAt": "2024-01-01T00:00:00.000Z"
			}
		],
		"pagination": {
			"currentPage": 1,
			"totalPages": 5,
			"totalVideos": 50,
			"hasNextPage": true,
			"hasPrevPage": false
		}
	},
	"message": "Videos fetched successfully"
}
```

#### Upload Video

```http
POST /videos
```

**Headers:** `Authorization: Bearer <access_token>`

**Body (multipart/form-data):**

```json
{
	"title": "My Video Title",
	"description": "Video description here",
	"videoFile": "file (required, max 100MB, MP4/AVI/MKV/MOV/WMV)",
	"thumbnail": "file (required, max 2MB, JPEG/PNG/GIF/WebP)"
}
```

**Response:**

```json
{
	"statusCode": 201,
	"data": {
		"_id": "video_id",
		"title": "My Video Title",
		"description": "Video description here",
		"videoFile": "cloudinary_url",
		"thumbnail": "cloudinary_url",
		"duration": 0,
		"views": 0,
		"isPublished": false,
		"owner": "user_id",
		"createdAt": "2024-01-01T00:00:00.000Z"
	},
	"message": "Video uploaded successfully"
}
```

#### Get Video by ID

```http
GET /videos/:videoId
```

**Parameters:**

- `videoId` (string, required) - Video ID

**Response:** Similar to video object above with like status and owner details

#### Update Video

```http
PATCH /videos/:videoId
```

**Headers:** `Authorization: Bearer <access_token>`

**Body (multipart/form-data):**

```json
{
	"title": "Updated Title",
	"description": "Updated Description",
	"thumbnail": "file (optional, max 2MB, JPEG/PNG/GIF/WebP)"
}
```

#### Delete Video

```http
DELETE /videos/:videoId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Toggle Publish Status

```http
PATCH /videos/toggle/publish/:videoId
```

**Headers:** `Authorization: Bearer <access_token>`

### 💬 Comments

#### Get Video Comments

```http
GET /comments/:videoId
```

**Parameters:**

- `videoId` (string, required) - Video ID

**Query Parameters:**

- `page` (number, optional) - Page number
- `limit` (number, optional) - Comments per page

#### Add Comment

```http
POST /comments/:videoId
```

**Headers:** `Authorization: Bearer <access_token>`

**Body:**

```json
{
	"content": "Great video! Thanks for sharing."
}
```

#### Update Comment

```http
PATCH /comments/id/:commentId
```

**Headers:** `Authorization: Bearer <access_token>`

**Body:**

```json
{
	"content": "Updated comment content"
}
```

#### Delete Comment

```http
DELETE /comments/id/:commentId
```

**Headers:** `Authorization: Bearer <access_token>`

### 👍 Likes

#### Toggle Video Like

```http
POST /likes/toggle/video/:videoId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Toggle Comment Like

```http
POST /likes/toggle/comment/:commentId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Toggle Tweet Like

```http
POST /likes/toggle/tweet/:tweetId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get Liked Videos

```http
GET /likes/videos
```

**Headers:** `Authorization: Bearer <access_token>`

### 📋 Playlists

#### Create Playlist

```http
POST /playlists
```

**Headers:** `Authorization: Bearer <access_token>`

**Body:**

```json
{
	"name": "My Playlist",
	"description": "Playlist description",
	"isPublic": false
}
```

#### Get Playlist Videos

```http
GET /playlists/:playlistId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Update Playlist

```http
PATCH /playlists/:playlistId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Delete Playlist

```http
DELETE /playlists/:playlistId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Add Video to Playlist

```http
PATCH /playlists/add/:videoId/:playlistId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Remove Video from Playlist

```http
PATCH /playlists/remove/:videoId/:playlistId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get User Playlists

```http
GET /playlists/user/:userId
```

**Headers:** `Authorization: Bearer <access_token>`

### 🐦 Tweets

#### Create Tweet

```http
POST /tweets
```

**Headers:** `Authorization: Bearer <access_token>`

**Body:**

```json
{
	"content": "This is my tweet content (max 280 characters)"
}
```

#### Get User Tweets

```http
GET /tweets/user/:userId
```

#### Update Tweet

```http
PATCH /tweets/:tweetId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Delete Tweet

```http
DELETE /tweets/:tweetId
```

**Headers:** `Authorization: Bearer <access_token>`

### 👥 Subscriptions

#### Get Subscribed Channels

```http
GET /subscriptions
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get Channel Subscriber Count

```http
GET /subscriptions/channel/:channelId
```

#### Toggle Subscription

```http
POST /subscriptions/channel/:channelId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get Channel Subscribers

```http
GET /subscriptions/user/:subscriberId
```

**Headers:** `Authorization: Bearer <access_token>`

### 📊 Dashboard

#### Get Channel Statistics

```http
GET /dashboard/stats
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:**

```json
{
	"statusCode": 200,
	"data": {
		"totalVideos": 25,
		"totalViews": 10500,
		"totalSubscribers": 150,
		"totalLikes": 850,
		"totalComments": 320
	},
	"message": "Channel statistics fetched successfully"
}
```

#### Get Channel Videos

```http
GET /dashboard/videos
```

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**

- `page` (number, optional) - Page number
- `limit` (number, optional) - Videos per page
- `sortBy` (string, optional) - Sort field
- `sortType` (string, optional) - Sort order

### 🏥 Health Check

#### Application Health

```http
GET /healthcheck
```

**Response:**

```json
{
	"statusCode": 200,
	"data": {
		"status": "OK",
		"timestamp": "2024-01-01T00:00:00.000Z",
		"uptime": 3600,
		"environment": "development"
	},
	"message": "Service is healthy"
}
```

## ⚠️ Error Handling

All errors follow this structure:

```json
{
	"statusCode": 400,
	"data": null,
	"message": "Error description",
	"success": false,
	"errors": [] // Additional error details if any
}
```

### Common Error Codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `413` - Payload Too Large (file size exceeded)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 🚫 Rate Limiting - NOT IMPLEMENTED YET

API endpoints are protected with rate limiting:

- **General routes:** 100 requests per 15 minutes per IP
- **Auth routes:** 5 requests per 15 minutes per IP
- **Upload routes:** 10 requests per 15 minutes per IP
- **Search routes:** 50 requests per 15 minutes per IP

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## 📁 File Upload

### Supported Formats:

**Images (avatars, thumbnails, covers):**

- Formats: JPEG, PNG, GIF, WebP
- Max size: 2MB

**Videos:**

- Formats: MP4, AVI, MKV, MOV, WMV
- Max size: 100MB

### Upload Process:

1. Files are temporarily stored on server
2. Uploaded to Cloudinary cloud storage
3. Temporary files are automatically cleaned up
4. Database is updated with cloud URLs

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email sayankb.001@gmail.com or create an issue on GitHub.

---

**Built with ❤️ using Node.js, Express.js, and MongoDB**
