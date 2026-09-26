import { supabase } from "../../lib/supabase.js";
import crypto from "crypto";

/**
 * Calculate SHA-256 hash of a buffer
 * @param {Buffer} buffer - File buffer
 * @returns {string} Hex hash
 */
export function calculateHash(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Upload file to Supabase Storage
 * @param {Object} params
 * @param {string} params.userId - User UUID
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.filename - Original filename
 * @param {string} params.mimeType - MIME type
 * @returns {Object} Upload result with path and hash
 */
export async function uploadFile({ userId, buffer, filename, mimeType }) {
    const fileHash = calculateHash(buffer);
    const fileExt = filename.split(".").pop() || "bin";
    const storagePath = `${userId}/${fileHash}.${fileExt}`;

    // Check if file already exists
    const { data: existing } = await supabase.storage
        .from("documents")
        .list(userId, {
            search: fileHash,
            limit: 1
        });

    if (existing && existing.length > 0) {
        return { path: storagePath, hash: fileHash, cached: true };
    }

    // Upload to storage
    const { data, error } = await supabase.storage
        .from("documents")
        .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: false
        });

    if (error) {
        console.error("Storage upload error:", error);
        throw error;
    }

    return { path: storagePath, hash: fileHash, cached: false };
}

/**
 * Create document record in database
 * @param {Object} params
 * @returns {Object} Document record
 */
export async function createDocument({
    userId,
    conversationId,
    filename,
    mimeType,
    fileHash,
    storagePath,
    extractedText = null,
    pageCount = null,
    metadata = {}
}) {
    const { data, error } = await supabase
        .from("documents")
        .insert({
            user_id: userId,
            conversation_id: conversationId,
            name: filename,
            original_filename: filename,
            mime_type: mimeType,
            file_hash: fileHash,
            storage_path: storagePath,
            storage_bucket: "documents",
            extracted_text: extractedText,
            page_count: pageCount,
            processing_status: extractedText ? "processed" : "pending",
            metadata
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating document:", error);
        throw error;
    }

    return data;
}

/**
 * Get document by ID
 */
export async function getDocumentById(documentId) {
    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get documents by user ID
 */
export async function getUserDocuments(userId, limit = 20) {
    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Download file from storage
 */
export async function downloadFile(storagePath) {
    const { data, error } = await supabase.storage
        .from("documents")
        .download(storagePath);

    if (error) {
        console.error("Download error:", error);
        throw error;
    }

    return data;
}

export default {
    calculateHash,
    uploadFile,
    createDocument,
    getDocumentById,
    getUserDocuments,
    downloadFile
};