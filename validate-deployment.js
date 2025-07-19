#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Checks if the application is ready for production deployment
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 YouTube Clone Backend - Pre-Deployment Validation\n')

const checks = []
let passed = 0
let failed = 0

// Helper function to add check result
function addCheck(name, condition, message) {
	checks.push({ name, passed: condition, message })
	if (condition) {
		console.log(`✅ ${name}`)
		passed++
	} else {
		console.log(`❌ ${name}: ${message}`)
		failed++
	}
}

// Check 1: Environment file exists
const envExists = fs.existsSync(path.join(__dirname, '.env'))
addCheck('Environment file exists', envExists, 'Create .env file from .env.example')

// Check 2: Load environment variables
let envVars = {}
if (envExists) {
	try {
		const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
		envContent.split('\n').forEach(line => {
			const [key, value] = line.split('=')
			if (key && value) {
				envVars[key.trim()] = value.trim()
			}
		})
	} catch (error) {
		console.log('Error reading .env file:', error.message)
	}
}

// Check 3: Required environment variables
const requiredEnvVars = [
	'MONGODB_URI',
	'CORS_ORIGIN',
	'ACCESS_TOKEN_SECRET',
	'REFRESH_TOKEN_SECRET',
	'CLOUDINARY_CLOUD_NAME',
	'CLOUDINARY_API_KEY',
	'CLOUDINARY_API_SECRET',
]

requiredEnvVars.forEach(varName => {
	const exists = envVars[varName] && envVars[varName] !== 'your-placeholder-value'
	addCheck(`${varName} is set`, exists, `Set ${varName} in .env file`)
})

// Check 4: NODE_ENV is production
const nodeEnv = envVars['NODE_ENV']
addCheck('NODE_ENV is production', nodeEnv === 'production', 'Set NODE_ENV=production in .env file')

// Check 5: CORS_ORIGIN is not localhost
const corsOrigin = envVars['CORS_ORIGIN']
const isValidCorsOrigin =
	corsOrigin && !corsOrigin.includes('localhost') && !corsOrigin.includes('127.0.0.1')
addCheck(
	'CORS_ORIGIN is production domain',
	isValidCorsOrigin,
	'Set CORS_ORIGIN to your production domain (not localhost)'
)

// Check 6: MongoDB URI is production
const mongoUri = envVars['MONGODB_URI']
const isProductionMongo = mongoUri && mongoUri.includes('mongodb+srv://')
addCheck(
	'MongoDB URI is production (Atlas)',
	isProductionMongo,
	'Use MongoDB Atlas connection string for production'
)

// Check 7: JWT secrets are strong
const accessSecret = envVars['ACCESS_TOKEN_SECRET']
const refreshSecret = envVars['REFRESH_TOKEN_SECRET']
const strongAccessSecret = accessSecret && accessSecret.length >= 64
const strongRefreshSecret = refreshSecret && refreshSecret.length >= 64

addCheck(
	'ACCESS_TOKEN_SECRET is strong',
	strongAccessSecret,
	'Use a strong secret (64+ characters)'
)

addCheck(
	'REFRESH_TOKEN_SECRET is strong',
	strongRefreshSecret,
	'Use a strong secret (64+ characters)'
)

// Check 8: Package.json has required scripts
const packageJsonPath = path.join(__dirname, 'package.json')
let packageJson = {}
try {
	packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
} catch (error) {
	console.log('Error reading package.json:', error.message)
}

const hasStartScript = packageJson.scripts && packageJson.scripts.start
addCheck(
	'Start script exists',
	hasStartScript,
	'Add "start": "node src/index.js" to package.json scripts'
)

// Check 9: No console.log in production files (basic check)
const srcFiles = ['src/app.js', 'src/index.js']
let hasConsoleLog = false
srcFiles.forEach(file => {
	const filePath = path.join(__dirname, file)
	if (fs.existsSync(filePath)) {
		const content = fs.readFileSync(filePath, 'utf8')
		if (content.includes('console.log') && !content.includes('// console.log')) {
			hasConsoleLog = true
		}
	}
})

addCheck(
	'No debug console.log statements',
	!hasConsoleLog,
	'Remove or comment out console.log statements in production files'
)

// Check 10: Dependencies are installed
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'))
addCheck('Dependencies installed', nodeModulesExists, 'Run npm install to install dependencies')

// Summary
console.log('\n📊 Validation Summary:')
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📋 Total: ${checks.length}`)

if (failed === 0) {
	console.log('\n🎉 All checks passed! Your application is ready for deployment.')
	console.log('\n📋 Next steps:')
	console.log('1. Commit your changes to Git')
	console.log('2. Deploy to your hosting platform')
	console.log('3. Set environment variables on the server')
	console.log('4. Test the deployed API endpoints')
	console.log('5. Update your frontend to use the production API URL')
} else {
	console.log('\n⚠️  Please fix the failed checks before deploying to production.')
	console.log('\n🔧 Common fixes:')
	console.log('- Copy .env.example to .env and fill in production values')
	console.log('- Generate strong JWT secrets using crypto.randomBytes(64).toString("hex")')
	console.log('- Set up MongoDB Atlas for production database')
	console.log('- Configure Cloudinary for file uploads')
	console.log('- Set CORS_ORIGIN to your frontend domain')
}

console.log('\n📚 For detailed deployment instructions, see DEPLOYMENT.md')

process.exit(failed > 0 ? 1 : 0)
