import Groq from "groq-sdk";
import { env } from "../../config/env.js";

export const groq = new Groq({
  apiKey: env.groqApiKey
});

export default groq;