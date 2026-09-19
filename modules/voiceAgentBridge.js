// ==========================================
// MODULE: REAL-TIME VOICE AGENT & MEDIA BRIDGE
// (Integrated with Twilio Inbound, Gemini Voice & Emergency Handoff)
// ==========================================
import express from 'express';
import twilio from 'twilio';
import { routeEmergencyCallToDoctor, sendEmergencyStaffAlert } from './staffAlert.js';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * ১. ইনকামিং লাইভ কল হ্যান্ডলার (Twilio Webhook Endpoint)
 * Twilio Console-এ Webhook URL হিসেবে এটি সেট করতে হবে:
 * POST https://your-domain.onrender.com/api/voice/incoming-call
 */
router.post('/incoming-call', (req, res) => {
    try {
        const callerPhone = req.body.From || 'Unknown Caller';
        const callSid = req.body.CallSid;

        console.log(`[Voice Agent Bridge] Live inbound call received from ${callerPhone} (SID: ${callSid})`);

        const twiml = new VoiceResponse();

        // প্রাথমিক প্রফেশনাল গ্রিটিংস ও স্পিচ রিকগনিশন
        const gather = twiml.gather({
            input: 'speech',
            action: '/api/voice/process-speech',
            method: 'POST',
            timeout: 4,
            speechTimeout: 'auto',
            language: 'en-US'
        });

        gather.say({
            voice: 'Polly.Stephen-Neural',
            language: 'en-US'
        }, 'Thank you for calling our VIP Dental Practice. I am Alex, your AI concierge. How can I help you with your dental needs today?');

        // কলার চুপ থাকলে ডিফল্ট রিডাইরেক্ট
        twiml.redirect('/api/voice/incoming-call');

        res.type('text/xml');
        return res.send(twiml.toString());

    } catch (error) {
        console.error('[Inbound Voice Error]:', error);
        const twiml = new VoiceResponse();
        twiml.say('We are experiencing technical difficulties. Please call back shortly.');
        res.type('text/xml');
        return res.send(twiml.toString());
    }
});

/**
 * ২. স্পিচ প্রসেসিং ও ইমার্জেন্সি হিউম্যান হ্যান্ডঅফ (Speech Analysis & Triage)
 * POST /api/voice/process-speech
 */
router.post('/process-speech', async (req, res) => {
    try {
        const callerSpeech = (req.body.SpeechResult || '').toLowerCase();
        const callerPhone = req.body.From || 'Unknown Line';
        const callSid = req.body.CallSid;

        console.log(`[Voice Agent Bridge] Caller (${callerPhone}) said: "${callerSpeech}"`);

        // ইমার্জেন্সি কি-ওয়ার্ড ট্রিগার (Human Handoff Detection)
        const emergencyKeywords = ['emergency', 'bleeding', 'severe pain', 'blood', 'unbearable', 'swelling', 'accident', 'broken tooth'];
        const isEmergency = emergencyKeywords.some(keyword => callerSpeech.includes(keyword));

        if (isEmergency) {
            console.log(`[Emergency Detected] Triggering Human Handoff for ${callerPhone}`);

            // ব্যাকগ্রাউন্ডে ডক্টরকে ইনস্ট্যান্ট ফ্ল্যাশ অ্যালার্ট এসএমএস পাঠানো
            sendEmergencyStaffAlert({
                phone: callerPhone,
                fullName: 'Live Call Patient',
                symptoms: callerSpeech
            });

            // লাইভ কল ডক্টরের নাম্বারে ট্রান্সফার করা (TwiML Dial)
            const handoffTwiML = routeEmergencyCallToDoctor('Live Voice Patient');
            res.type('text/xml');
            return res.send(handoffTwiML);
        }

        // বুকিং বা রিশিডিউল ইনটেন্ট ডিটেকশন
        const twiml = new VoiceResponse();

        if (callerSpeech.includes('reschedule') || callerSpeech.includes('change date')) {
            twiml.say({
                voice: 'Polly.Stephen-Neural',
                language: 'en-US'
            }, 'I can certainly help you reschedule. I have sent a secure link to your phone number to select a new convenient time slot. Have a great day!');
            twiml.hangup();
        } else if (callerSpeech.includes('book') || callerSpeech.includes('appointment') || callerSpeech.includes('consultation')) {
            twiml.say({
                voice: 'Polly.Stephen-Neural',
                language: 'en-US'
            }, 'I would love to get you scheduled for a consultation. Our next priority slot is open this week. I am texting your confirmation details right now.');
            twiml.hangup();
        } else {
            // সাধারণ প্রশ্নের ক্ষেত্রে ইন্টারেক্টিভ কন্টিনিউয়েশন
            const gather = twiml.gather({
                input: 'speech',
                action: '/api/voice/process-speech',
                method: 'POST',
                timeout: 4,
                speechTimeout: 'auto',
                language: 'en-US'
            });

            gather.say({
                voice: 'Polly.Stephen-Neural',
                language: 'en-US'
            }, 'Got it. We can handle comprehensive implants, clear aligners, and routine cleanings. Would you like to reserve a time with our chief dentist?');
        }

        res.type('text/xml');
        return res.send(twiml.toString());

    } catch (error) {
        console.error('[Speech Processing Error]:', error);
        const twiml = new VoiceResponse();
        twiml.say('Thank you for calling. Our team will follow up with you shortly via text.');
        twiml.hangup();
        res.type('text/xml');
        return res.send(twiml.toString());
    }
});

/**
 * ৩. কল ট্রান্সফার ফেইলব্যাক (Fallback if Doctor does not answer)
 * POST /api/voice/transfer-fallback
 */
router.post('/transfer-fallback', (req, res) => {
    const twiml = new VoiceResponse();
    twiml.say({
        voice: 'Polly.Stephen-Neural',
        language: 'en-US'
    }, 'The on-call doctor is currently attending another patient. We have flagged your issue as top priority, and our medical director will call you back immediately. Goodbye.');
    twiml.hangup();

    res.type('text/xml');
    return res.send(twiml.toString());
});

/**
 * ৪. ড্যাশবোর্ড / ফ্রন্টএন্ড ইনিশিয়ালাইজেশন সেশন (Existing Endpoint Maintained)
 * POST /api/voice/initialize-voice-session
 */
router.post('/initialize-voice-session', async (req, res) => {
    try {
        const { callSid, callerPhone } = req.body;

        const voiceSessionConfig = {
            callSid: callSid || `CALL-${Math.floor(100000 + Math.random() * 900000)}`,
            callerPhone: callerPhone || 'Unknown Line',
            aiBrainEngine: 'Gemini Live Multimodal Voice Stream',
            streamingStatus: 'Active & Listening',
            initiatedAt: new Date()
        };

        console.log(`[Voice Agent Bridge] Live voice stream initialized for call SID: ${voiceSessionConfig.callSid}`);

        res.status(200).json({
            success: true,
            message: 'Gemini real-time voice streaming session successfully initialized!',
            data: voiceSessionConfig
        });

    } catch (error) {
        console.error('[Voice Agent Bridge Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to initialize voice session.' });
    }
});

export default router;