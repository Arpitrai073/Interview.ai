import multer from "multer"
import ApiError from "../utils/ApiError.js"

export const notFoundHandler = (req, res) => {
    return res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

export const errorHandler = (err, req, res, next) => {
    console.error(`[${req.method} ${req.originalUrl}]`, err)

    if (res.headersSent) {
        return next(err)
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message })
    }

    if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "File is too large. Maximum size is 5MB."
            : `File upload failed: ${err.message}`
        return res.status(400).json({ message })
    }

    if (err?.name === "ValidationError") {
        return res.status(400).json({ message: err.message })
    }

    if (err?.name === "CastError") {
        return res.status(400).json({ message: `Invalid value for ${err.path}` })
    }

    if (err?.code === 11000) {
        return res.status(409).json({ message: "Resource already exists." })
    }

    return res.status(500).json({ message: "Something went wrong. Please try again." })
}
