// ==========================================
// MODULE: AUTOMATED SMS & EMAIL FOLLOW-UP
// ==========================================
import express from 'express';
const router = express.Router();

// ফলো-আপ শিডিউল বা হিস্ট্রি ট্র্যাক করার অ্যারে
export const followUpDatabase = [];

router.post('/trigger-sequence', async (req, res) => {
    try {
        const { fullName, phone, email, sequenceStep } = req.body;

        if (!fullName || (!phone && !email)) {
            return res.status(400).json({ success: false, error: 'Contact information (phone or email) is required.' });
        }

        const followUpTask = {
            fullName,
            phone: phone || 'N/A',
            email: email || 'N/A',
            step: sequenceStep || 'Step 1 (24h Reminder)',
            status: 'Scheduled/Dispatched',
            timestamp: new Date()
        };

        followUpDatabase.push(followUpTask);

        console.log(`[Follow-Up Engine] Sequence triggered for ${fullName} -> Step: ${followUpTask.step}`);

        // এখানে নোড-ক্রন (node-cron) বা ব্যাকগ্রাউন্ড জব ব্যবহার করে নির্দিষ্ট সময় পর পর এসএমএস/ইমেল পাঠানোর লজিক এক্সিকিউট করা যাবে

        res.status(200).json({
            success: true,
            message: 'Automated follow-up sequence successfully initiated!',
            task: followUpTask
        });

    } catch (error) {
        console.error('[Follow-Up Engine Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to trigger follow-up sequence.' });
    }
});

export default router;