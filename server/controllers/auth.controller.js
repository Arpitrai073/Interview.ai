import genToken, { cookieOptions, TOKEN_MAX_AGE } from "../config/token.js"
import User from "../models/user.model.js"
import { verifyFirebaseIdToken } from "../services/firebase.service.js"


export const googleAuth = async (req,res) => {
    try {
        const {idToken} = req.body

        if(typeof idToken !== "string" || !idToken.trim()){
            return res.status(400).json({message:"idToken is required"})
        }

        let identity
        try {
            identity = await verifyFirebaseIdToken(idToken)
        } catch (error) {
            console.error("Google auth token verification failed:", error.message)
            return res.status(401).json({message:"Invalid or expired sign-in token"})
        }

        let user = await User.findOne({email: identity.email})
        if(!user){
            user = await User.create({
                name: identity.name,
                email: identity.email
            })
        }
        const token = genToken(user._id)
        res.cookie("token" , token , {
            ...cookieOptions,
            maxAge: TOKEN_MAX_AGE
        })

        return res.status(200).json(user)



    } catch (error) {
        console.error("Google auth error:", error)
        return res.status(500).json({message:"Google auth failed"})
    }
    
}

export const logOut = async (req,res) => {
    try {
        res.clearCookie("token", cookieOptions)
        return res.status(200).json({message:"LogOut Successfully"})
    } catch (error) {
        console.error("Logout error:", error)
        return res.status(500).json({message:"Logout failed"})
    }
    
}
