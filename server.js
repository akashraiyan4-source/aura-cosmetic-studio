import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Bidyoman shob modules
import leadsRouter from './modules/leads.js';
import geminiRouter from './modules/geminiConcierge.js';
import missedRouter from './modules/missedCall.js';
import aiConciergeRouter from './modules/aiConcierge.js';
import bookingRouter, { appointmentsDatabase } from './modules/booking.js';
import followUpRouter from './modules/followUp.js';
import leadScoringRouter from './modules/leadScoring.js';
import reputationRouter from './modules/reputation.js';
import costEstimatorRouter from './modules/costEstimator.js';
import insuranceRouter from './modules/insuranceCheck.js';
import onboardingRouter from './modules/onboarding.js';
import prepRouter from './modules/prepReminder.js';
import postTreatmentRouter from './modules/postTreatment.js';
import loyaltyRouter from './modules/loyalty.js';
import faqRouter from './modules/smartFaq.js';
import referralRouter from './modules/referral.js';
import analyticsRouter from './modules/analytics.js';
import broadcastRouter from './modules/broadcast.js';
import smileSimulatorRouter from './modules/smileSimulator.js';
import vectorKnowledgeRouter from './modules/vectorKnowledge.js';
import whatsappRouter from './modules/whatsappIntegration.js';

// Upgraded modules integration
import voiceAgentRouter from './modules/voiceAgentBridge.js';
import { sendStaffAlert } from './modules/staffAlert.js';

// Recall engine & scheduler
import { initRecallEngine, scheduleAppointment } from './modules/recallEngine.js';

// ========================================================
// Notun 4-ti Beverly Hills Luxury Modules Import
// ========================================================
import NDAProtocol from './modules/ndaProtocol.js';
import FlyInConcierge from './modules/flyInConcierge.js';
import SpeedToLead from './modules/speedToLead.js';
import LongTermNurture from './modules/longTermNurture.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Helmet Security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 2. CORS Configuration
const allowedOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Access Denied'));
    }
  }
}));

// 3. Input Size Guards
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Rate Limiter
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, error: 'Too many chat requests. Please try again after 15 minutes.' }
});

// Static frontend serving
app.use(express.static(__dirname));

// 5. VIP Booking Endpoint
app.post('/api/booking/create', async (req, res) => {
  try {
    const { name, fullName, phone, niche, appointmentDate, treatment } = req.body;
    const clientName = fullName || name;

    if (!clientName || !phone) {
      return res.status(400).json({ success: false, error: 'Missing required booking fields (Name and Phone are required).' });
    }

    const scheduledBooking = scheduleAppointment({ 
      name: clientName, 
      phone: phone.trim(), 
      niche: niche || 'cosmetics', 
      appointmentDate: appointmentDate || new Date().toISOString().split('T')[0]
    });

    const newAppointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: clientName,
      phone: phone.trim(),
      appointmentDate: appointmentDate || new Date().toISOString().split('T')[0],
      treatment: treatment || niche || 'Architectural Contouring Consultation',
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    appointmentsDatabase.push(newAppointment);

    await sendStaffAlert({
      fullName: clientName,
      phone: phone.trim(),
      treatment: newAppointment.treatment
    });

    console.log(`[AURA VIP Lead Automation] Confirmed & Staff Alert Sent for ${clientName} (${phone})`);

    return res.status(200).json({ 
      success: true, 
      message: 'VIP Suite Reservation Confirmed!', 
      booking: scheduledBooking,
      appointment: newAppointment 
    });

  } catch (error) {
    console.error('[AURA Booking Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to process VIP aesthetic consultation.' });
  }
});

// ========================================================
// Notun 4-ti Luxury Funnel API Endpoints
// ========================================================

// Sequence 1: Speed To Lead (<45 Sec Trigger)
app.post('/api/speed-to-lead', async (req, res) => {
  try {
    const result = await SpeedToLead.triggerIntakeRecovery(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sequence 2: VIP NDA & Private Valet PIN Generation
app.post('/api/issue-nda', async (req, res) => {
  try {
    const dossier = await NDAProtocol.issueMutualNDA(req.body);
    res.json({ success: true, dossier });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Module 4: Fly-In Executive Chauffeur & Logistics
app.post('/api/fly-in-logistics', async (req, res) => {
  try {
    const plan = await FlyInConcierge.scheduleArrival(req.body);
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sequence 4: 90-Day Drip Nurture Asset Fetch
app.get('/api/nurture/:week', (req, res) => {
  const weekNum = parseInt(req.params.week) || 1;
  const asset = LongTermNurture.getWeeklyAsset(weekNum);
  res.json({ success: true, asset });
});

// API Routes mounting
app.use('/api/leads', leadsRouter);
app.use('/api/twilio', geminiRouter);
app.use('/api/voice-missed', missedRouter);
app.use('/api/ai', chatLimiter, aiConciergeRouter);

app.use('/api/booking', bookingRouter);
app.use('/api/voice', voiceAgentRouter); 

app.use('/api/followup', followUpRouter);
app.use('/api/scoring', leadScoringRouter);
app.use('/api/reputation', reputationRouter);
app.use('/api/estimator', costEstimatorRouter);
app.use('/api/insurance', insuranceRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/prep', prepRouter);
app.use('/api/recovery', postTreatmentRouter);
app.use('/api/loyalty', loyaltyRouter);
app.use('/api/faq', faqRouter);
app.use('/api/referral', referralRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/broadcast', broadcastRouter);
app.use('/api/simulation', smileSimulatorRouter);
app.use('/api/rag', vectorKnowledgeRouter);
app.use('/api/whatsapp', whatsappRouter);

// Frontend route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Status check route
app.get('/status', (req, res) => {
  res.json({ status: 'Online', system: 'AURA Beverly Hills VIP Concierge Engine v2.0' });
});

// Background Cron Recall
initRecallEngine();

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`💎 AURA Beverly Hills VIP Engine Active on Port ${PORT}`);
  console.log(`==================================================\n`);
});