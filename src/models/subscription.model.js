import { Schema, model } from 'mongoose'

const subscriptionSchema = new Schema(
  {
    channel: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

const Subscription = model('Subscription', subscriptionSchema)

export { Subscription }
