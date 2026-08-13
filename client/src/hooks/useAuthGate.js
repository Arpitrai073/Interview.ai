import { useState } from "react"
import { useSelector } from "react-redux"

// Runs an action only when signed in, otherwise asks the caller to show AuthModel.
export const useAuthGate = () => {
    const { userData } = useSelector((state) => state.user)
    const [showAuth, setShowAuth] = useState(false)

    const requireAuth = (action) => {
        if (!userData) {
            setShowAuth(true)
            return
        }
        action()
    }

    return { userData, showAuth, setShowAuth, requireAuth }
}

export default useAuthGate
