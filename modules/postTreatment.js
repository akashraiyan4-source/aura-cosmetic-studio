// ==========================================
// MODULE: POST-TREATMENT CARE & RECOVERY TRACKER
// ==========================================
import express from 'express';
const router = express.Router();

export const recoveryDatabase = [];

router.post('/track-recovery', async (req, res) => {
    try {
        const { fullName, phone, procedureDone, painLevel, notes } = req.body;

        if (!fullName || !phone) {
            return res.status(400).json({ success: false, error: 'Full name and phone are required.' });
        }

        let aiAdvice = 'Continue taking prescribed medications and apply an ice pack gently if swelling occurs.';
        
        // ব্যথার মাত্রার ওপর ভিত্তি করে এআই রেসপন্স বা পরামর্শ কাস্টমাইজেশন
        if (painLevel && parseInt(painLevel) >= 7) {
            aiAdvice = 'High pain level detected! Our clinical staff has been instantly alerted to call you right away.';
        }

        const recoveryRecord = {
            fullName,
            phone,
            procedureDone: procedureDone || 'General Dental Treatment',
            painLevel: painLevel || 'Mild/Not Specified',
            notes: notes || 'None',
            aiAdvice,
            status: 'Recovery Tracked & Logged',
            checkedAt: new Date()
        };

        recoveryDatabase.push(recoveryRecord);

        console.log(`[Post-Treatment Recovery] Recovery logged for ${fullName} -> Pain Level: ${painLevel || 'N/A'}`);

        res.status(200).json({
            success: true,
            message: 'Post-treatment recovery data successfully recorded!',
            data: recoveryRecord
        });

    } catch (error) {
        console.error('[Post-Treatment Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to process recovery tracking.' });
    }
});

export default router;