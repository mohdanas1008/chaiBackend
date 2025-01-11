// require('dotenv').config();  old syntax.
import dotenv from "dotenv";
import connectDB from "./dbmiddlewares/db.js";
import { app } from "./app.js";

dotenv.config({
  path: './.env',
}); // new syntex
// we can use only 1 of 2. either import or require one.

// when an async function returns it return's a promis as well.
connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Listening on port:", process.env.PORT);
    });
  })
  .catch((error) => {
    console.log("mongoDB connection error!!!", error);
  });
