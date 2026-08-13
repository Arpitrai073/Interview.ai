/**
 * Turns an axios/network/unknown error into a message that can be shown to the user.
 */
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
    const serverMessage = error?.response?.data?.message

    if (typeof serverMessage === "string" && serverMessage.trim()) {
        return serverMessage
    }

    if (error?.code === "ERR_NETWORK") {
        return "Cannot reach the server. Check your connection and try again."
    }

    if (error?.response?.status === 401) {
        return "Your session expired. Please sign in again."
    }

    return fallback
}
