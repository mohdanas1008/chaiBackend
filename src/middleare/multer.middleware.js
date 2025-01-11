import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4();
    // once problem can occur when path.extname not used(i.e file is saved without extension as we also have not added it)
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

export const upload = multer({ storage: storage });