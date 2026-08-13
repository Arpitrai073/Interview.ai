import axios from "axios"
import ApiError from "../utils/ApiError.js"

export const askAi = async (messages) => {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new Error("Messages array is empty.");
    }

    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is not configured")
    }

    let response
    try {
        response = await axios.post("https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: messages

            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
    } catch (error) {
        console.error("OpenRouter Error:", error.response?.status, error.response?.data || error.message);

        const status = error.response?.status
        if (status === 429) {
            throw new ApiError(429, "The AI service is rate limited. Please try again in a moment.", { cause: error })
        }
        if (status === 401 || status === 403) {
            throw new ApiError(502, "The AI service rejected our credentials.", { cause: error })
        }
        throw new ApiError(502, "The AI service is unavailable. Please try again.", { cause: error })
    }

    const content = response?.data?.choices?.[0]?.message?.content;

    if (!content || !content.trim()) {
        throw new ApiError(502, "The AI service returned an empty response. Please try again.")
    }

    return content
}

/**
 * Parses a JSON object out of an AI response, tolerating markdown code fences.
 */
export const parseAiJson = (aiResponse) => {
    const cleaned = aiResponse
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim()

    try {
        return JSON.parse(cleaned)
    } catch (error) {
        console.error("Failed to parse AI JSON response:", aiResponse)
        throw new ApiError(502, "The AI service returned an unexpected response. Please try again.", { cause: error })
    }
}
