// ==========================================
// MODULE: VIP LEAD SCORING & SEGMENTATION
// ==========================================
import express from 'express';
const router = express.Router();

export const scoredLeadsDatabase = [];

router.post('/score-lead', async (req, res) => {
    try {
        const { fullName, phone, treatment, budget } = req.body;

        if (!fullName || !phone) {
            return res.status(400).json({ success: false, error: 'Full name and phone are required for scoring.' });
        }

        let score = 50; // বেস স্কোর
        let tier = 'Standard Lead';

        // ট্রিটমেন্ট বা বাজেটের ওপর ভিত্তি করে ভিআইপি স্কোর ক্যালকুলেশন
        const highValueTreatments = ['Porcelain Veneers', 'Dental Implants', 'Full Smile Makeover'];
        if (highValueTreatments.includes(treatment)) {
            score += 30;
        }

        if (budget === 'High' || budget === 'VIP') {
            score += 20;
        }

        if (score >= 80) {
            tier = '🔥 Tier 1: VIP High-Intent Lead';
        } else if (score >= 60) {
            tier = '⭐ Tier 2: Warm Lead';
        }

        const scoredLead = {
            fullName,
            phone,
            treatment: treatment || 'General Consultation',
            score,
            tier,
            scoredAt: new Date()
        };

        scoredLeadsDatabase.push(scoredLead);

        console.log(`[Lead Scoring Engine] ${fullName} scored ${score} -> Classified as: ${tier}`);

        res.status(200).json({
            success: true,
            message: 'Lead successfully scored and segmented!',
            leadData: scoredLead
        });

    } catch (error) {
        console.error('[Lead Scoring Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to score and segment lead.' });
    }
});

export default router;