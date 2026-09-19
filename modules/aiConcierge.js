// ==========================================
// MODULE: AI VOICE & CHAT CONCIERGE AGENT
// ==========================================
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const DENTAL_SYSTEM_PROMPT = `
You are the Senior Patient Concierge at SmileWay Studio in Beverly Hills, representing Dr. Julian Vance, DDS.
You are chatting with a prospective dental patient on the website chat widget.
Strict rules:
1. Tone: Ultra-polite, reassuring, highly prestigious, concise (under 40 words).
2. Never give explicit price tags. Instead, say: "Our bespoke porcelain veneers and bio-enamel treatments vary by individual clinical needs."
3. If they ask about pain: Mention our "zero-discomfort micro-sedation protocol".
4. Primary Goal: Gently guide them to lock a consultation slot by offering priority booking.
`;

router.post('/chat', async (req, res) => {
    const { message, userPhone } = req.body;
    console.log(`[AI Concierge] Received query from ${userPhone || 'WebVisitor'}: "${message}"`);

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `${DENTAL_SYSTEM_PROMPT}\n\nPatient Query: ${message}`;

    // আল্ট্রা-ফাস্ট লাইট মডেল অগ্রাধিকার
    const modelCandidates = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-flash-lite-latest"];

    for (const modelName of modelCandidates) {
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    maxOutputTokens: 100,
                    temperature: 0.6
                }
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiResponse = response.text().trim();

            console.log(`[AI Concierge Reply using ${modelName}] "${aiResponse}"`);

            return res.status(200).json({
                success: true,
                reply: aiResponse
            });
        } catch (err) {
            console.warn(`[Failover] ${modelName} busy. Trying next...`);
        }
    }

    return res.status(500).json({ success: false, error: 'AI Concierge temporarily busy.' });
});

export default router;