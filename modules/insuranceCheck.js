// ==========================================
// MODULE: INSURANCE & PAYMENT PRE-QUALIFICATION
// ==========================================
import express from 'express';
const router = express.Router();

export const insuranceDatabase = [];

router.post('/check-qualification', async (req, res) => {
    try {
        const { fullName, phone, insuranceProvider, preferredPaymentPlan } = req.body;

        if (!fullName || !phone) {
            return res.status(400).json({ success: false, error: 'Full name and phone are required.' });
        }

        let isQualified = true;
        let qualificationMessage = 'Congratulations! Your insurance provider is accepted, and you qualify for our 0% interest flexible payment plans.';

        // সাধারণ কিছু ইন্স্যুরেন্স বা পেমেন্ট ক্রাইটেরিয়া চেক করার লজিক
        const acceptedProviders = ['delta dental', 'metlife', 'cigna', 'guardian', 'aetna'];
        
        if (insuranceProvider && !acceptedProviders.includes(insuranceProvider.toLowerCase())) {
            isQualified = false;
            qualificationMessage = 'We are an out-of-network provider for this insurance, but we offer custom in-house monthly payment plans!';
        }

        const record = {
            fullName,
            phone,
            insuranceProvider: insuranceProvider || 'None/Cash',
            preferredPaymentPlan: preferredPaymentPlan || 'Standard',
            isQualified,
            qualificationMessage,
            checkedAt: new Date()
        };

        insuranceDatabase.push(record);

        console.log(`[Insurance Engine] Pre-qualification checked for ${fullName} -> Qualified: ${isQualified}`);

        res.status(200).json({
            success: true,
            message: 'Payment and insurance pre-qualification completed!',
            data: record
        });

    } catch (error) {
        console.error('[Insurance Engine Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to process insurance pre-qualification.' });
    }
});

export default router;