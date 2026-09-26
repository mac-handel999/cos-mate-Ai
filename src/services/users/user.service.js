import { supabase } from "../../lib/supabase.js";

/**
 * Find or create a user based on platform identity
 * @param {Object} params
 * @param {string} params.platform - 'telegram' | 'whatsapp' | 'web'
 * @param {string} params.externalUserId - Platform-specific user ID
 * @param {string} params.displayName - Display name for the user
 * @returns {Object} User record
 */
export async function findOrCreateUser({
    platform,
    externalUserId,
    displayName = null
}) {
    const column = platform === "telegram"
        ? "telegram_id"
        : platform === "whatsapp"
            ? "whatsapp_user_id"
            : "auth_user_id";

    // Try to find existing user
    const { data: existingUser, error: findError } = await supabase
        .from("users")
        .select("*")
        .eq(column, externalUserId)
        .maybeSingle();

    if (findError) {
        console.error("Error finding user:", findError);
        throw findError;
    }

    // Update existing user
    if (existingUser) {
        const { data, error: updateError } = await supabase
            .from("users")
            .update({
                display_name: displayName,
                last_seen_at: new Date().toISOString()
            })
            .eq("id", existingUser.id)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating user:", updateError);
        }

        return data || existingUser;
    }

    // Create new user
    const insertData = {
        display_name: displayName,
        last_seen_at: new Date().toISOString()
    };

    if (platform === "telegram") {
        insertData.telegram_id = externalUserId;
    } else if (platform === "whatsapp") {
        insertData.whatsapp_user_id = externalUserId;
    }

    const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert(insertData)
        .select()
        .single();

    if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
    }

    return newUser;
}

/**
 * Get user by internal ID
 */
export async function getUserById(userId) {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) throw error;
    return data;
}

export default { findOrCreateUser, getUserById };