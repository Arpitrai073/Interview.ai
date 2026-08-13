import genToken from "../config/token.js"
import User from "../models/user.model.js"
import asyncHandler from "../utils/asyncHandler.js"

const TOKEN_COOKIE_OPTIONS = {
    http: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000
}

export const googleAuth = asyncHandler("Google auth error", async (req, res) => {
    const { name, email } = req.body
    let user = await User.findOne({ email })
    if (!user) {
        user = await User.create({
            name,
            email
        })
    }
    let token = await genToken(user._id)
    res.cookie("token", token, TOKEN_COOKIE_OPTIONS)

    return res.status(200).json(user)
})

export const logOut = asyncHandler("Logout error", async (req, res) => {
    await res.clearCookie("token")
    return res.status(200).json({ message: "LogOut Successfully" })
})
