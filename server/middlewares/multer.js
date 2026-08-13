import multer from "multer";
import fs from "fs";
import ApiError from "../utils/ApiError.js";

const uploadDir = "public"

fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: function(req, file , cb){
        cb(null , uploadDir)
    },
    filename: function(req , file , cb){
        const filename = Date.now() + "-" + file.originalname;
        cb(null , filename)
    }
})


export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req , file , cb){
        if(file.mimetype !== "application/pdf"){
            return cb(new ApiError(400 , "Only PDF resumes are supported."))
        }
        cb(null , true)
    }
});
