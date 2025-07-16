import fs from 'fs'
import path from 'path'
import multer from 'multer'

/**
 * Multer configuration for file uploads
 * Handles file storage with proper error checking and validation
 */

// Ensure upload directory exists
const uploadDir = './public/temp'
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * Cleanup uploaded files from temp directory
 * Call this after successful upload to cloud or on error
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
 * Middleware to automatically cleanup temp files after request completion
 * This runs after all middlewares and controllers have finished
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
 * Storage configuration for multer
 * Files are stored in ./public/temp with timestamped filenames
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
 * File filters for specific file types
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
 * Upload configurations for different file types with specific size limits
 */

// For any images  - 2MB limit
const uploadImages = multer({
	storage,
	fileFilter: imageFileFilter,
	limits: {
		fileSize: 2 * 1024 * 1024, // 2MB
		files: 2,
	},
})

// For video files - 100MB limit
const uploadVideo = multer({
	storage,
	fileFilter: videoFileFilter,
	limits: {
		fileSize: 100 * 1024 * 1024, // 100MB for videos
		files: 1,
	},
})

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
				const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
				if (allowedImageTypes.includes(file.mimetype)) {
					cb(null, true)
				} else {
					cb(new Error('Thumbnail must be JPEG, PNG, GIF, or WebP'), false)
				}
			} else {
				cb(new Error(`Invalid field name: ${file.fieldname}. Only videoFile and thumbnail are allowed`), false)
			}
		} catch (error) {
			cb(new Error('File validation failed'), false)
		}
	},
	limits: {
		fileSize: 100 * 1024 * 1024, // 100MB max (will validate per field)
		files: 2, // Video + Thumbnail
	},
})

// For document uploads - 10MB limit
// export const uploadDocument = multer({
//   storage,
//   fileFilter: documentFileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB
//     files: 3,
//   },
// })

/**
 * Custom middleware to validate file sizes based on field names
 * Use this with uploadVideoWithThumbnail for field-specific size limits
 */
const validateFieldSpecificSizes = (req, res, next) => {
	try {
		if (req.files) {
			// Validate video file size (100MB limit)
			if (req.files.videoFile && req.files.videoFile[0]) {
				const videoFile = req.files.videoFile[0]
				const videoSizeLimit = 100 * 1024 * 1024 // 100MB
				if (videoFile.size > videoSizeLimit) {
					return res.status(400).json({
						success: false,
						message: 'Video file size cannot exceed 100MB',
						statusCode: 400,
					})
				}
			}

			// Validate thumbnail file size (2MB limit)
			if (req.files.thumbnail && req.files.thumbnail[0]) {
				const thumbnailFile = req.files.thumbnail[0]
				const thumbnailSizeLimit = 2 * 1024 * 1024 // 2MB
				if (thumbnailFile.size > thumbnailSizeLimit) {
					return res.status(400).json({
						success: false,
						message: 'Thumbnail file size cannot exceed 2MB',
						statusCode: 400,
					})
				}
			}
		}
		next()
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'File size validation failed',
			statusCode: 500,
		})
	}
}

export {
	cleanupTempFiles,
	autoCleanupTemp,
	uploadImages,
	uploadVideo,
	uploadVideoWithThumbnail,
	validateFieldSpecificSizes,
}
