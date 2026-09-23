import { askAI, askQuestion, explainTopic, summarizeText, generateQuiz, MODELS } from "./ai.service.js";

console.log("🧪 Testing COS MATE AI Service...\n");
console.log("Models configured:");
console.log(`  Main: ${MODELS.main}`);
console.log(`  Fast: ${MODELS.fast}`);
console.log(`  Vision: ${MODELS.vision}\n`);

// Test 1: Basic question
console.log("=== Test 1: Basic Question ===");
try {
  const response = await askQuestion("What is photosynthesis?");
  console.log("✅ Response received:");
  console.log(response.substring(0, 200) + "...\n");
} catch (error) {
  console.error("❌ Test 1 failed:", error.message, "\n");
}

// Test 2: Topic explanation
console.log("=== Test 2: Topic Explanation ===");
try {
  const response = await explainTopic("Binary Search Trees");
  console.log("✅ Response received:");
  console.log(response.substring(0, 200) + "...\n");
} catch (error) {
  console.error("❌ Test 2 failed:", error.message, "\n");
}

// Test 3: Summarization
console.log("=== Test 3: Text Summarization ===");
try {
  const sampleText = `
  Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water. 
  Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct. 
  The process converts light energy into chemical energy, which is stored in the bonds of sugar molecules.
  `;
  const response = await summarizeText(sampleText);
  console.log("✅ Response received:");
  console.log(response.substring(0, 200) + "...\n");
} catch (error) {
  console.error("❌ Test 3 failed:", error.message, "\n");
}

// Test 4: CBT Quiz Generation
console.log("=== Test 4: CBT Quiz Generation ===");
try {
  const sampleContent = `
  Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy. 
  There are two types of photosynthetic processes: oxygenic photosynthesis and anoxygenic photosynthesis. 
  The general principles of anoxygenic and oxygenic photosynthesis are very similar, but oxygenic photosynthesis is the most common and is seen in plants, algae and cyanobacteria.
  During oxygenic photosynthesis, light energy transfers electrons from water to carbon dioxide, producing carbohydrates. 
  In this transfer, the CO2 is reduced, or receives electrons, and the water is oxidized, or loses electrons.
  `;
  const quiz = await generateQuiz(sampleContent, 2, "easy");
  console.log("✅ Quiz generated:");
  console.log(JSON.stringify(quiz, null, 2).substring(0, 500) + "...\n");
} catch (error) {
  console.error("❌ Test 4 failed:", error.message, "\n");
}

console.log("✅ All tests completed!");