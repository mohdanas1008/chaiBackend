import { timeStamp } from "console";
import { channel } from "diagnostics_channel";
import mongoose, { mongo } from "mongoose";

const subscriptionSchema = mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // one who subscribes to channel
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, // // one who's channel got subscribed
      ref: "User",
    },
  },
  {
    timeStamp: true,
  }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
