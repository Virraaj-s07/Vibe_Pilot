import puter from '@heyputer/puter.js';

async function testPuter() {
    try {
        console.log('Testing Puter AI (Keyless Node.js)...');
        const response = await puter.ai.chat("Say 'Puter Connection Successful'", { model: 'google/gemini-2.0-flash' });
        console.log('Response:', response);
    } catch (err) {
        console.error('Puter Error:', err.message);
    }
}

testPuter();
