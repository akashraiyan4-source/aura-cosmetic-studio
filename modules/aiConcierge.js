// ==========================================
// MODULE: AI CONCIERGE AGENT (FAST & COMPLETE)
// ==========================================
import express from 'express';

const router = express.Router();

const SYSTEM_INSTRUCTION = `You are the Senior Patient Concierge at Aura Beverly Hills Private Practice.
Strictly follow:
1. Tone: Reassuring, elite, prestigious, concise (under 45 words).
2. Privacy/Discretion: Emphasize 100% anonymous private suites, rear valet entry, and mutual NDAs.
3. Recovery: State 10-14 days discreet recovery with board-certified MD oversight.
4. Always deliver complete sentences. Never cut off mid-thought. Invite them to reserve a priority VIP consultation.`;

router.post('/chat', async (req, res) => {
    const { message, userPhone } = req.body;
    console.log(`[AI Concierge] Incoming Query: "${message}"`);

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'API key missing' });
    }

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
                    maxOutputTokens: 250 // টোকেন বাড়িয়ে ২৫০ করা হলো যাতে পুরো বাক্য পূর্ণাঙ্গভাবে শেষ হয়
                }
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            const aiText = data.candidates[0].content.parts[0].text.trim();
            console.log(`[AI Concierge SUCCESS]: "${aiText}"`);
            return res.status(200).json({ success: true, reply: aiText });
        }
    } catch (err) {
        console.error('[AI Concierge Exception]:', err.message);
    }

    return res.status(200).json({
        success: true,
        reply: "We ensure total discretion via anonymous private suites, rear valet entry, and mutual NDAs. Would you like to reserve a VIP consultation?"
    });
});

export default router;