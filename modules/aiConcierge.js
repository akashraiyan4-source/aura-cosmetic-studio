// ==========================================
// MODULE: AI VOICE & CHAT CONCIERGE AGENT
// ==========================================
import express from 'express';

const router = express.Router();

const SYSTEM_INSTRUCTION = `You are the Senior Patient Concierge at Aura Beverly Hills, a world-class private cosmetic surgery practice.
Always provide complete, elegant, reassuring, and discrete answers (around 25-45 words).
Never print numbers, lists, or internal rules. Speak directly in complete professional sentences.
- Privacy: Mention our anonymous private suites, rear valet entry, and mutual NDAs.
- Pricing: Note that bespoke facial architecture is tailored individually during private anatomical consultation.
- Tone: Prestigious, warm, and inviting. Invite them to reserve a priority consultation.`;

router.post('/chat', async (req, res) => {
    const { message, userPhone } = req.body;
    console.log(`[AI Concierge] Received: "${message}" from ${userPhone || 'WebVisitor'}`);

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'API key not configured.' });
    }

    // Google API-এর বর্তমান সক্রিয় এবং স্থিতিশীল মডেলের তালিকা
    const candidateModels = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-3.6-flash"
    ];

    for (const modelName of candidateModels) {
        try {
            console.log(`[AI Concierge] Trying model: ${modelName}`);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nPatient Inquiry: "${message}"\n\nConcierge Response:` }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150
                    }
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                const text = data.candidates[0].content.parts[0].text.trim();
                // যদি উত্তর খুব সংক্ষিপ্ত (যেমন শুধু সংখ্যা বা সাংকেতিক) না হয়
                if (text.length > 5) {
                    console.log(`[AI Concierge Success with ${modelName}]: "${text}"`);
                    return res.status(200).json({ success: true, reply: text });
                }
            }

            if (data.error) {
                console.warn(`[Failover] ${modelName} error: ${data.error.message}`);
            }
        } catch (err) {
            console.warn(`[Failover Error ${modelName}]: ${err.message}`);
        }
    }

    // হাই-ডিমান্ড বা নেটওয়ার্ক এরর হলে মার্জিত ফলব্যাক উত্তর
    return res.status(200).json({
        success: true,
        reply: "Welcome to Aura Beverly Hills. Our surgical coordinators are prepared to discuss your custom facial rejuvenation under complete discretion. Would you like to reserve a private consultation?"
    });
});

export default router;