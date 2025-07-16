import { Schema, model } from 'mongoose'

const commentSchema = new Schema(
	{
		content: {
			type: String,
			required: true,
			trim: true,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		video: {
			type: Schema.Types.ObjectId,
			ref: 'Video',
			required: true,
		},
	},
	{ timestamps: true }
)

const Comment = model('Comment', commentSchema)

export { Comment }
