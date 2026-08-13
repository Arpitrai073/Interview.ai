import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi, askAiJson, buildMessages } from "../services/openRouter.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { calculateInterviewScores, round, toQuestionWiseScore } from "../utils/interviewScore.js";

const RESUME_PROMPT = `
Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
`

const QUESTIONS_PROMPT = `
You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy  
Question 2 → easy  
Question 3 → medium  
Question 4 → medium  
Question 5 → hard  

Make questions based on the candidate’s role, experience,interviewMode, projects, skills, and resume details.
`

const EVALUATION_PROMPT = `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
`

const QUESTION_DIFFICULTIES = ["easy", "easy", "medium", "medium", "hard"]
const QUESTION_TIME_LIMITS = [60, 60, 90, 90, 120]

const removeFile = (filepath) => {
  if (filepath && fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
  }
}

const extractPdfText = async (filepath) => {
  const fileBuffer = await fs.promises.readFile(filepath)
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;

  let text = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    text += content.items.map(item => item.str).join(" ") + "\n";
  }

  return text.replace(/\s+/g, " ").trim();
}

const listOrNone = (values) => (Array.isArray(values) && values.length ? values.join(", ") : "None")

export const analyzeResume = asyncHandler("failed to analyze resume", async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Resume required" });
  }

  const filepath = req.file.path

  try {
    const resumeText = await extractPdfText(filepath)

    const parsed = await askAiJson(buildMessages(RESUME_PROMPT, resumeText))

    res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      resumeText
    });
  } finally {
    removeFile(filepath)
  }
});


export const generateQuestion = asyncHandler("failed to create interview", async (req, res) => {
  let { role, experience, mode, resumeText, projects, skills } = req.body

  role = role?.trim();
  experience = experience?.trim();
  mode = mode?.trim();

  if (!role || !experience || !mode) {
    return res.status(400).json({ message: "Role, Experience and Mode are required." })
  }

  const user = await User.findById(req.userId)

  if (!user) {
    return res.status(404).json({
      message: "User not found."
    });
  }

  if (user.credits < 50) {
    return res.status(400).json({
      message: "Not enough credits. Minimum 50 required."
    });
  }

  const safeResume = resumeText?.trim() || "None";

  const userPrompt = `
    Role:${role}
    Experience:${experience}
    InterviewMode:${mode}
    Projects:${listOrNone(projects)}
    Skills:${listOrNone(skills)},
    Resume:${safeResume}
    `;

  const aiResponse = await askAi(buildMessages(QUESTIONS_PROMPT, userPrompt))

  if (!aiResponse || !aiResponse.trim()) {
    return res.status(500).json({
      message: "AI returned empty response."
    });
  }

  const questionsArray = aiResponse
    .split("\n")
    .map(q => q.trim())
    .filter(q => q.length > 0)
    .slice(0, 5);

  if (questionsArray.length === 0) {
    return res.status(500).json({
      message: "AI failed to generate questions."
    });
  }

  user.credits -= 50;
  await user.save();

  const interview = await Interview.create({
    userId: user._id,
    role,
    experience,
    mode,
    resumeText: safeResume,
    questions: questionsArray.map((q, index) => ({
      question: q,
      difficulty: QUESTION_DIFFICULTIES[index],
      timeLimit: QUESTION_TIME_LIMITS[index],
    }))
  })

  res.json({
    interviewId: interview._id,
    creditsLeft: user.credits,
    userName: user.name,
    questions: interview.questions
  });
})


export const submitAnswer = asyncHandler("failed to submit answer", async (req, res) => {
  const { interviewId, questionIndex, answer, timeTaken } = req.body

  const interview = await Interview.findById(interviewId)
  const question = interview.questions[questionIndex]

  // If no answer
  if (!answer) {
    question.score = 0;
    question.feedback = "You did not submit an answer.";
    question.answer = "";

    await interview.save();

    return res.json({
      feedback: question.feedback
    });
  }

  // If time exceeded
  if (timeTaken > question.timeLimit) {
    question.score = 0;
    question.feedback = "Time limit exceeded. Answer not evaluated.";
    question.answer = answer;

    await interview.save();

    return res.json({
      feedback: question.feedback
    });
  }

  const parsed = await askAiJson(buildMessages(EVALUATION_PROMPT, `
Question: ${question.question}
Answer: ${answer}
`))

  question.answer = answer;
  question.confidence = parsed.confidence;
  question.communication = parsed.communication;
  question.correctness = parsed.correctness;
  question.score = parsed.finalScore;
  question.feedback = parsed.feedback;
  await interview.save();

  return res.status(200).json({ feedback: parsed.feedback })
})


export const finishInterview = asyncHandler("failed to finish Interview", async (req, res) => {
  const { interviewId } = req.body
  const interview = await Interview.findById(interviewId)
  if (!interview) {
    return res.status(400).json({ message: "failed to find Interview" })
  }

  const scores = calculateInterviewScores(interview.questions)

  interview.finalScore = scores.finalScore;
  interview.status = "completed";

  await interview.save();

  return res.status(200).json({
    ...scores,
    finalScore: round(scores.finalScore),
    questionWiseScore: toQuestionWiseScore(interview.questions),
  })
})


export const getMyInterviews = asyncHandler("failed to find currentUser Interview", async (req, res) => {
  const interviews = await Interview.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .select("role experience mode finalScore status createdAt");

  return res.status(200).json(interviews)
})

export const getInterviewReport = asyncHandler("failed to find currentUser Interview report", async (req, res) => {
  const interview = await Interview.findById(req.params.id)

  if (!interview) {
    return res.status(404).json({ message: "Interview not found" });
  }

  const { confidence, communication, correctness } = calculateInterviewScores(interview.questions)

  return res.json({
    finalScore: interview.finalScore,
    confidence,
    communication,
    correctness,
    questionWiseScore: interview.questions
  });
})
