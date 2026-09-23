// ==========================================
// MODULE: AI VOICE & CHAT CONCIERGE AGENT
// ==========================================
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const COSMETIC_SYSTEM_PROMPT = `
You are the Senior Patient Concierge at Aura Beverly Hills Private Practice.
You are chatting with a prospective VIP patient on the website chat widget.
Strict rules:
1. Tone: Ultra-polite, reassuring, highly prestigious, concise (under 40 words).
2. Never give explicit price tags. State: "Our bespoke deep-plane facial architecture and surgical treatments vary based on individual anatomical assessment."
3. If they ask about recovery or privacy: Emphasize 100% anonymous private suites, rear valet entry, and strict mutual NDA compliance.
4. If they ask about pain: Mention our "board-certified MD anesthesiologist zero-discomfort protocol".
5. Primary Goal: Elegantly guide them to reserve a priority VIP consultation slot.
`;

router.post('/chat', async (req, res) => {
    const { message, userPhone } = req.body;
    console.log(`[AI Concierge] Received query from ${userPhone || 'WebVisitor'}: "${message}"`);

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
        console.error('[AI Concierge Error] GEMINI_API_KEY is missing from environment variables.');
        return res.status(500).json({ success: false, error: 'API key not configured.' });
    }

    const prompt = `${COSMETIC_SYSTEM_PROMPT}\n\nPatient Query: ${message}`;
    const modelCandidates = ["gemini-1.5-flash", "gemini-1.5-pro"];

    // 1. Prothome direct REST call (v1beta) diye cheshta kora hocche jate SDK version-er 404 bypass hoy
    for (const modelName of modelCandidates) {
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const apiRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 100, temperature: 0.6 }
                })
            });

            const data = await apiRes.json();
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                const aiResponse = data.candidates[0].content.parts[0].text.trim();
                console.log(`[AI Concierge Reply using REST ${modelName}] "${aiResponse}"`);
                return res.status(200).json({ success: true, reply: aiResponse });
            } else if (data.error) {
                console.warn(`[Failover REST] ${modelName} error: ${data.error.message}`);
            }
        } catch (err) {
            console.warn(`[Failover REST Fetch] ${modelName}: ${err.message}`);
        }
    }

    // 2. Fallback: SDK call with v1beta option
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1beta' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text().trim();

        return res.status(200).json({ success: true, reply: aiResponse });
    } catch (err) {
        console.error(`[AI Final Fallback Error] ${err.message}`);
    }

    return res.status(500).json({ success: false, error: 'AI Concierge temporarily busy.' });
});

export default router;