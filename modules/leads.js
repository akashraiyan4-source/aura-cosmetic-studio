import express from 'express';

const router = express.Router();

// Shared leads database array to fix the import error
export const leadsDatabase = [];

router.post('/submit', async (req, res) => {
  try {
    const { fullName, phone, treatment } = req.body;

    // Save lead to array
    const newLead = { fullName, phone, treatment, date: new Date() };
    leadsDatabase.push(newLead);

    // Log the received lead data in the console
    console.log(`\n[Lead Ingested] ${fullName} (${phone}) -> ${treatment}`);

    res.status(200).json({ 
      success: true, 
      message: 'VIP Consultation request received successfully!' 
    });

  } catch (err) {
    console.error('Error processing lead:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;