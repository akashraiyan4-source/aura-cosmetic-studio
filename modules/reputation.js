// ==========================================
// MODULE: AUTOMATED REVIEW & REPUTATION REQUEST
// ==========================================
import express from 'express';
const router = express.Router();

export const reviewRequestsDatabase = [];

router.post('/send-review-request', async (req, res) => {
    try {
        const { fullName, phone, treatment } = req.body;

        if (!fullName || !phone) {
            return res.status(400).json({ success: false, error: 'Full name and phone are required.' });
        }

        const reviewTask = {
            fullName,
            phone,
            treatment: treatment || 'Dental Consultation',
            reviewLink: 'https://g.page/r/your-clinic-google-review-link',
            status: 'Review Request Dispatched',
            sentAt: new Date()
        };

        reviewRequestsDatabase.push(reviewTask);

        console.log(`[Reputation Engine] Review request sent to ${fullName} (${phone}) for ${reviewTask.treatment}`);

        // এখানে Twilio SMS বা Nodemailer ব্যবহার করে কাস্টমারকে রিভিউ লিংক পাঠানোর রিয়াল API লজিক যুক্ত করা যাবে

        res.status(200).json({
            success: true,
            message: 'Automated review request successfully sent!',
            data: reviewTask
        });

    } catch (error) {
        console.error('[Reputation Engine Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to send review request.' });
    }
});

export default router;