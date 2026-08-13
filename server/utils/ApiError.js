/**
 * Error carrying an HTTP status and a message that is safe to send to clients.
 */
class ApiError extends Error {
    constructor(statusCode, message, options) {
        super(message, options)
        this.name = "ApiError"
        this.statusCode = statusCode
    }
}

export default ApiError
