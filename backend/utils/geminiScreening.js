const performFetch = async (url, options) => {
  if (typeof fetch !== 'undefined') {
    return fetch(url, options);
  }
  const nodeFetch = (await import('node-fetch')).default;
  return nodeFetch(url, options);
};

const screenResumeWithGemini = async ({ jobTitle, jobDescription, candidateName, email, experience, skills, phone, coverLetter, resumeText }) => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const skillsList = Array.isArray(skills) ? skills.join(', ') : (skills || 'Not specified');

  const prompt = `You are an expert HR resume screening AI. Analyze this job application and return ONLY valid JSON (no markdown, no code fences).

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}

CANDIDATE:
- Name: ${candidateName}
- Email: ${email}
- Phone: ${phone || 'Not provided'}
- Years of Experience: ${experience}
- Skills: ${skillsList}
- Cover Letter: ${coverLetter || 'Not provided'}
- Resume Content: ${resumeText || 'Resume text could not be extracted. Base analysis on provided application data only.'}

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

  const response = await performFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Gemini returned an invalid screening response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  parsed.aiScore = Math.min(100, Math.max(0, Math.round(Number(parsed.aiScore) || 0)));

  return parsed;
};

module.exports = { screenResumeWithGemini };
