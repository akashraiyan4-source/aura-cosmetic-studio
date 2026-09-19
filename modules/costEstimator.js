// ==========================================
// MODULE: INTERACTIVE DENTAL COST ESTIMATOR
// ==========================================
import express from 'express';
const router = express.Router();

export const estimateDatabase = [];

router.post('/calculate-estimate', async (req, res) => {
    try {
        const { fullName, phone, symptom, treatmentType } = req.body;

        if (!treatmentType) {
            return res.status(400).json({ success: false, error: 'Treatment type is required for cost estimation.' });
        }

        let estimatedCost = '$100 - $300';
        let description = 'General consultation and basic procedure.';

        // চিকিৎসার ধরন অনুযায়ী আনুমানিক খরচ নির্ধারণ (এটিতে জেমিনি এআই ডায়নামিক প্রম্পটও যুক্ত করা যাবে)
        switch (treatmentType.toLowerCase()) {
            case 'dental implants':
                estimatedCost = '$1,500 - $3,000 per tooth';
                description = 'Permanent titanium root replacement with crown.';
                break;
            case 'porcelain veneers':
                estimatedCost = '$800 - $1,500 per tooth';
                description = 'Custom-made shell to improve smile aesthetics.';
                break;
            case 'teeth whitening':
                estimatedCost = '$300 - $600';
                description = 'In-office professional laser whitening session.';
                break;
            default:
                estimatedCost = '$150 - $400';
                description = 'Standard dental examination and care.';
        }

        const estimateRecord = {
            fullName: fullName || 'Guest User',
            phone: phone || 'N/A',
            symptom: symptom || 'General Checkup',
            treatmentType,
            estimatedCost,
            description,
            calculatedAt: new Date()
        };

        estimateDatabase.push(estimateRecord);

        console.log(`[Cost Estimator] Estimate calculated for ${treatmentType} -> ${estimatedCost}`);

        res.status(200).json({
            success: true,
            message: 'Cost estimate successfully generated!',
            data: estimateRecord
        });

    } catch (error) {
        console.error('[Cost Estimator Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to generate cost estimate.' });
    }
});

export default router;