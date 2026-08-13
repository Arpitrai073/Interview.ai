import jwt from "jsonwebtoken"
import asyncHandler from "../utils/asyncHandler.js"


const isAuth = asyncHandler("isAuth error", async (req, res, next) => {
    let { token } = req.cookies

    if (!token) {
        return res.status(400).json({ message: "user does not have a token" })
    }
    const verifyToken = jwt.verify(token, process.env.JWT_SECRET)

    if (!verifyToken) {
        return res.status(400).json({ message: "user does not have a valid token" })
    }
    req.userId = verifyToken.userId

    next()
})

export default isAuth
