import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const uploadDir = path.join(process.cwd(), "public")

fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: function(req, file , cb){
        cb(null , uploadDir)
    },
    filename: function(req , file , cb){
        cb(null , `${Date.now()}-${crypto.randomUUID()}.pdf`)
    }
})

const fileFilter = (req, file, cb) => {
    const isPdf =
        file.mimetype === "application/pdf" &&
        path.extname(file.originalname).toLowerCase() === ".pdf"

    if (!isPdf) {
        const error = new Error("Only PDF resumes are allowed")
        error.status = 400
        return cb(error)
    }

    cb(null, true)
}


export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB limit
});
