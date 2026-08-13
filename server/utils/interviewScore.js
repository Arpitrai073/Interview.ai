const average = (total, count) => (count ? total / count : 0)

const round = (value) => Number(value.toFixed(1))

// Averages the per-question scores of an interview, rounded to one decimal.
export const calculateInterviewScores = (questions = []) => {
    const totals = questions.reduce((acc, q) => ({
        score: acc.score + (q.score || 0),
        confidence: acc.confidence + (q.confidence || 0),
        communication: acc.communication + (q.communication || 0),
        correctness: acc.correctness + (q.correctness || 0),
    }), { score: 0, confidence: 0, communication: 0, correctness: 0 })

    const count = questions.length

    return {
        finalScore: average(totals.score, count),
        confidence: round(average(totals.confidence, count)),
        communication: round(average(totals.communication, count)),
        correctness: round(average(totals.correctness, count)),
    }
}

export const toQuestionWiseScore = (questions = []) => questions.map((q) => ({
    question: q.question,
    score: q.score || 0,
    feedback: q.feedback || "",
    confidence: q.confidence || 0,
    communication: q.communication || 0,
    correctness: q.correctness || 0,
}))

export { round }
