const performFetch = async (url, options) => {
  if (typeof fetch !== 'undefined') {
    return fetch(url, options);
  }
  const nodeFetch = (await import('node-fetch')).default;
  return nodeFetch(url, options);
};

const GEMINI_API_VERSION = 'v1beta';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const normalizeModelName = (model) => (model || DEFAULT_GEMINI_MODEL).replace(/^models\//, '');

const buildGenerateContentUrl = (apiKey, model) => (
  `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${normalizeModelName(model)}:generateContent?key=${apiKey}`
);

const isModelUnavailable = (data) => {
  const message = data?.error?.message || '';
  return message.includes('is not found') || message.includes('not supported for generateContent');
};

const pickGenerateContentModel = (models) => {
  const supported = (models || [])
    .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
    .map(model => normalizeModelName(model.name))
    .filter(model => !model.toLowerCase().includes('image'));

  const preferredModels = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-3-flash',
    'gemini-3-pro',
    'gemini-2.5-pro'
  ];

  return preferredModels.find(model => supported.includes(model))
    || supported.find(model => model.includes('flash'))
    || supported[0];
};

const fetchFallbackModel = async (apiKey) => {
  const response = await performFetch(
    `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models?key=${apiKey}`
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Unable to list Gemini models');
  }

  const model = pickGenerateContentModel(data.models);
  if (!model) {
    throw new Error('No Gemini models supporting generateContent were found for this API key');
  }
  return model;
};

const requestGeminiScreening = async (apiKey, model, prompt, resumeFile) => {
  const parts = [{ text: prompt }];

  if (resumeFile?.base64 && resumeFile?.mimeType) {
    parts.push({
      inline_data: {
        mime_type: resumeFile.mimeType,
        data: resumeFile.base64
      }
    });
  }

  const response = await performFetch(
    buildGenerateContentUrl(apiKey, model),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  const data = await response.json();
  return { response, data };
};

const screenResumeWithGemini = async ({ jobTitle, jobDescription, candidateName, email, experience, skills, phone, coverLetter, resumeText, resumeFile }) => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const skillsList = Array.isArray(skills) ? skills.join(', ') : skills;
  const skillsContext = skillsList
    ? `Candidate-provided skills, if any: ${skillsList}`
    : 'No manual skills field was collected. Infer the candidate skills from the uploaded resume content.';

  const hasResumeFile = Boolean(resumeFile?.base64 && resumeFile?.mimeType);

  const prompt = `You are an expert HR resume screening AI. Analyze this job application and return ONLY valid JSON (no markdown, no code fences).

IMPORTANT:
- The uploaded resume PDF is attached to this request${hasResumeFile ? ` as ${resumeFile.fileName || 'a PDF document'}` : ' only when available'}.
- Read the attached resume carefully and use it as the primary source for candidate skills, tools, projects, and experience.
- The extracted resume text below is only a backup. If it is incomplete, oddly ordered, or missing details, rely on the attached PDF document.
- Do not mark a required skill as missing if it appears anywhere in the attached resume or extracted resume text, including project descriptions, summaries, experience bullets, or skills sections.
- Score the candidate by matching the job description against the resume evidence.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}

CANDIDATE:
- Name: ${candidateName}
- Email: ${email}
- Phone: ${phone || 'Not provided'}
- Years of Experience: ${experience}
- ${skillsContext}
- Cover Letter: ${coverLetter || 'Not provided'}

EXTRACTED RESUME TEXT BACKUP:
${resumeText || 'No extracted text was available. Read the attached PDF resume directly.'}

Return this exact JSON structure:
{
  "aiScore": <number 0-100>,
  "skillsMatch": ["matched skill 1", "matched skill 2"],
  "skillsMissing": ["missing skill 1", "missing skill 2"],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1"],
  "experienceAnalysis": "Brief analysis of experience relevance",
  "overallAssessment": "2-3 sentence overall assessment",
  "recommendation": "Short recommendation: Proceed to Interview / Hold for Review / Reject",
  "summary": "Executive summary for HR dashboard"
}`;

  let model = normalizeModelName(process.env.GEMINI_MODEL);
  let { response, data } = await requestGeminiScreening(API_KEY, model, prompt, resumeFile);

  if (!response.ok && isModelUnavailable(data)) {
    model = await fetchFallbackModel(API_KEY);
    ({ response, data } = await requestGeminiScreening(API_KEY, model, prompt, resumeFile));
  }

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini screening request failed');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Gemini returned an invalid screening response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const score = Number(parsed.aiScore);
  if (!Number.isFinite(score)) {
    throw new Error('Gemini returned a missing or invalid AI score');
  }
  parsed.aiScore = Math.min(100, Math.max(0, Math.round(score)));

  return parsed;
};

module.exports = { screenResumeWithGemini };
