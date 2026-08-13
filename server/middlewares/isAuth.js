import jwt from "jsonwebtoken"


const isAuth = async (req,res,next) => {
    try {
        const {token} = req.cookies

        if(!token){
            return res.status(401).json({message:"Authentication required"})
        }

        const verifyToken = jwt.verify(token , process.env.JWT_SECRET)

        if(!verifyToken?.userId){
            return res.status(401).json({message:"Invalid token"})
        }
        req.userId = verifyToken.userId

        next()
   

    } catch (error) {
        console.error("isAuth error:", error.message)
        return res.status(401).json({message:"Invalid or expired token"})
    }
    
}

export default isAuth
