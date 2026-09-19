// ==========================================
// MODULE: VIP PATIENT ONBOARDING & DIGITAL CONSENT
// ==========================================
import express from 'express';
const router = express.Router();

export const onboardingDatabase = [];

router.post('/submit-form', async (req, res) => {
    try {
        const { fullName, phone, medicalHistory, agreedToTerms } = req.body;

        if (!fullName || !phone) {
            return res.status(400).json({ success: false, error: 'Full name and phone are required.' });
        }

        if (!agreedToTerms) {
            return res.status(400).json({ success: false, error: 'Digital consent agreement is required.' });
        }

        const onboardingRecord = {
            fullName,
            phone,
            medicalHistory: medicalHistory || 'None reported',
            agreedToTerms: true,
            status: 'Onboarding Completed & Verified',
            submittedAt: new Date()
        };

        onboardingDatabase.push(onboardingRecord);

        console.log(`[Onboarding Engine] Digital consent & history received for ${fullName} (${phone})`);

        res.status(200).json({
            success: true,
            message: 'Digital onboarding and consent form successfully submitted!',
            data: onboardingRecord
        });

    } catch (error) {
        console.error('[Onboarding Engine Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to process patient onboarding.' });
    }
});

export default router;