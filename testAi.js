const geminiPrompt = require('./src/config/gemini');

exports.testGemini = async (req, res) => {
  try {
    const testPrompt = 'List 3 benefits of drinking water';
    const reply = await geminiPrompt(testPrompt);
    res.status(200).json({ message: 'Gemini responded', reply });
  } catch (error) {
    res.status(500).json({ message: 'Gemini test failed', error: error.message });
  }
};
