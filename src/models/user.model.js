import { Schema, model } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {
	ACCESS_TOKEN_EXPIRY,
	ACCESS_TOKEN_SECRET,
	REFRESH_TOKEN_EXPIRY,
	REFRESH_TOKEN_SECRET,
} from '../constants.js'

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
			minlength: 5,
		},
		email: {
			type: String,
			required: [true, 'Email is required to create a user.'],
			lowercase: true,
			unique: [true, 'Email must be unique.'],
			trim: true,
		},
		fullName: {
			type: String,
			required: [true, 'Full name is required to create a user.'],
			trim: true,
			minlength: [3, 'Full name must contain at least 3 characters'],
		},
		avatar: {
			type: String,
		},
		coverImage: {
			type: String,
		},
		watchHistory: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Video',
			},
		],
		password: {
			type: String,
			required: [true, 'Password is required to create a user.'],
		},
		refreshToken: {
			type: String,
		},
	},
	{ timestamps: true }
)

userSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 12)
	}
	next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
	if (typeof password !== 'string') {
		throw new TypeError('Password must be of type string.')
	}
	return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
	return jwt.sign(
		{
			_id: this._id,
			email: this.email,
			username: this.username,
			fullName: this.fullName,
		},
		ACCESS_TOKEN_SECRET,
		{
			expiresIn: ACCESS_TOKEN_EXPIRY,
		}
	)
}

userSchema.methods.generateRefreshToken = function () {
	return jwt.sign(
		{
			_id: this._id,
		},
		REFRESH_TOKEN_SECRET,
		{
			expiresIn: REFRESH_TOKEN_EXPIRY,
		}
	)
}
const User = model('User', userSchema)

export { User }
