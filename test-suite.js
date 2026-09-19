// test-suite.js - সম্পূর্ণ পাইপলাইন ভ্যালিডেশন স্ক্রিপ্ট
import http from 'http';

const BASE_URL = 'http://localhost:5000';

async function testEndpoint(name, path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`✅ [PASS] ${name} (Status: ${res.statusCode})`);
          resolve(true);
        } else {
          console.log(`❌ [FAIL] ${name} (Status: ${res.statusCode}) - Error: ${data.slice(0, 80)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ [FAIL] ${name} - Server Down or Unreachable (${err.message})`);
      resolve(false);
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runHealthCheck() {
  console.log('\n==================================================');
  console.log('🧪 RUNNING FULL SYSTEM AUTOMATION HEALTH CHECK...');
  console.log('==================================================\n');

  // ১. সার্ভার বেসিক স্ট্যাটাস
  await testEndpoint('System Status Check', '/status');

  // ২. বুকিং ও ডাটাবেজ ইন্টিগ্রেশন
  await testEndpoint('Smart Booking Creation', '/api/booking/create', 'POST', {
    name: 'Automation Tester',
    phone: '+1234567890',
    niche: 'cosmetics',
    appointmentDate: '2026-10-01'
  });

  // ৩. ভয়েস এজেন্ট ব্রিজ ও TwiML চেক
  await testEndpoint('Voice Agent Inbound Bridge', '/api/voice/incoming-call', 'POST');

  // ৪. ভয়েস এজেন্ট স্পিচ প্রসেসিং
  await testEndpoint('Voice Speech Processing', '/api/voice/process-speech', 'POST', {
    SpeechResult: 'I want to book an appointment',
    From: '+1234567890'
  });

  console.log('\n==================================================');
  console.log('🎯 HEALTH CHECK COMPLETE');
  console.log('==================================================\n');
}

runHealthCheck();