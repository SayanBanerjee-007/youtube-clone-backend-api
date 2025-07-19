import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { ApiError, asyncHandler } from '../utils/index.js'
import { FILE_SIZE_LIMITS, FILE_SIZE_DISPLAY } from '../constants.js'

/**
 * @fileoverview Multer configuration for file uploads
 * @description Handles file storage with proper error checking and validation
 * @author Sayan Banerjee
 * @created 2024
 */

// Ensure upload directory exists
const uploadDir = './public/temp'
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * @function cleanupTempFiles
 * @description Cleanup uploaded files from temp directory
 * @param {Object} req - Express request object containing file information
 * @returns {void}
 * @note Call this after successful upload to cloud or on error
 * @example cleanupTempFiles(req)
 */
const cleanupTempFiles = req => {
	try {
		const filesToCleanup = []

		// Handle single file (req.file)
		if (req.file && req.file.path) {
			filesToCleanup.push(req.file.path)
		}

		// Handle multiple files (req.files)
		if (req.files) {
			// If req.files is an array
			if (Array.isArray(req.files)) {
				req.files.forEach(file => {
					if (file && file.path) {
						filesToCleanup.push(file.path)
					}
				})
			}
			// If req.files is an object with field names
			else if (typeof req.files === 'object') {
				Object.values(req.files).forEach(fileArray => {
					if (Array.isArray(fileArray)) {
						fileArray.forEach(file => {
							if (file && file.path) {
								filesToCleanup.push(file.path)
							}
						})
					}
				})
			}
		}

		// Delete all temp files
		filesToCleanup.forEach(filePath => {
			try {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath)
					console.log(`Cleaned up temp file: ${filePath}`)
				}
			} catch (error) {
				console.warn(`Failed to cleanup temp file ${filePath}:`, error.message)
			}
		})
	} catch (error) {
		console.error('Error during file cleanup:', error.message)
	}
}

/**
 * @function autoCleanupTemp
 * @description Middleware to automatically cleanup temp files after request completion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @note This runs after all middlewares and controllers have finished
 * @note Prevents memory leaks by cleaning up temporary files
 * @example app.use(autoCleanupTemp)
 */
const autoCleanupTemp = (req, res, next) => {
	// Store original response methods
	const originalEnd = res.end
	const originalJson = res.json
	const originalSend = res.send

	// Flag to prevent multiple cleanups
	let cleanupDone = false

	const performCleanup = () => {
		if (!cleanupDone) {
			cleanupDone = true
			cleanupTempFiles(req)
		}
	}

	// Override res.end to cleanup files when response is sent
	res.end = function (...args) {
		performCleanup()
		originalEnd.apply(this, args)
	}

	// Override res.json to cleanup files when JSON response is sent
	res.json = function (...args) {
		performCleanup()
		originalJson.apply(this, args)
	}

	// Override res.send to cleanup files when response is sent
	res.send = function (...args) {
		performCleanup()
		originalSend.apply(this, args)
	}

	// Cleanup on request close (client disconnect, errors, etc.)
	req.on('close', performCleanup)
	req.on('aborted', performCleanup)

	// Cleanup on response finish
	res.on('finish', performCleanup)
	res.on('close', performCleanup)

	next()
}

/**
 * @constant storage
 * @description Storage configuration for multer
 * @type {Object}
 * @property {Function} destination - Sets destination directory for uploaded files
 * @property {Function} filename - Generates unique filename with timestamp
 * @note Files are stored in ./public/temp with timestamped filenames
 * @note Sanitizes filenames to prevent security issues
 */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		try {
			// Verify the destination directory exists and is writable
			fs.accessSync(uploadDir, fs.constants.W_OK)
			cb(null, uploadDir)
		} catch (error) {
			cb(new Error('Upload directory is not accessible or writable'), null)
		}
	},
	filename: function (req, file, cb) {
		try {
			// Validate file object
			if (!file || !file.originalname) {
				return cb(new Error('Invalid file object'), null)
			}

			// Generate timestamp and sanitize filename
			const timeStamp = new Date().toISOString().replace(/[:.]/g, '-')
			const fileExtension = path.extname(file.originalname)
			const baseName = path.basename(file.originalname, fileExtension)

			// Sanitize filename to remove potentially dangerous characters
			const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_')
			const finalFilename = `${timeStamp}_${sanitizedBaseName}${fileExtension}`

			cb(null, finalFilename)
		} catch (error) {
			cb(new Error('Error generating filename'), null)
		}
	},
})

/**
 * @section File Filters
 * @description File filters for specific file types validation
 */

/**
 * @function imageFileFilter
 * @description Validates image file uploads
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 * @returns {void}
 * @throws {Error} Invalid file format or unsupported image type
 * @note Accepts: JPEG, JPG, PNG, GIF, WebP
 * @example multer({ fileFilter: imageFileFilter })
 */
const imageFileFilter = (req, file, cb) => {
	try {
		if (!file || !file.originalname || !file.mimetype) {
			return cb(new Error('Invalid file format'), false)
		}

		const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

		if (allowedImageTypes.includes(file.mimetype)) {
			cb(null, true)
		} else {
			cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false)
		}
	} catch (error) {
		cb(new Error('Image file validation failed'), false)
	}
}

/**
 * @function videoFileFilter
 * @description Validates video file uploads
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 * @returns {void}
 * @throws {Error} Invalid file format or unsupported video type
 * @note Accepts: MP4, AVI, MKV, MOV, WMV
 * @example multer({ fileFilter: videoFileFilter })
 */
const videoFileFilter = (req, file, cb) => {
	try {
		if (!file || !file.originalname || !file.mimetype) {
			return cb(new Error('Invalid file format'), false)
		}

		const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/wmv']

		if (allowedVideoTypes.includes(file.mimetype)) {
			cb(null, true)
		} else {
			cb(new Error('Only video files (MP4, AVI, MKV, MOV, WMV) are allowed'), false)
		}
	} catch (error) {
		cb(new Error('Video file validation failed'), false)
	}
}

// const documentFileFilter = (req, file, cb) => {
//   try {
//     if (!file || !file.originalname || !file.mimetype) {
//       return cb(new Error('Invalid file format'), false)
//     }

//     const allowedDocTypes = [
//       'application/pdf',
//       'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     ]

//     if (allowedDocTypes.includes(file.mimetype)) {
//       cb(null, true)
//     } else {
//       cb(new Error('Only document files (PDF, DOC, DOCX) are allowed'), false)
//     }
//   } catch (error) {
//     cb(new Error('Document file validation failed'), false)
//   }
// }

/**
 * @section Upload Configurations
 * @description Upload configurations for different file types with specific size limits
 */

/**
 * @constant uploadImages
 * @description Multer configuration for image uploads
 * @type {Object}
 * @property {Object} storage - Storage configuration
 * @property {Function} fileFilter - Image file filter
 * @property {Object} limits - File size and count limits
 * @note Maximum file size: 2MB per image
 * @note Maximum files: 2 images per request
 * @note Supported formats: JPEG, PNG, GIF, WebP
 * @example uploadImages.single('avatar'), uploadImages.fields([{name: 'avatar', maxCount: 1}])
 */

// For any images  - 2MB limit
const uploadImages = multer({
	storage,
	fileFilter: imageFileFilter,
	limits: {
		fileSize: FILE_SIZE_LIMITS.IMAGE, // 2MB
		files: 2,
	},
})

/**
 * @constant uploadVideo
 * @description Multer configuration for video uploads
 * @type {Object}
 * @property {Object} storage - Storage configuration
 * @property {Function} fileFilter - Video file filter
 * @property {Object} limits - File size and count limits
 * @note Maximum file size: 100MB per video
 * @note Maximum files: 1 video per request
 * @note Supported formats: MP4, AVI, MKV, MOV, WMV
 * @example uploadVideo.single('videoFile')
 */
// For video files - 100MB limit
const uploadVideo = multer({
	storage,
	fileFilter: videoFileFilter,
	limits: {
		fileSize: FILE_SIZE_LIMITS.VIDEO, // 100MB for videos
		files: 1,
	},
})

/**
 * @constant uploadVideoWithThumbnail
 * @description Multer configuration for video and thumbnail uploads
 * @type {Object}
 * @property {Object} storage - Storage configuration
 * @property {Function} fileFilter - Combined video and image file filter
 * @property {Object} limits - File size and count limits
 * @note Maximum file size: 100MB (videos), 2MB (thumbnails)
 * @note Maximum files: 2 files per request (1 video + 1 thumbnail)
 * @note Video formats: MP4, AVI, MKV, MOV, WMV
 * @note Image formats: JPEG, PNG, GIF, WebP
 * @note Field names: 'videoFile' for video, 'thumbnail' for image
 * @example uploadVideoWithThumbnail.fields([{name: 'videoFile', maxCount: 1}, {name: 'thumbnail', maxCount: 1}])
 */
// For mixed video + thumbnail uploads
const uploadVideoWithThumbnail = multer({
	storage,
	fileFilter: (req, file, cb) => {
		try {
			if (!file || !file.originalname || !file.mimetype) {
				return cb(new Error('Invalid file format'), false)
			}

			// Field-specific validation
			if (file.fieldname === 'videoFile') {
				const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/wmv']
				if (allowedVideoTypes.includes(file.mimetype)) {
					cb(null, true)
				} else {
					cb(new Error('Video file must be MP4, AVI, MKV, MOV, or WMV'), false)
				}
			} else if (file.fieldname === 'thumbnail') {
				const allowedImageTypes = [
					'image/jpeg',
					'image/jpg',
					'image/png',
					'image/gif',
					'image/webp',
				]
				if (allowedImageTypes.includes(file.mimetype)) {
					cb(null, true)
				} else {
					cb(new Error('Thumbnail must be JPEG, PNG, GIF, or WebP'), false)
				}
			} else {
				cb(
					new Error(
						`Invalid field name: ${file.fieldname}. Only videoFile and thumbnail are allowed`
					),
					false
				)
			}
		} catch (error) {
			cb(new Error('File validation failed'), false)
		}
	},
	limits: {
		fileSize: FILE_SIZE_LIMITS.VIDEO, // 100MB max (will validate per field)
		files: 2, // Video + Thumbnail
	},
})

// For document uploads - 10MB limit
// export const uploadDocument = multer({
//   storage,
//   fileFilter: documentFileFilter,
//   limits: {
//     fileSize: FILE_SIZE_LIMITS.DOCUMENT, // 10MB
//     files: 3,
//   },
// })

/**
 * @function validateFieldSpecificSizes
 * @description Custom middleware to validate file sizes based on field names
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 * @throws {ApiError} File size exceeds limit for specific field
 * @note Use this with uploadVideoWithThumbnail for field-specific size limits
 * @note Video files: 100MB limit, Image files: 2MB limit
 * @note Uses asyncHandler for consistent error handling pattern
 * @example router.post('/upload', uploadVideoWithThumbnail.fields(...), validateFieldSpecificSizes, controller)
 */
const validateFieldSpecificSizes = asyncHandler(async (req, res, next) => {
	if (req.files) {
		// Validate video file size (100MB limit)
		if (req.files.videoFile && req.files.videoFile[0]) {
			const videoFile = req.files.videoFile[0]
			if (videoFile.size > FILE_SIZE_LIMITS.VIDEO) {
				throw new ApiError(400, `Video file size cannot exceed ${FILE_SIZE_DISPLAY.VIDEO}`)
			}
		}

		// Validate thumbnail file size (2MB limit)
		if (req.files.thumbnail && req.files.thumbnail[0]) {
			const thumbnailFile = req.files.thumbnail[0]
			if (thumbnailFile.size > FILE_SIZE_LIMITS.IMAGE) {
				throw new ApiError(400, `Thumbnail file size cannot exceed ${FILE_SIZE_DISPLAY.IMAGE}`)
			}
		}
	}
	next()
})

/**
 * @function getMulterErrorMessage
 * @description Helper function to get user-friendly multer error message
 * @param {Error} err - Multer error object
 * @returns {string} User-friendly error message
 * @note Follows project's error handling pattern
 * @note Provides field-specific size limit information
 * @example const message = getMulterErrorMessage(multerError)
 */
const getMulterErrorMessage = err => {
	let message = 'File upload error'

	switch (err.code) {
		case 'LIMIT_FILE_SIZE':
			const fieldName = err.field || 'file'
			let sizeLimit = FILE_SIZE_DISPLAY.IMAGE // default

			// Get specific size limits based on field
			if (fieldName === 'videoFile') {
				sizeLimit = FILE_SIZE_DISPLAY.VIDEO
			} else if (
				fieldName === 'avatar' ||
				fieldName === 'coverImage' ||
				fieldName === 'thumbnail'
			) {
				sizeLimit = FILE_SIZE_DISPLAY.IMAGE
			}

			message = `File size too large for ${fieldName}. Maximum allowed size is ${sizeLimit}.`
			break

		case 'LIMIT_FILE_COUNT':
			message = 'Too many files uploaded. Please check the file count limit.'
			break

		case 'LIMIT_FIELD_KEY':
			message = 'Field name is too long.'
			break

		case 'LIMIT_FIELD_VALUE':
			message = 'Field value is too long.'
			break

		case 'LIMIT_FIELD_COUNT':
			message = 'Too many fields in the form.'
			break

		case 'LIMIT_UNEXPECTED_FILE':
			message = `Unexpected field: ${err.field}. Please check the field name.`
			break

		case 'MISSING_FIELD_NAME':
			message = 'Missing field name in the form.'
			break

		default:
			message = `File upload error: ${err.message}`
	}

	return message
}

/**
 * @function handleMulterError
 * @description Middleware to handle Multer errors and provide user-friendly error messages
 * @param {Error} err - Error object from previous middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @throws {ApiError} Formatted multer error with user-friendly message
 * @note Use this after your multer middleware to catch and format errors
 * @note Follows project's error handling pattern with ApiError
 * @note Automatically cleans up uploaded files on error
 * @example router.post('/upload', uploadImages.single('avatar'), handleMulterError, controller)
 */
const handleMulterError = (err, req, res, next) => {
	// Clean up any uploaded files if there was an error
	if (req.file || req.files) {
		cleanupTempFiles(req)
	}

	if (err instanceof multer.MulterError) {
		const message = getMulterErrorMessage(err)
		const apiError = new ApiError(400, message, [err.code])

		// Use the same error response format as asyncHandler
		return res.status(apiError.statusCode).json({
			statusCode: apiError.statusCode,
			data: apiError.data,
			message: apiError.message,
			success: apiError.success,
			errors: apiError.errors,
		})
	}

	// Handle other file upload related errors
	if (
		err &&
		err.message &&
		(err.message.includes('file') ||
			err.message.includes('upload') ||
			err.message.includes('image') ||
			err.message.includes('video'))
	) {
		const apiError = new ApiError(400, err.message)

		return res.status(apiError.statusCode).json({
			statusCode: apiError.statusCode,
			data: apiError.data,
			message: apiError.message,
			success: apiError.success,
			errors: apiError.errors,
		})
	}

	// If it's not a multer error, pass it to the next error handler
	next(err)
}

export {
	cleanupTempFiles,
	autoCleanupTemp,
	uploadImages,
	uploadVideo,
	uploadVideoWithThumbnail,
	validateFieldSpecificSizes,
	handleMulterError,
}
