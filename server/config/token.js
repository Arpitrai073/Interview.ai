import jwt from "jsonwebtoken"

export const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const isProduction = process.env.NODE_ENV === "production"

export const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
}

const genToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured")
    }

    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

export default genToken
