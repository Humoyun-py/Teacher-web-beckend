// 1. Try to register a new admin user
// 2. Then login with it to see the response format

const BASE = 'https://teacher-web-beckend.onrender.com/api/v1';

const run = async () => {
  // Step 1: Register admin
  console.log("=== Trying to REGISTER admin ===");
  try {
    const regRes = await fetch(`${BASE}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
        password_confirm: 'admin123',
        first_name: 'Admin',
        last_name: 'Direktor',
        role: 'admin'
      })
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status);
    console.log('Register Response:', JSON.stringify(regData, null, 2));
  } catch(e) { console.error('Register error:', e.message); }

  // Step 2: Try login
  console.log("\n=== Trying to LOGIN ===");
  try {
    const loginRes = await fetch(`${BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    console.log('Login ALL KEYS:', Object.keys(loginData));
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
  } catch(e) { console.error('Login error:', e.message); }
};

run();
