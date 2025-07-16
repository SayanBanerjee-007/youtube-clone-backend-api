import { Schema, model } from 'mongoose'

const playlistSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		isPublic: {
			type: Boolean,
			default: true,
		},
		videos: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Video',
			},
		],
	},
	{ timestamps: true }
)

const Playlist = model('Playlist', playlistSchema)

export { Playlist }
