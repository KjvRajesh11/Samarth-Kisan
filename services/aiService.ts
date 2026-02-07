
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AgronomistScanReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Kishan Sahayak Chatbot: Handles complex agronomy Q&A
 */
export async function kisanSahayakChat(prompt: string, imageBase64?: string) {
  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: imageBase64 }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts },
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: `You are 'Kisan Sahayak', a wise and practical agricultural expert for Indian farmers. 
      Speak in simple terms. Provide actionable advice for the current season. 
      If the user provides a crop image, diagnose potential pests or diseases. 
      Use local Indian context (Mandis, bio-pesticides, Government schemes).`
    }
  });

  return response.text;
}

/**
 * Digital Agronomist Scan: High-structured lab analysis of photos
 */
export async function runAgronomistScan(imageBase64: string): Promise<AgronomistScanReport> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        { text: "Analyze this agricultural photo as an expert agronomist." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diagnosis: { type: Type.STRING, description: "Technical diagnosis of the crop condition or pest" },
          confidence: { type: Type.STRING, description: "AI confidence level (e.g. 95%)" },
          urgency: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          actionPlan: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Step-by-step treatment or corrective actions" 
          },
          prevention: { type: Type.STRING, description: "Advice on how to avoid this issue in future seasons" }
        },
        required: ["diagnosis", "confidence", "urgency", "actionPlan", "prevention"]
      },
      systemInstruction: "You are a Digital Agronomist Laboratory. Analyze crop, pest, or leaf images and provide a high-precision, structured medical-style report for a farmer."
    }
  });

  return JSON.parse(response.text);
}

/**
 * Real-time Mandi & News Grounding
 */
export async function getMandiNews(query: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text,
    sources: sources.map((c: any) => c.web?.uri).filter(Boolean)
  };
}

/**
 * Nearby Resources Grounding (Maps)
 */
export async function findNearbyResources(resourceType: string, lat: number, lng: number) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find me the nearest ${resourceType} like Mandis or seed banks.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      }
    }
  });

  const mapsChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text,
    places: mapsChunks.map((c: any) => ({
      uri: c.maps?.uri,
      title: c.maps?.title
    })).filter((p: any) => p.uri)
  };
}

/**
 * Audio Transcription using Flash
 */
export async function transcribeAudio(base64Audio: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "audio/wav", data: base64Audio } },
        { text: "Transcribe this audio message from a farmer exactly as spoken." }
      ]
    }
  });
  return response.text;
}

/**
 * Text-to-Speech Generation
 */
export async function generateSpeech(text: string, voice: string = 'Kore') {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return null;

  return base64Audio;
}

// Helper to play audio
export async function playTTS(base64: string) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
  
  const dataInt16 = new Int16Array(arrayBuffer);
  const frameCount = dataInt16.length;
  const buffer = audioContext.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
  return source;
}
