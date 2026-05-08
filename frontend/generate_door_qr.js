const fs = require('fs');
const { exec } = require('child_process');

const BASE = 'https://teacher-web-beckend.onrender.com/api/v1';

async function run() {
  try {
    console.log("🔄 Admin profiliga kirilmoqda...");
    const loginRes = await fetch(`${BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    
    if (!loginRes.ok) {
       console.log("❌ Admin login xato! Iltimos, admin parolini tekshiring. Status:", loginRes.status);
       const err = await loginRes.text();
       console.log(err);
       return;
    }
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log("✅ Admin tizimga kirdi!");

    console.log("🔄 Eshik uchun QR Kod olinmoqda...");
    let qrCodeUuid = null;
    
    const qrRes = await fetch(`${BASE}/attendance/qrcodes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (qrRes.ok) {
       const qrData = await qrRes.json();
       if (qrData.results && qrData.results.length > 0) {
          qrCodeUuid = qrData.results[0].code;
          console.log("✅ Bazadan mavjud QR kod topildi.");
       }
    }

    if (!qrCodeUuid) {
       console.log("🔄 QR kod topilmadi, yangisi yaratilmoqda...");
       const createRes = await fetch(`${BASE}/attendance/qrcodes/generate_static/`, {
         method: 'POST',
         headers: { 
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({})
       });
       if (createRes.ok) {
          const createdData = await createRes.json();
          qrCodeUuid = createdData.code;
          console.log("✅ Yangi QR kod yaratildi.");
       } else {
          console.log("❌ Yaratishda xato:", await createRes.text());
          return;
       }
    }

    console.log("🔥 Muvaffaqiyatli! QR Kod (UUID):", qrCodeUuid);
    
    // HTML fayl yaratish
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maktab QR Kodi (Eshik uchun)</title>
        <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f0f2f5; margin: 0; }
            .card { background: white; padding: 3rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
            h1 { color: #333; margin-bottom: 10px; }
            p { color: #666; margin-bottom: 30px; }
            img { width: 400px; height: 400px; border: 20px solid white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Maktabga Kirish QR Kodi</h1>
            <p>O'qituvchilar ushbu kodni skaner qilib maktabga kirishlarini tasdiqlashadi</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrCodeUuid}" alt="QR Code" />
            <p style="margin-top: 20px; font-size: 12px; color: #aaa;">ID: ${qrCodeUuid}</p>
        </div>
        <script>
            window.print();
        </script>
    </body>
    </html>
    `;

    fs.writeFileSync('DOOR_QR_CODE.html', htmlContent);
    console.log("🎉 DOOR_QR_CODE.html fayli yaratildi va ochilmoqda...");
    
    // Windows dagi html faylni ochish
    exec('start DOOR_QR_CODE.html');

  } catch(e) {
    console.error("Xatolik:", e);
  }
}

run();
