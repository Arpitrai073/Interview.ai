// Wraps a controller so a thrown error becomes a 500 response with `errorMessage`.
const asyncHandler = (errorMessage, handler) => async (req, res, next) => {
    try {
        await handler(req, res, next)
    } catch (error) {
        console.error(errorMessage, error)
        return res.status(500).json({ message: `${errorMessage} ${error}` })
    }
}

export default asyncHandler
