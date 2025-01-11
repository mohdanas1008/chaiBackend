import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // to enable searching in any field. best to use index. it optimizes
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // it will be URL that we get from cloudnary(place to upload images and get url)
      required: true,
    },
    coverImage: {
      type: String, // it will be URL that we get from cloudnary(place to upload images and get url)
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Passwrod is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// hashing the passwrod( using bcrypt) and then storing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// creating a function to check if user has given correct password.
// creating a custome methos using mongoose

// NOTE: using this we are getting the stored data. as this is having reference to data
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  returnjwt.sign({
    _id: this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn:process.env.ACCESS_TOKEN_EXPIRY
  }
);
};
userSchema.methods.generateRefreshToken = async function () {
  returnjwt.sign({
    _is: this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn:process.env.REFRESH_TOKEN_EXPIRY
  }
);
};

export const User = mongoose.model("User", userSchema);
