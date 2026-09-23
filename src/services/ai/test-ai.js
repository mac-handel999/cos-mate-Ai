import { askAI } from "./ai.service.js";
import { COS_MATE_SYSTEM_PROMPT } from "./prompts.js";

try {
  const response = await askAI({
    messages: [
      {
        role: "system",
        content: COS_MATE_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: "Explain binary search trees to a first-year university student."
      }
    ]
  });

  console.log("\n==============================");
  console.log("COS MATE AI TEST");
  console.log("==============================\n");

  console.log(response);

  console.log("\n==============================\n");

} catch (error) {
  console.error("AI test failed:");
  console.error(error);
}