export async function kisanSahayakChat() {
  return "AI Assistant temporarily disabled. Showing rule-based advice.";
}

export async function runAgronomistScan() {
  return {
    diagnosis: "Rule-based analysis",
    confidence: "N/A",
    urgency: "LOW",
    actionPlan: [
      "Inspect crop manually",
      "Follow local agricultural officer guidance"
    ],
    prevention: "Maintain regular crop monitoring"
  };
}

export async function getMandiNews() {
  return {
    text: "Offline mode: Showing last known mandi guidance.",
    sources: []
  };
}

export async function findNearbyResources() {
  return {
    text: "Location-based services disabled",
    places: []
  };
}

export async function transcribeAudio() {
  return "Audio transcription unavailable in offline mode.";
}

export async function generateSpeech() {
  return null;
}
