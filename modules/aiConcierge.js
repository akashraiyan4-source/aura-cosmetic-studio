// ==========================================
// MODULE: AI VOICE & CHAT CONCIERGE AGENT
// ==========================================
import express from 'express';

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
        console.error('[AI Concierge Error] GEMINI_API_KEY is missing.');
        return res.status(500).json({ success: false, error: 'API key not configured.' });
    }

    const fullPrompt = `${COSMETIC_SYSTEM_PROMPT}\n\nPatient Query: ${message}`;

    // গুগলের নির্দেশিত সক্রিয় মডেল তালিকা
    const modelCandidates = [
        "gemini-3.6-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest"
    ];

    for (const modelName of modelCandidates) {
        try {
            console.log(`[AI Concierge] Querying Google API with model: ${modelName}`);

            const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                    generationConfig: { maxOutputTokens: 120, temperature: 0.6 }
                })
            });

            const data = await apiRes.json();

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                const aiResponse = data.candidates[0].content.parts[0].text.trim();
                console.log(`[AI Concierge Reply using ${modelName}] "${aiResponse}"`);
                return res.status(200).json({ success: true, reply: aiResponse });
            }

            if (data.error) {
                console.warn(`[Failover Model ${modelName}] Error: ${data.error.message}`);
            }
        } catch (err) {
            console.warn(`[Network/Model Error ${modelName}]: ${err.message}`);
        }
    }

    return res.status(500).json({ success: false, error: 'AI Concierge temporarily busy.' });
});

export default router;