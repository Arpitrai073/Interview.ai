import jwt from "jsonwebtoken"
import ApiError from "../utils/ApiError.js"

const isAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies

        if (!token) {
            throw new ApiError(401, "Not authenticated. Please sign in.")
        }

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET)

        req.userId = verifyToken.userId

        next()
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return next(new ApiError(401, "Session expired or invalid. Please sign in again.", { cause: error }))
        }
        return next(error)
    }
}

export default isAuth
