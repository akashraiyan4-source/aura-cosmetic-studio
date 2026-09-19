import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import twilio from 'twilio';
import { leadsDatabase } from './leads.js';

const router = express.Router();
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DENTAL_SYSTEM_PROMPT = `
You are the Senior Patient Concierge at SmileWay Studio in Beverly Hills, representing Dr. Julian Vance, DDS.
You are chatting with a high-net-worth patient over SMS.
Strict rules:
1. Tone: Ultra-polite, reassuring, highly prestigious, concise (under 40 words per SMS).
2. Never give explicit price tags. Instead, say: "Our bespoke porcelain veneers and bio-enamel treatments are completely customized to your facial aesthetics. We will provide a 3D preview and precise plan during your consultation."
3. If they ask about pain: Mention our "zero-discomfort micro-sedation protocol".
4. Privacy: Assure 100% private VIP suites and NDA compliance.
5. Primary Goal: Gently guide them to lock a consultation slot by replying 'YES' or asking for their preferred day.
`;

router.post('/webhook', async (req, res) => {
  try {
    const fromPhone = req.body.From;
    const userMessage = req.body.Body;

    console.log(`[SMS Received] From ${fromPhone}: "${userMessage}"`);

    let lead = leadsDatabase.get(fromPhone);
    let patientName = lead ? lead.firstName : 'there';
    let service = lead ? lead.treatment : 'Smile Transformation';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `${DENTAL_SYSTEM_PROMPT}\n\nPatient Name: ${patientName}. Interested in: ${service}.\nPatient incoming SMS: "${userMessage}"\nGenerate the next SMS reply:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiReply = response.text() ? response.text().trim() : `Thank you, ${patientName}. Dr. Vance's team is reserving your private triage slot now.`;

    console.log(`[Gemini Reply] "${aiReply}"`);

    await twilioClient.messages.create({
      body: aiReply,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: fromPhone
    });

    res.type('text/xml').send('<Response></Response>');
  } catch (error) {
    console.error('Error in Twilio Gemini Webhook:', error);
    res.type('text/xml').send('<Response></Response>');
  }
});

export default router;