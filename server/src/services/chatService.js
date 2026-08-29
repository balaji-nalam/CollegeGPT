const ragService = require('./ragService');
const { query, isPostgresConnected, inMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const chatService = {
  // Execute Grounded RAG Chat query and persist to conversation history
  sendMessage: async ({ userId, conversationId = null, messageText, options = {} }) => {
    if (!messageText || messageText.trim().length === 0) {
      const err = new Error('Message cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    if (messageText.length > 2000) {
      const err = new Error('Message is too long. Please limit your inquiry to 2000 characters.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Resolve or Create Conversation
    let convId = conversationId;
    if (!convId) {
      convId = await chatService.createConversation(userId, messageText.slice(0, 40));
    } else {
      // Verify ownership
      const exists = await chatService.verifyConversationOwnership(userId, convId);
      if (!exists) {
        const err = new Error('Conversation not found or access denied');
        err.statusCode = 404;
        throw err;
      }
    }

    // 2. Persist User Message
    const userMsgId = await chatService.saveMessage({
      conversationId: convId,
      sender: 'user',
      content: messageText.trim(),
      isFallback: false,
    });

    // 3. Execute Grounded RAG Pipeline
    const ragResult = await ragService.processQuery(messageText, options);

    // 4. Persist Assistant Message
    const assistantMsgId = await chatService.saveMessage({
      conversationId: convId,
      sender: 'assistant',
      content: ragResult.answer,
      isFallback: !ragResult.supported,
    });

    // 5. Persist Source References into message_sources
    if (ragResult.sources && ragResult.sources.length > 0) {
      await chatService.saveMessageSources(assistantMsgId, ragResult.sources);
    }

    return {
      conversationId: convId,
      message: {
        id: assistantMsgId,
        answer: ragResult.answer,
        supported: ragResult.supported,
        sources: ragResult.sources || [],
        latency: ragResult.latency,
      },
    };
  },

  createConversation: async (userId, title = 'New Conversation') => {
    if (isPostgresConnected()) {
      const res = await query(
        `INSERT INTO conversations (user_id, title)
         VALUES ($1, $2)
         RETURNING id`,
        [userId, title]
      );
      return res.rows[0].id;
    }

    // In-Memory
    const id = uuidv4();
    inMemoryStore.conversations.set(id, {
      id,
      user_id: userId,
      title,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return id;
  },

  verifyConversationOwnership: async (userId, conversationId) => {
    if (isPostgresConnected()) {
      const res = await query('SELECT id FROM conversations WHERE id = $1 AND user_id = $2', [conversationId, userId]);
      return res.rows.length > 0;
    }
    const conv = inMemoryStore.conversations.get(conversationId);
    return !!(conv && String(conv.user_id) === String(userId));
  },

  saveMessage: async ({ conversationId, sender, content, isFallback = false }) => {
    if (isPostgresConnected()) {
      const res = await query(
        `INSERT INTO messages (conversation_id, sender, content, is_fallback)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [conversationId, sender, content, isFallback]
      );
      // Update conversation timestamp
      await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);
      return res.rows[0].id;
    }

    // In-Memory
    const id = uuidv4();
    inMemoryStore.messages.set(id, {
      id,
      conversation_id: conversationId,
      sender,
      content,
      is_fallback: isFallback,
      created_at: new Date(),
    });

    const conv = inMemoryStore.conversations.get(conversationId);
    if (conv) conv.updated_at = new Date();

    return id;
  },

  saveMessageSources: async (messageId, sources) => {
    for (const s of sources) {
      if (isPostgresConnected()) {
        await query(
          `INSERT INTO message_sources (message_id, document_id, chunk_id, document_title, page_number, similarity_score, snippet)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [messageId, s.documentId || null, s.chunkId || null, s.title, s.page || 1, s.similarity || 0, s.snippet || '']
        );
      } else {
        const id = uuidv4();
        inMemoryStore.message_sources.set(id, {
          id,
          message_id: messageId,
          document_id: s.documentId,
          chunk_id: s.chunkId,
          document_title: s.title,
          page_number: s.page,
          similarity_score: s.similarity,
          snippet: s.snippet,
          created_at: new Date(),
        });
      }
    }
  },

  listUserConversations: async (userId) => {
    if (isPostgresConnected()) {
      const res = await query(
        `SELECT id, title, created_at, updated_at 
         FROM conversations 
         WHERE user_id = $1 
         ORDER BY updated_at DESC`,
        [userId]
      );
      return res.rows;
    }

    const list = Array.from(inMemoryStore.conversations.values()).filter((c) => c.user_id === userId);
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return list;
  },

  getConversationDetails: async (userId, conversationId) => {
    const isOwner = await chatService.verifyConversationOwnership(userId, conversationId);
    if (!isOwner) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    if (isPostgresConnected()) {
      const convRes = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
      const msgRes = await query(
        `SELECT m.id, m.sender, m.content, m.is_fallback, m.created_at,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'documentId', ms.document_id,
                      'title', ms.document_title,
                      'page', ms.page_number,
                      'similarity', ms.similarity_score,
                      'snippet', ms.snippet
                    )
                  ) FILTER (WHERE ms.id IS NOT NULL), '[]'
                ) AS sources
         FROM messages m
         LEFT JOIN message_sources ms ON ms.message_id = m.id
         WHERE m.conversation_id = $1
         GROUP BY m.id
         ORDER BY m.created_at ASC`,
        [conversationId]
      );

      return {
        conversation: convRes.rows[0],
        messages: msgRes.rows,
      };
    }

    // In-Memory
    const conv = inMemoryStore.conversations.get(conversationId);
    const msgs = Array.from(inMemoryStore.messages.values())
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((m) => {
        const srcs = Array.from(inMemoryStore.message_sources.values())
          .filter((ms) => ms.message_id === m.id)
          .map((s) => ({
            documentId: s.document_id,
            title: s.document_title,
            page: s.page_number,
            similarity: s.similarity_score,
            snippet: s.snippet,
          }));
        return {
          ...m,
          sources: srcs,
        };
      });

    return {
      conversation: conv,
      messages: msgs,
    };
  },

  deleteConversation: async (userId, conversationId) => {
    const isOwner = await chatService.verifyConversationOwnership(userId, conversationId);
    if (!isOwner) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    if (isPostgresConnected()) {
      await query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    } else {
      inMemoryStore.conversations.delete(conversationId);
      for (const [mId, msg] of inMemoryStore.messages.entries()) {
        if (msg.conversation_id === conversationId) {
          inMemoryStore.messages.delete(mId);
          for (const [sId, src] of inMemoryStore.message_sources.entries()) {
            if (src.message_id === mId) inMemoryStore.message_sources.delete(sId);
          }
        }
      }
    }

    return { success: true, message: 'Conversation deleted successfully' };
  },
};

module.exports = chatService;
