// ==========================================
// MODULE: STAFF ALERT & EMERGENCY TRIAGE ROUTING (HUMAN HANDOFF)
// ==========================================
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * ১. সাধারণ ভিআইপি লিড এসএমএস অ্যালার্ট
 */
export async function sendStaffAlert(leadData) {
  try {
    const staffPhone = process.env.STAFF_PHONE_NUMBER;
    if (!staffPhone) {
      console.log('[Staff Alert] STAFF_PHONE_NUMBER not set in .env, skipping alert.');
      return;
    }

    const message = `🚨 NEW VIP DENTAL LEAD!\nName: ${leadData.fullName}\nPhone: ${leadData.phone}\nTreatment: ${leadData.treatment || 'General Consultation'}\nStatus: Action Required.`;

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: staffPhone
    });

    console.log(`[Staff Alert Sent] Notified staff about lead ${leadData.fullName}`);
  } catch (error) {
    console.error('[Staff Alert Error]:', error);
  }
}

/**
 * ২. ইমার্জেন্সি ট্রায়াজ লাইভ কল ট্রান্সফার (Human Handoff via TwiML)
 * লাইভ কলে ইমার্জেন্সি কি-ওয়ার্ড শনাক্ত হলে এই TwiML রেসপন্সটি কল সরাসরি ডক্টরের ফোনে সুইচ করে দেয়
 */
export function routeEmergencyCallToDoctor(callerName = 'Emergency Patient') {
  const doctorPhone = process.env.EMERGENCY_DOCTOR_PHONE || process.env.STAFF_PHONE_NUMBER;
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  if (!doctorPhone) {
    console.error('[Emergency Routing Error]: Doctor phone number not set in .env');
    response.say({
      voice: 'Polly.Stephen-Neural',
      language: 'en-US'
    }, 'We are experiencing an issue connecting to the doctor. Please dial 911 immediately for severe emergencies.');
    return response.toString();
  }

  // রোগীকে জানানো যে কলটি ডক্টরের কাছে ট্রান্সফার হচ্ছে
  response.say({
    voice: 'Polly.Stephen-Neural',
    language: 'en-US'
  }, 'This sounds like an urgent medical situation. Please stay on the line, I am connecting you directly to our on-call doctor right now.');

  // ডক্টরের নাম্বারে লাইভ কল ফরওয়ার্ড (হিউম্যান হ্যান্ডঅফ)
  const dial = response.dial({
    callerId: process.env.TWILIO_PHONE_NUMBER,
    timeout: 25,
    action: '/api/voice/transfer-fallback' // ডক্টর রিসিভ না করলে বিকল্প ফ্লো
  });
  
  dial.number(doctorPhone);

  console.log(`[Emergency Routing] Live handoff initiated to doctor (${doctorPhone}) for ${callerName}`);
  return response.toString();
}

/**
 * ৩. ক্রিটিক্যাল ইমার্জেন্সি ইনস্ট্যান্ট ফ্ল্যাশ অ্যালার্ট (SMS + Auto Doctor Notification)
 */
export async function sendEmergencyStaffAlert(patientData) {
  try {
    const doctorPhone = process.env.EMERGENCY_DOCTOR_PHONE || process.env.STAFF_PHONE_NUMBER;
    if (!doctorPhone) return;

    const urgentMessage = `🆘 CRITICAL EMERGENCY ALERT!\nCaller: ${patientData.fullName || 'Unknown'}\nPhone: ${patientData.phone}\nIssue: ${patientData.symptoms || 'Severe Pain / Bleeding'}\nTime: ${new Date().toLocaleTimeString()}\nAction: Call was redirected or requires immediate call-back!`;

    await twilioClient.messages.create({
      body: urgentMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: doctorPhone
    });

    console.log(`[Emergency Flash Alert Sent] Doctor notified regarding critical issue for ${patientData.phone}`);
  } catch (error) {
    console.error('[Emergency Flash Alert Error]:', error);
  }
}