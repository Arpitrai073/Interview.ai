import axios from "axios"
import jwt from "jsonwebtoken"

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

let cachedCerts = null
let cachedCertsExpiry = 0

const getPublicCerts = async () => {
    if (cachedCerts && Date.now() < cachedCertsExpiry) {
        return cachedCerts
    }

    const { data, headers } = await axios.get(CERTS_URL)
    const maxAge = /max-age=(\d+)/.exec(headers["cache-control"] || "")

    cachedCerts = data
    cachedCertsExpiry = Date.now() + (maxAge ? Number(maxAge[1]) : 3600) * 1000

    return cachedCerts
}

export const verifyFirebaseIdToken = async (idToken) => {
    const projectId = process.env.FIREBASE_PROJECT_ID

    if (!projectId) {
        throw new Error("FIREBASE_PROJECT_ID is not configured")
    }

    const kid = jwt.decode(idToken, { complete: true })?.header?.kid

    if (!kid) {
        throw new Error("Identity token is missing a key id")
    }

    const certs = await getPublicCerts()
    const cert = certs[kid]

    if (!cert) {
        throw new Error("Identity token was signed with an unknown key")
    }

    const payload = jwt.verify(idToken, cert, {
        algorithms: ["RS256"],
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
    })

    if (!payload.sub || !payload.email) {
        throw new Error("Identity token is missing subject or email")
    }

    if (payload.email_verified === false) {
        throw new Error("Identity token email is not verified")
    }

    return {
        uid: payload.sub,
        email: String(payload.email).toLowerCase(),
        name: payload.name || String(payload.email).split("@")[0],
    }
}
