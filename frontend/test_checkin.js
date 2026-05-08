const BASE = 'https://teacher-web-beckend.onrender.com/api/v1';

const run = async () => {
  try {
    // 1. Login to get token
    const loginRes = await fetch(`${BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sarvar', password: '123' }) // Need a teacher account here, assuming we can use admin to see QR code? Let's see what user we have.
    });
    // Wait, let's login as admin first to get the QR code
    const adminLoginRes = await fetch(`${BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }) 
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.access_token;

    // 2. Get QR Code
    const qrRes = await fetch(`${BASE}/attendance/qrcodes/`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const qrData = await qrRes.json();
    console.log('QR Codes:', JSON.stringify(qrData, null, 2));

    const qrCode = qrData.results && qrData.results.length > 0 ? qrData.results[0].code : null;
    if (!qrCode) {
      console.log('No QR code found');
      return;
    }
    
    console.log('Using QR Code:', qrCode);

    // 3. Let's try to check in as Admin (might fail if admin can't check in) or we just see the error.
    const checkinRes = await fetch(`${BASE}/attendance/check-in/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}` 
      },
      body: JSON.stringify({ qr_code: qrCode })
    });
    
    console.log('Check-in status:', checkinRes.status);
    const checkinData = await checkinRes.json();
    console.log('Check-in response:', JSON.stringify(checkinData, null, 2));
    
    // Let's also test what happens if we pass an invalid QR code format
    const checkinResInvalid = await fetch(`${BASE}/attendance/check-in/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}` 
      },
      body: JSON.stringify({ qr_code: 'invalid-qr-code' })
    });
    console.log('Check-in invalid format status:', checkinResInvalid.status);
    console.log('Check-in invalid format response:', JSON.stringify(await checkinResInvalid.json(), null, 2));

  } catch(e) { console.error('Error:', e.message); }
};

run();
