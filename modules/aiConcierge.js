// ==========================================
// MODULE: AI CONCIERGE AGENT (FAST & DIRECT)
// ==========================================
import express from 'express';

const router = express.Router();

const SYSTEM_INSTRUCTION = `You are the Senior Patient Concierge at Aura Beverly Hills Private Practice.
Strictly follow:
1. Tone: Reassuring, elite, prestigious, concise (under 40 words).
2. Privacy/Discretion: Emphasize 100% anonymous private suites, rear valet entry, and mutual NDAs.
3. Recovery: State 10-14 days discreet recovery with board-certified MD oversight.
4. Directly answer the inquiry and invite them to reserve a priority consultation.`;

router.post('/chat', async (req, res) => {
    const { message, userPhone } = req.body;
    console.log(`[AI Concierge] Incoming Query: "${message}"`);

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
        console.error('[AI Concierge] GEMINI_API_KEY is not defined in Environment!');
        return res.status(500).json({ success: false, error: 'API key missing' });
    }

    // Google API-র লাইভ মডেল সরাসরি হিট
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nPatient: "${message}"\n\nConcierge:` }]
                }],
                generationConfig: {
                    temperature: 0.6,
                    maxOutputTokens: 100
                }
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            const aiText = data.candidates[0].content.parts[0].text.trim();
            console.log(`[AI Concierge SUCCESS]: "${aiText}"`);
            return res.status(200).json({ success: true, reply: aiText });
        } else {
            console.error('[Google API Response Error]:', JSON.stringify(data));
            // যদি গুগল কোনো কারণে এরর দেয়, চ্যাটে এরর মেসেজ পাঠানো যাতে ধরা যায়
            if (data.error) {
                return res.status(200).json({ 
                    success: true, 
                    reply: `Google API Error: ${data.error.message}` 
                });
            }
        }
    } catch (err) {
        console.error('[AI Concierge Exception]:', err.message);
        return res.status(200).json({ 
            success: true, 
            reply: `System Exception: ${err.message}` 
        });
    }

    return res.status(200).json({
        success: true,
        reply: "We ensure total discretion via anonymous private suites, rear valet entry, and mutual NDAs. Would you like to reserve a consultation?"
    });
});

export default router;