import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const inventoryService = {
  /**
   * Analyzes the current stock and provides insights.
   */
  async analyzeStock(products: Product[]): Promise<string> {
    try {
      const inventorySummary = products.map(p => 
        `- ${p.name} (Qty: ${p.quantity}, Min: ${p.minLevel}, Category: ${p.category})`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this inventory data and provide a concise status report. 
        Highlight low stock items urgent for restock, potential overstock, and suggestion for better inventory balance.
        Data:
        ${inventorySummary}`,
        config: {
          systemInstruction: "You are an expert inventory manager. Be professional, concise, and actionable."
        }
      });
      return response.text || "Could not generate analysis.";
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "Error analyzing stock. Please check your API key.";
    }
  },

  /**
   * Parses a natural language string into a structured transaction or new product.
   * Useful for "Smart Add" features.
   */
  async parseNaturalLanguageUpdate(input: string): Promise<any> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract inventory updates from this text: "${input}". 
        Return a JSON object with 'type' (IN, OUT, NEW), 'items' array containing name, quantity, and estimated price if mentioned.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              updates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productName: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    action: { type: Type.STRING, enum: ["ADD_STOCK", "REMOVE_STOCK", "CREATE_PRODUCT"] },
                    details: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini Parse Error:", error);
      return null;
    }
  }
};
