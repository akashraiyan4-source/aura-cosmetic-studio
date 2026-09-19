import cron from 'node-cron';

// মেমোরি ডাটাবেজ
const leadsDatabase = [];

// অ্যাপয়েন্টমেন্ট শিডিউল ও পরবর্তী রিকল ডেট নির্ধারণ
export const scheduleAppointment = ({ name, phone, niche, appointmentDate }) => {
    const serviceDate = new Date(appointmentDate);
    const recallDate = new Date(serviceDate);

    // নিশ অনুযায়ী পরবর্তী রিকল সময় নির্ধারণ
    if (niche === 'cosmetic') {
        recallDate.setMonth(recallDate.getMonth() + 4); // ৪ মাস পর
    } else if (niche === 'roofing') {
        recallDate.setMonth(recallDate.getMonth() + 6); // সিজনাল ৬ মাস পর
    } else {
        recallDate.setMonth(recallDate.getMonth() + 6); // ডেন্টাল রুটিন চেকআপ ৬ মাস পর
    }

    const leadRecord = {
        lead_id: `LEAD-${Date.now()}`,
        name,
        phone,
        niche: niche || 'dental',
        service_completed_at: serviceDate.toISOString(),
        next_recall_due_at: recallDate.toISOString(),
        recall_status: 'pending'
    };

    leadsDatabase.push(leadRecord);
    console.log(`[Database] Appointment Confirmed for ${name} (${phone}). Next Recall: ${leadRecord.next_recall_due_at}`);
    return leadRecord;
};

// নিশ-নির্দিষ্ট ফলোআপ মেসেজ টেমপ্লেট
const getMessageContent = (lead) => {
    const bookingLink = `https://smileway.studio/book?lead=${lead.lead_id}`;
    switch (lead.niche) {
        case 'cosmetic':
            return `Hi ${lead.name}, it is time for your Botox/Glow maintenance session to keep your radiant look! Claim your priority slot: ${bookingLink}`;
        case 'roofing':
            return `Hi ${lead.name}, seasonal storms are approaching. Schedule your complimentary 12-point roof health inspection: ${bookingLink}`;
        case 'dental':
        default:
            return `Hi ${lead.name}, Dr. Vance recommends your routine 6-month cleaning & polishing checkup. Click here to pick your VIP slot: ${bookingLink}`;
    }
};

// রিকল ক্রন শিডিউলার (প্রতিদিন সকাল ৯টায় চলবে)
export const initRecallEngine = () => {
    cron.schedule('0 9 * * *', () => {
        console.log('[Recall Engine] Running daily 09:00 AM checkup dispatch...');
        const now = new Date();

        leadsDatabase.forEach(lead => {
            if (lead.recall_status === 'pending' && new Date(lead.next_recall_due_at) <= now) {
                const message = getMessageContent(lead);
                console.log(`[Dispatch SMS/WhatsApp] To: ${lead.phone} | Content: "${message}"`);
                lead.recall_status = 'sent';
            }
        });
    });
    console.log('[Recall Engine] Automated Daily Retention Worker Initialized.');
};