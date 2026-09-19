// ==========================================
// MODULE: SMART FAQ & KNOWLEDGE BASE BOT
// ==========================================
import express from 'express';
const router = express.Router();

export const faqDatabase = [];

router.post('/ask-faq', async (req, res) => {
    try {
        const { question, userPhone } = req.body;

        if (!question) {
            return res.status(400).json({ success: false, error: 'Question is required for FAQ bot.' });
        }

        let answer = 'We are open Saturday through Thursday from 10:00 AM to 8:00 PM. Feel free to book a consultation!';

        const lowerQ = question.toLowerCase();
        if (lowerQ.includes('location') || lowerQ.includes('address') || lowerQ.includes('where')) {
            answer = 'Our clinic is located in a prime accessible area in Dhaka with parking facilities.';
        } else if (lowerQ.includes('pain') || lowerQ.includes('hurt')) {
            answer = 'Our treatments are performed under modern local anesthesia to ensure a completely painless experience.';
        } else if (lowerQ.includes('cost') || lowerQ.includes('price') || lowerQ.includes('fee')) {
            answer = 'Consultation fees start at an affordable range, and specific treatment costs depend on individual dental assessments.';
        }

        const faqRecord = {
            userPhone: userPhone || 'Anonymous',
            question,
            answer,
            askedAt: new Date()
        };

        faqDatabase.push(faqRecord);

        console.log(`[Smart FAQ Bot] Question answered: "${question}"`);

        res.status(200).json({
            success: true,
            message: 'FAQ query successfully processed!',
            data: faqRecord
        });

    } catch (error) {
        console.error('[Smart FAQ Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to process FAQ query.' });
    }
});

export default router;