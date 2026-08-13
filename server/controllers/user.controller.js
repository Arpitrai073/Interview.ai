import User from "../models/user.model.js"
import asyncHandler from "../utils/asyncHandler.js"


export const getCurrentUser = asyncHandler("failed to get currentUser", async (req, res) => {
    const user = await User.findById(req.userId)
    if (!user) {
        return res.status(404).json({ message: "user does not found" })
    }
    return res.status(200).json(user)
})
