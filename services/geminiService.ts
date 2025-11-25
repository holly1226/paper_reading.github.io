
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExplanationLevel, PaperMetadata } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to determine model based on complexity (simulated logic)
const MODEL_FLASH = 'gemini-2.5-flash';

export const parsePaperWithGemini = async (rawText: string): Promise<PaperMetadata> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
    You are an expert academic paper interpreter for students.
    Analyze the following academic paper text and extract structured information.
    
    CRITICAL INSTRUCTION: All descriptive fields (abstract, problem_solved, method_used, takeaway, etc.) MUST be in **Simple, Layman Simplified Chinese (简体中文)**. Explain it like you are talking to a smart high school student.
    
    If 'affiliations' (institutions) or 'url' (links/DOI) are found in the header/footer, extract them.
    
    Paper Text (Truncated):
    ${rawText.substring(0, 25000)}
  `;

  // Define the schema for structured output
  const paperSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      type: { type: Type.STRING, description: "论文类型 e.g., 实证研究, 综述, 方法论" },
      year: { type: Type.INTEGER },
      venue: { type: Type.STRING },
      authors: { type: Type.ARRAY, items: { type: Type.STRING } },
      affiliations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Authors' institutions found in text" },
      url: { type: Type.STRING, description: "DOI or URL if present, else empty string" },
      keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      citation_count: { type: Type.INTEGER, description: "Estimate if unknown, or 0" },
      abstract: { type: Type.STRING, description: "Summary in simplified Chinese" },
      problem_solved: { type: Type.STRING, description: "用大白话(小孩能听懂)解释解决了什么问题 (中文)" },
      method_used: { type: Type.STRING, description: "用大白话解释用了什么方法 (中文)" },
      implementation: { type: Type.STRING, description: "Implementation details in Chinese" },
      results: { type: Type.STRING, description: "Key results in Chinese" },
      impact: { type: Type.STRING, description: "Impact on the field in Chinese" },
      comparison: { type: Type.STRING, description: "Comparison with other methods in Chinese" },
      takeaway: { type: Type.STRING, description: "The single most important takeaway in Chinese" }
    },
    required: ["title", "type", "year", "abstract", "problem_solved", "method_used", "takeaway"],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: paperSchema,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");
    
    return JSON.parse(jsonText) as PaperMetadata;

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

export const explainTermWithGemini = async (term: string, context: string, level: ExplanationLevel): Promise<string> => {
  if (!apiKey) return `(模式演示) "${term}" 的解释需要API Key。`;

  // Adjust prompt based on level
  let audience = "high school student";
  if (level === ExplanationLevel.BEGINNER) audience = "primary school student (5 year old)";
  if (level === ExplanationLevel.EXPERT) audience = "PhD researcher";

  const prompt = `
    Explain the text "${term}" found in this paper context:
    "${context.substring(0, 300)}..."
    
    Target Audience: ${audience}.
    Language: Simplified Chinese (简体中文).
    Tone: Friendly, simple, easy to understand.
    Constraint: Keep it under 60 words. Use a metaphor if it helps.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
    });
    return response.text || "无法生成解释。";
  } catch (error) {
    console.error("Gemini Explanation Error", error);
    return "解释服务暂时不可用 (可能超出配额)。";
  }
};

export const extractKnowledgeGraph = async (text: string): Promise<{nodes: any[], links: any[]}> => {
    if (!apiKey) return { nodes: [], links: [] };

    const prompt = `
      Extract key technical terms/concepts from this text for a knowledge graph.
      Return JSON with 'nodes' and 'links'.
      
      IMPORTANT: The 'desc' (description) field MUST be in **Simplified Chinese (简体中文)** and very easy to understand (layman terms).
      
      Text: ${text.substring(0, 15000)}
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            nodes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        group: { type: Type.INTEGER },
                        desc: { type: Type.STRING, description: "Simple layman definition in Chinese" },
                        val: {type: Type.INTEGER, description: "Importance 10-30"}
                    }
                }
            },
            links: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: { type: Type.STRING },
                        target: { type: Type.STRING },
                        value: { type: Type.INTEGER }
                    }
                }
            }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        return JSON.parse(response.text || '{"nodes": [], "links": []}');
    } catch (e) {
        console.error("Graph extraction failed", e);
        return { nodes: [], links: [] };
    }
}