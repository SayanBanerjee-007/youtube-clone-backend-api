import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from '../constants.js'

// Configure Cloudinary with credentials
cloudinary.config({
	cloud_name: CLOUDINARY_CLOUD_NAME,
	api_key: CLOUDINARY_API_KEY,
	api_secret: CLOUDINARY_API_SECRET,
})

/**
 * Uploads a file to Cloudinary
 * @param {string} filePath - The local file path to upload
 * @returns {Object|null} - Cloudinary response object or null if failed
 */
const uploadOnCloudinary = async filePath => {
	try {
		// Validate input parameters
		if (!filePath || typeof filePath !== 'string') {
			console.error('Invalid file path provided for upload')
			return null
		}

		// Check if file exists before attempting upload
		if (!fs.existsSync(filePath)) {
			console.error(`File does not exist at path: ${filePath}`)
			return null
		}

		// Upload file to Cloudinary with auto resource type detection
		const response = await cloudinary.uploader.upload(filePath, {
			resource_type: 'auto',
		})

		console.log('File uploaded successfully to Cloudinary:', {
			public_id: response.public_id,
			secure_url: response.secure_url,
			resource_type: response.resource_type,
		})

		return response
	} catch (error) {
		console.error('Failed to upload file to Cloudinary:', {
			filePath,
			error: error.message,
			stack: error.stack,
		})
		return null
	}
}

/**
 * Extracts public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Extracted public_id or null if invalid
 */
const extractPublicIdFromUrl = url => {
	try {
		if (!url || typeof url !== 'string') return null

		// Handle different Cloudinary URL formats
		const urlParts = url.split('/')
		const fileNameWithExtension = urlParts.at(-1)

		if (!fileNameWithExtension) return null

		// Remove file extension to get public_id
		const publicId = fileNameWithExtension.split('.')[0]
		return publicId || null
	} catch (error) {
		console.error('Failed to extract public_id from URL:', error.message)
		return null
	}
}

/**
 * Deletes a video from Cloudinary
 * @param {string} url - Cloudinary URL of the video to delete
 * @returns {Object|null} - Cloudinary response object or null if failed
 */
const deleteVideoFromCloudinary = async url => {
	try {
		// Validate input
		if (!url || typeof url !== 'string') {
			console.error('Invalid URL provided for video deletion')
			return null
		}

		// Extract public_id from URL
		const publicId = extractPublicIdFromUrl(url)
		if (!publicId) {
			console.error('Could not extract public_id from video URL:', url)
			return null
		}

		// Delete video with explicit resource type
		const response = await cloudinary.uploader.destroy(publicId, {
			resource_type: 'video',
		})

		console.log('Video deleted successfully from Cloudinary:', {
			public_id: publicId,
			result: response.result,
		})

		return response
	} catch (error) {
		console.error('Failed to delete video from Cloudinary:', {
			url,
			error: error.message,
			stack: error.stack,
		})
		return null
	}
}

/**
 * Deletes an image from Cloudinary
 * @param {string} url - Cloudinary URL of the image to delete
 * @returns {Object|null} - Cloudinary response object or null if failed
 */
const deleteImageFromCloudinary = async url => {
	try {
		// Validate input
		if (!url || typeof url !== 'string') {
			console.error('Invalid URL provided for image deletion')
			return null
		}

		// Extract public_id from URL
		const publicId = extractPublicIdFromUrl(url)
		if (!publicId) {
			console.error('Could not extract public_id from image URL:', url)
			return null
		}

		// Delete image (default resource type)
		const response = await cloudinary.uploader.destroy(publicId)

		console.log('Image deleted successfully from Cloudinary:', {
			public_id: publicId,
			result: response.result,
		})

		return response
	} catch (error) {
		console.error('Failed to delete image from Cloudinary:', {
			url,
			error: error.message,
			stack: error.stack,
		})
		return null
	}
}

export { uploadOnCloudinary, deleteVideoFromCloudinary, deleteImageFromCloudinary }
