import express from "express"
import dotenv from "dotenv"
import connectDb from "./config/connectDb.js"
import cookieParser from "cookie-parser"
dotenv.config()
import cors from "cors"
import authRouter from "./routes/auth.route.js"
import userRouter from "./routes/user.route.js"
import interviewRouter from "./routes/interview.route.js"
import paymentRouter from "./routes/payment.route.js"
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js"

const app = express()
app.use(cors({
    origin:"https://interview-ai-mpbk.onrender.com",
    credentials:true
}))

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth" , authRouter)
app.use("/api/user", userRouter)
app.use("/api/interview" , interviewRouter)
app.use("/api/payment" , paymentRouter)

app.use(notFoundHandler)
app.use(errorHandler)

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason)
})

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error)
    process.exit(1)
})

const PORT = process.env.PORT || 6000

const start = async () => {
    await connectDb()
    app.listen(PORT , ()=>{
        console.log(`Server running on port ${PORT}`)
    })
}

start().catch((error) => {
    console.error("Failed to start server:", error)
    process.exit(1)
})
