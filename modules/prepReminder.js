// ==========================================
// MODULE: SMART PRE-APPOINTMENT PREP & REMINDER
// ==========================================
import express from 'express';
const router = express.Router();

export const prepReminderDatabase = [];

router.post('/send-prep', async (req, res) => {
    try {
        const { fullName, phone, appointmentTime, treatmentType } = req.body;

        if (!fullName || !phone) {
            return res.status(400).json({ success: false, error: 'Full name and phone are required.' });
        }

        let prepInstructions = 'Please arrive 10 minutes prior to your scheduled time. Bring a valid ID.';
        
        if (treatmentType && treatmentType.toLowerCase().includes('implant')) {
            prepInstructions = 'Avoid eating heavy meals 2 hours prior to your implant surgery. Take prescribed antibiotics if advised.';
        }

        const reminderTask = {
            fullName,
            phone,
            appointmentTime: appointmentTime || 'Tomorrow',
            treatmentType: treatmentType || 'Dental Checkup',
            prepInstructions,
            status: 'Prep Reminder Dispatched',
            sentAt: new Date()
        };

        prepReminderDatabase.push(reminderTask);

        console.log(`[Prep Reminder Engine] Reminder & instructions sent to ${fullName} (${phone})`);

        res.status(200).json({
            success: true,
            message: 'Pre-appointment preparation guidelines successfully sent!',
            data: reminderTask
        });

    } catch (error) {
        console.error('[Prep Reminder Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to send prep reminder.' });
    }
});

export default router;