import { supabase } from "../../lib/supabase.js";

/**
 * Get or create a conversation for a user on a specific platform
 * @param {Object} params
 * @param {string} params.userId - Internal user UUID
 * @param {string} params.platform - 'telegram' | 'whatsapp' | 'web'
 * @param {string} params.externalChatId - Platform-specific chat ID
 * @returns {Object} Conversation record
 */
export async function getOrCreateConversation({
    userId,
    platform,
    externalChatId
}) {
    // Try to find existing conversation
    const { data: existing, error: findError } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", platform)
        .eq("external_chat_id", externalChatId)
        .maybeSingle();

    if (findError) {
        console.error("Error finding conversation:", findError);
        throw findError;
    }

    if (existing) {
        return existing;
    }

    // Create new conversation
    const { data, error: createError } = await supabase
        .from("conversations")
        .insert({
            user_id: userId,
            platform,
            external_chat_id: externalChatId,
            last_message_at: new Date().toISOString()
        })
        .select()
        .single();

    if (createError) {
        console.error("Error creating conversation:", createError);
        throw createError;
    }

    return data;
}

/**
 * Get conversation by ID
 */
export async function getConversationById(conversationId) {
    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(conversationId, title) {
    const { data, error } = await supabase
        .from("conversations")
        .update({ title })
        .eq("id", conversationId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export default {
    getOrCreateConversation,
    getConversationById,
    updateConversationTitle
};