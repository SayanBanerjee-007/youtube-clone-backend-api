import { Schema, model } from 'mongoose'

const tweetSchema = new Schema(
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
  },
  { timestamps: true }
)

const Tweet = model('Tweet', tweetSchema)

export { Tweet }
