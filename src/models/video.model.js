import mongoose from "mongoose";
import mongooseAggregationPaginate from 'mongoose-aggregate-paginate-v2';
const videoSchema = mongoose.Schema(
  {
    videoFile: {
      type: String, // it will be URL that we get from cloudnary(place to upload images and get url)
      required: true,
    },
    thumbnail: {
      type: String, // it will be URL that we get from cloudnary(place to upload images and get url)
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // cloudnary URL (we will see how we will get it from there)
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished:{
        type: Boolean,
        default:true,
    },
    owner: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ]
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregationPaginate);
export const Video = mongoose.model("Video", videoSchema);
