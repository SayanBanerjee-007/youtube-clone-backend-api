import connectDB from './databases/index.js'
import { app } from './app.js'
import { PORT } from './constants.js'

connectDB()
	.then(() => {
		app.on('error', error => {
			console.error('App Error:', error) // Keep error logging
			throw error
		})
		app.listen(PORT || 8000, () => {
			// console.log(`Server is running at: http://localhost:${PORT}`) // Commented for production
		})
	})
	.catch(error => {
		console.error('MongoDB Connection Failed:', error) // Keep error logging
	})
