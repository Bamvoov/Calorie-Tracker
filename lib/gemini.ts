import { GoogleGenAI } from '@google/genai';

export async function estimateCalories(foodInput: string, apiKey: string) {
  let ai;
  try {
    if (!apiKey) throw new Error("Gemini API Key missing");
    ai = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
    throw new Error("AI service configuration error. Check your API key.");
  }
  
  const prompt = `
Estimate the calories for the following food items: "${foodInput}".
Force your output to be strictly valid JSON in the following format, and nothing else:
{
  "items": [
    {
      "name": "Name of the food item",
      "calories": 0
    }
  ],
  "total_calories": 0
}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    
    let textOutput = response.text;
    if (!textOutput) throw new Error('Empty response from Gemini');
    
    // Strip markdown code blocks if the model wrapped it
    textOutput = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const jsonOutput = JSON.parse(textOutput);
    return jsonOutput;
  } catch (error: any) {
    console.error('Error in estimateCalories:', error);
    throw new Error(error.message || 'Failed to estimate calories via AI');
  }
}
