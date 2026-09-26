import { isSupabaseConfigured, supabase } from "../../config/database.js";

const HISTORY_LIMIT = 12;

function databaseError(operation, error) {
    console.error(`Supabase conversation ${operation} failed:`, error.message);
}

async function getOrCreateUser({ platform, externalUserId, profile = {} }) {
    const identityField = platform === "telegram" ? "telegram_user_id" : "whatsapp_user_id";
    const user = platform === "telegram"
        ? {
            telegram_user_id: Number(externalUserId),
            telegram_username: profile.username || null,
            telegram_first_name: profile.firstName || null,
            telegram_last_name: profile.lastName || null
        }
        : { whatsapp_user_id: String(externalUserId) };

    const { data, error } = await supabase
        .from("users")
        .upsert(user, { onConflict: identityField })
        .select("id")
        .single();

    if (error) throw error;
    return data;
}

async function getOrCreateConversation({ userId, platform, externalChatId }) {
    const { data: existing, error: findError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("platform", platform)
        .eq("external_chat_id", String(externalChatId))
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (findError) throw findError;
    if (existing) return existing;

    const { data, error } = await supabase
        .from("conversations")
        .insert({
            user_id: userId,
            platform,
            external_chat_id: String(externalChatId),
            title: `${platform} chat`
        })
        .select("id")
        .single();

    if (error) throw error;
    return data;
}

async function getRecentMessages(conversationId) {
    const { data, error } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .in("role", ["user", "assistant"])
        .not("content", "is", null)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);

    if (error) throw error;
    return data.reverse().map(({ role, content }) => ({ role, content }));
}

async function insertMessage({ conversationId, userId, platform, role, content, messageType = "text", externalMessageId, metadata = {} }) {
    const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: userId,
        platform,
        role,
        content,
        message_type: messageType,
        external_message_id: externalMessageId ? String(externalMessageId) : null,
        metadata
    });

    if (error) throw error;
}

// Writes the incoming turn and returns the preceding turns for the AI. A
// database outage does not prevent the channel from answering the user.
export async function startConversationMessage(input) {
    if (!isSupabaseConfigured()) return null;

    try {
        const user = await getOrCreateUser(input);
        const conversation = await getOrCreateConversation({
            userId: user.id,
            platform: input.platform,
            externalChatId: input.externalChatId
        });
        const history = await getRecentMessages(conversation.id);

        await insertMessage({
            conversationId: conversation.id,
            userId: user.id,
            platform: input.platform,
            role: "user",
            content: input.content,
            messageType: input.messageType,
            externalMessageId: input.externalMessageId,
            metadata: input.metadata
        });

        return { userId: user.id, conversationId: conversation.id, platform: input.platform, history };
    } catch (error) {
        databaseError("write", error);
        return null;
    }
}

export async function saveAssistantMessage(memory, content, metadata = {}) {
    if (!memory || !isSupabaseConfigured()) return;

    try {
        await insertMessage({
            conversationId: memory.conversationId,
            userId: memory.userId,
            platform: memory.platform,
            role: "assistant",
            content,
            metadata
        });
    } catch (error) {
        databaseError("assistant write", error);
    }
}

export function withConversationHistory(systemPrompt, history = []) {
    return [{ role: "system", content: systemPrompt }, ...history];
}
