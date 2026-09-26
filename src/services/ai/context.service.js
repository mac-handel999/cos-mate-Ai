import { supabase } from "../../lib/supabase.js";
import { getRecentMessages } from "../memory/memory.service.js";

/**
 * Build AI context from conversation history
 * Converts database messages to AI-compatible format
 * @param {string} conversationId - Conversation UUID
 * @param {number} messageLimit - Number of recent messages to include
 * @returns {Array} Array of AI messages {role, content}
 */
export async function buildChatContext(conversationId, messageLimit = 12) {
    const messages = await getRecentMessages(conversationId, messageLimit);

    return messages.map(message => ({
        role: message.sender_type === "user" ? "user" : "assistant",
        content: message.content
    }));
}

/**
 * Get user profile context for AI
 * @param {string} userId - User UUID
 * @returns {Object} User context
 */
export async function getUserContext(userId) {
    const { data, error } = await supabase
        .from("users")
        .select("display_name, university_id, department, level")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error("Error getting user context:", error);
        return null;
    }

    return data;
}

export default { buildChatContext, getUserContext };