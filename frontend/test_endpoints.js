const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@enterprise.com',
      password: 'Admin@123'
    });
    console.log('Login Success:', res.data);
  } catch (err) {
    console.log('Login Error:', err.response ? err.response.data : err.message);
  }

  try {
    const res2 = await axios.post('http://localhost:3000/api/auth/forgot-password', {
      email: 'admin@enterprise.com'
    });
    console.log('Forgot Password Success:', res2.data);
  } catch (err) {
    console.log('Forgot Password Error:', err.response ? err.response.data : err.message);
  }
}

test();
