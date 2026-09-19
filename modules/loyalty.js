// ==========================================
// MODULE: VIP MEMBERSHIP & LOYALTY REWARDS
// ==========================================
import express from 'express';
const router = express.Router();

export const loyaltyDatabase = [];

router.post('/add-points', async (req, res) => {
    try {
        const { fullName, phone, actionType } = req.body;

        if (!fullName || !phone) {
            return res.status(400).json({ success: false, error: 'Full name and phone are required.' });
        }

        let pointsEarned = 50; // সাধারণ ভিজিটের জন্য পয়েন্ট
        let tier = 'VIP Silver Member';

        // অ্যাকশনের ওপর ভিত্তি করে পয়েন্ট নির্ধারণ
        if (actionType && actionType.toLowerCase().includes('referral')) {
            pointsEarned = 200;
        } else if (actionType && actionType.toLowerCase().includes('treatment')) {
            pointsEarned = 150;
        }

        const loyaltyRecord = {
            fullName,
            phone,
            actionType: actionType || 'Routine Visit',
            pointsEarned,
            tier,
            updatedAt: new Date()
        };

        loyaltyDatabase.push(loyaltyRecord);

        console.log(`[Loyalty Engine] Added ${pointsEarned} points for ${fullName} (${phone})`);

        res.status(200).json({
            success: true,
            message: 'Loyalty points successfully credited!',
            data: loyaltyRecord
        });

    } catch (error) {
        console.error('[Loyalty Engine Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to process loyalty points.' });
    }
});

export default router;