// ==========================================
// MODULE: SMART CALENDAR & APPOINTMENT BOOKING
// (Includes Booking, Reschedule & Cancellation Flow)
// ==========================================
import express from 'express';
const router = express.Router();

// ইন-মেমোরি বুকিং ডাটাবেস (পরবর্তীতে MongoDB/PostgreSQL যুক্ত করা যাবে)
export const appointmentsDatabase = [];

/**
 * ১. নতুন অ্যাপয়েন্টমেন্ট বুকিং এন্ডপয়েন্ট
 * POST /api/booking/book
 */
router.post('/book', async (req, res) => {
    try {
        const { fullName, phone, appointmentDate, treatment } = req.body;

        if (!fullName || !phone || !appointmentDate) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required booking fields (fullName, phone, appointmentDate are required).' 
            });
        }

        const newAppointment = {
            id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            fullName,
            phone: phone.trim(),
            appointmentDate,
            treatment: treatment || 'General Consultation',
            status: 'CONFIRMED', // CONFIRMED, RESCHEDULED, CANCELLED
            createdAt: new Date(),
            updatedAt: new Date()
        };

        appointmentsDatabase.push(newAppointment);

        console.log(`[Smart Booking Success] Appointment booked for ${fullName} (${phone}) on ${appointmentDate}`);

        return res.status(201).json({
            success: true,
            message: 'VIP Appointment successfully scheduled!',
            appointment: newAppointment
        });

    } catch (error) {
        console.error('[Smart Booking Error]:', error);
        return res.status(500).json({ success: false, error: 'Failed to process appointment booking.' });
    }
});

/**
 * ২. স্মার্ট রিশিডিউল ফ্লো (Smart Reschedule Flow)
 * POST /api/booking/reschedule
 * ফোন নাম্বার অথবা অ্যাপয়েন্টমেন্ট আইডি দিয়ে নতুন তারিখ ও সময় নির্ধারণ
 */
router.post('/reschedule', async (req, res) => {
    try {
        const { phone, appointmentId, newAppointmentDate, reason } = req.body;

        if ((!phone && !appointmentId) || !newAppointmentDate) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone or appointmentId and newAppointmentDate are required to reschedule.' 
            });
        }

        // একটিভ অ্যাপয়েন্টমেন্ট খুঁজে বের করা
        const appointmentIndex = appointmentsDatabase.findIndex(apt => {
            if (appointmentId) return apt.id === appointmentId && apt.status !== 'CANCELLED';
            if (phone) return apt.phone === phone.trim() && apt.status !== 'CANCELLED';
            return false;
        });

        if (appointmentIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'No active appointment found for this phone number or ID.' 
            });
        }

        const previousDate = appointmentsDatabase[appointmentIndex].appointmentDate;

        // অ্যাপয়েন্টমেন্ট আপডেট করা
        appointmentsDatabase[appointmentIndex].appointmentDate = newAppointmentDate;
        appointmentsDatabase[appointmentIndex].status = 'RESCHEDULED';
        appointmentsDatabase[appointmentIndex].rescheduleReason = reason || 'Customer requested change';
        appointmentsDatabase[appointmentIndex].previousDate = previousDate;
        appointmentsDatabase[appointmentIndex].updatedAt = new Date();

        const updatedAppointment = appointmentsDatabase[appointmentIndex];

        console.log(`[Reschedule Success] Appointment for ${updatedAppointment.fullName} (${updatedAppointment.phone}) moved from ${previousDate} to ${newAppointmentDate}`);

        return res.status(200).json({
            success: true,
            message: 'Appointment successfully rescheduled!',
            previousDate,
            appointment: updatedAppointment
        });

    } catch (error) {
        console.error('[Reschedule Error]:', error);
        return res.status(500).json({ success: false, error: 'Failed to process reschedule request.' });
    }
});

/**
 * ৩. ক্যানসেলেশন ফ্লো (Smart Cancellation Flow & Retention)
 * POST /api/booking/cancel
 * বুকিং ড্রপ-অফ ট্র্যাক করা ও বিকল্প অফার প্রস্তুত রাখা
 */
router.post('/cancel', async (req, res) => {
    try {
        const { phone, appointmentId, cancellationReason } = req.body;

        if (!phone && !appointmentId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number or appointmentId is required to cancel an appointment.' 
            });
        }

        const appointmentIndex = appointmentsDatabase.findIndex(apt => {
            if (appointmentId) return apt.id === appointmentId && apt.status !== 'CANCELLED';
            if (phone) return apt.phone === phone.trim() && apt.status !== 'CANCELLED';
            return false;
        });

        if (appointmentIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Active appointment not found to cancel.' 
            });
        }

        appointmentsDatabase[appointmentIndex].status = 'CANCELLED';
        appointmentsDatabase[appointmentIndex].cancellationReason = cancellationReason || 'Not specified';
        appointmentsDatabase[appointmentIndex].cancelledAt = new Date();
        appointmentsDatabase[appointmentIndex].updatedAt = new Date();

        const cancelledAppointment = appointmentsDatabase[appointmentIndex];

        console.log(`[Cancellation Logged] Appointment cancelled for ${cancelledAppointment.fullName} (${cancelledAppointment.phone}). Reason: ${cancelledAppointment.cancellationReason}`);

        return res.status(200).json({
            success: true,
            message: 'Appointment has been cancelled.',
            cancellationFollowUpNeeded: true, // রিকল ইঞ্জিন বা ফলো-আপের সংকেত
            appointment: cancelledAppointment
        });

    } catch (error) {
        console.error('[Cancellation Error]:', error);
        return res.status(500).json({ success: false, error: 'Failed to process cancellation.' });
    }
});

/**
 * ৪. একটিভ বুকিং চেক করার হেল্পার রাউট (এআই এজেন্টের ব্যবহারের জন্য)
 * GET /api/booking/check/:phone
 */
router.get('/check/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const activeAppointment = appointmentsDatabase.find(
            apt => apt.phone === phone.trim() && apt.status !== 'CANCELLED'
        );

        if (!activeAppointment) {
            return res.status(404).json({ success: false, message: 'No active appointment found.' });
        }

        return res.status(200).json({ success: true, appointment: activeAppointment });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Error checking appointment.' });
    }
});

export default router;