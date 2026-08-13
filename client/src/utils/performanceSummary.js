const TIERS = [
    {
        minScore: 8,
        performanceText: "Ready for job opportunities.",
        shortTagline: "Excellent clarity and structured responses.",
        advice: "Excellent performance. Maintain confidence and structure. Continue refining clarity and supporting answers with strong real-world examples.",
    },
    {
        minScore: 5,
        performanceText: "Needs minor improvement before interviews.",
        shortTagline: "Good foundation, refine articulation.",
        advice: "Good foundation shown. Improve clarity and structure. Practice delivering concise, confident answers with stronger supporting examples.",
    },
    {
        minScore: 0,
        performanceText: "Significant improvement required.",
        shortTagline: "Work on clarity and confidence.",
        advice: "Significant improvement required. Focus on structured thinking, clarity, and confident delivery. Practice answering aloud regularly.",
    },
]

export const getPerformanceSummary = (finalScore) =>
    TIERS.find((tier) => finalScore >= tier.minScore) ?? TIERS[TIERS.length - 1]
