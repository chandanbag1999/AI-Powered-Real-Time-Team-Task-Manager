const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiPrompt = async (userPrompt) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    // console.error('GEMINI_API_KEY is not defined in environment variables');
    throw new Error('GEMINI_API_KEY is not defined in environment variables. Please add it to your .env file.');
  }

  if (!userPrompt || typeof userPrompt !== 'string') {
    // console.error('Invalid prompt provided to geminiPrompt:', userPrompt);
    throw new Error('Invalid prompt provided to Gemini API');
  }

  try {
    // console.log('Initializing Gemini API with key length:', GEMINI_API_KEY.length);
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Using the correct model name: gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // console.log('Sending prompt to Gemini API, prompt length:', userPrompt.length);
    
    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const text = response.text();
    
    // console.log('Gemini API response received, text length:', text.length);

    return text || 'AI response not found';

  } catch (err) {
    console.error('Gemini error:', err);
    
    // Provide more detailed error message
    if (err.message && err.message.includes('API key not valid')) {
      throw new Error('Invalid Gemini API key. Please check your .env file.');
    }
    
    throw new Error(`Gemini API failed: ${err.message}`);
  }
};

module.exports = geminiPrompt;