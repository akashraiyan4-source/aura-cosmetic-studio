// ==========================================
// MODULE: AUTOMATED REFERRAL & WORD-OF-MOUTH
// ==========================================
import express from 'express';
const router = express.Router();

export const referralDatabase = [];

router.post('/generate-referral', async (req, res) => {
    try {
        const { fullName, phone } = req.body;

        if (!fullName || !phone) {
            return res.status(400).json({ success: false, error: 'Full name and phone are required.' });
        }

        // ইউনিক রেফারেল কোড জেনারেট করা
        const referralCode = `VIP-${fullName.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const referralLink = `https://smileway.store/referral?code=${referralCode}`;

        const referralRecord = {
            fullName,
            phone,
            referralCode,
            referralLink,
            rewardsEarned: 'Pending First Successful Referral',
            generatedAt: new Date()
        };

        referralDatabase.push(referralRecord);

        console.log(`[Referral Engine] Generated referral link for ${fullName} -> Code: ${referralCode}`);

        res.status(200).json({
            success: true,
            message: 'Referral link and code successfully generated!',
            data: referralRecord
        });

    } catch (error) {
        console.error('[Referral Engine Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to generate referral details.' });
    }
});

export default router;