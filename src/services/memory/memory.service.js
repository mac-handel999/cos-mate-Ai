import { supabase } from "../../lib/supabase.js";

/**
 * Save a message to the conversation
 * @param {Object} params
 * @param {string} params.conversationId - Conversation UUID
 * @param {string} params.platformMessageId - Platform-specific message ID
 * @param {string} params.senderType - 'user' | 'assistant' | 'system'
 * @param {string} params.messageType - 'text' | 'image' | 'document' | etc.
 * @param {string} params.text - Message content
 * @param {Object} params.metadata - Additional metadata
 * @returns {Object} Saved message record
 */
export async function saveMessage({
    conversationId,
    platformMessageId,
    senderType,
    messageType = "text",
    text,
    metadata = {}
}) {
    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            platform_message_id: platformMessageId,
            sender_type: senderType,
            role: senderType, // role column required by schema
            message_type: messageType,
            content: text,
            metadata
        })
        .select()
        .single();

    if (error) {
        console.error("Error saving message:", error);
        throw error;
    }

    // Update conversation last message timestamp
    await supabase
        .from("conversations")
        .update({
            last_message_at: new Date().toISOString()
        })
        .eq("id", conversationId);

    return data;
}

/**
 * Get recent messages from a conversation
 * @param {string} conversationId - Conversation UUID
 * @param {number} limit - Number of messages to retrieve
 * @returns {Array} Array of message records (oldest first)
 */
export async function getRecentMessages(conversationId, limit = 12) {
    const { data, error } = await supabase
        .from("messages")
        .select(`
            id,
            sender_type,
            content,
            message_type,
            metadata,
            created_at
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error getting recent messages:", error);
        throw error;
    }

    // Reverse to get chronological order
    return (data || []).reverse();
}

/**
 * Get message count for a conversation
 */
export async function getMessageCount(conversationId) {
    const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId);

    if (error) throw error;
    return count || 0;
}

export default { saveMessage, getRecentMessages, getMessageCount };