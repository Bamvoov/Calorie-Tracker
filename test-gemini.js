const { GoogleGenAI } = require('@google/genai');

try {
  const ai = new GoogleGenAI({ apiKey: 'dummy' });
  console.log('Success!', typeof ai.models.generateContent);
} catch(e) {
  console.error('Error:', e);
}
