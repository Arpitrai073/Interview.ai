import genToken from "../config/token.js"
import User from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"


export const googleAuth = async (req,res,next) => {
    try {
        const {name , email} = req.body

        if(!name || !email){
            throw new ApiError(400 , "Name and email are required.")
        }

        let user = await User.findOne({email})
        if(!user){
            user = await User.create({
                name , 
                email
            })
        }
        let token = await genToken(user._id)
        res.cookie("token" , token , {
            httpOnly:true,
            secure:true,
            sameSite:"none",
            maxAge:7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json(user)



    } catch (error) {
        return next(error)
    }
    
}

export const logOut = async (req,res,next) => {
    try {
        res.clearCookie("token" , {
            httpOnly:true,
            secure:true,
            sameSite:"none"
        })
        return res.status(200).json({message:"LogOut Successfully"})
    } catch (error) {
        return next(error)
    }
    
}
