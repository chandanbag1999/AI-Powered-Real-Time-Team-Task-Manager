const { GoogleGenerativeAI } = require('@google/generative-ai');



const geminiPrompt = async (userPrompt) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables. Please add it to your .env file.');
  }

  try {
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Using the correct model name: gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const text = response.text();
    
    // console.log('Gemini API response text:', text);

    return text || 'AI response not found';

  } catch (err) {
    console.error('Gemini error:', err);
    throw new Error('Gemini API failed');
  }
};

module.exports = geminiPrompt;