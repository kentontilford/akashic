const express = require('express');
const { Pool } = require('pg');
const auth = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get all conversations for the authenticated user
router.get('/', auth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*, p.name as profile_name 
       FROM conversations c
       LEFT JOIN profiles p ON c.profile_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Get a specific conversation with messages
router.get('/:id', auth, async (req, res, next) => {
  try {
    // Get the conversation details
    const conversationResult = await pool.query(
      `SELECT c.*, p.name as profile_name, p.prompt_template
       FROM conversations c
       LEFT JOIN profiles p ON c.profile_id = p.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const conversation = conversationResult.rows[0];
    
    // Get the messages for this conversation
    const messagesResult = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    
    conversation.messages = messagesResult.rows;
    
    res.json(conversation);
  } catch (err) {
    next(err);
  }
});

// Create a new conversation
router.post('/', auth, async (req, res, next) => {
  const { title, profile_id, workspace_id } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO conversations (title, profile_id, workspace_id, user_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [title || 'New Conversation', profile_id, workspace_id, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Add a message to a conversation
router.post('/:id/messages', auth, async (req, res, next) => {
  const { content, role } = req.body;
  
  try {
    // Verify the conversation exists and belongs to the user
    const conversationResult = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const conversation = conversationResult.rows[0];
    
    // Add the user message
    const userMessageResult = await pool.query(
      'INSERT INTO messages (content, role, conversation_id) VALUES ($1, $2, $3) RETURNING *',
      [content, role || 'user', req.params.id]
    );
    
    const userMessage = userMessageResult.rows[0];
    
    // If this is a user message, generate an AI response
    if (role === 'user' || role === undefined) {
      // Get the associated profile for this conversation
      const profileResult = await pool.query(
        'SELECT * FROM profiles WHERE id = $1',
        [conversation.profile_id]
      );
      
      if (profileResult.rows.length === 0) {
        return res.status(400).json({ message: 'Profile not found for this conversation' });
      }
      
      const profile = profileResult.rows[0];
      
      // Get previous messages for context
      const previousMessagesResult = await pool.query(
        'SELECT content, role FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 10',
        [req.params.id]
      );
      
      const previousMessages = previousMessagesResult.rows.reverse();
      
      // Only proceed with AI response if we have an API key
      if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
        try {
          let aiResponse;
          
          // Determine which API to use and generate response
          if (process.env.ANTHROPIC_API_KEY) {
            // Use Claude API
            aiResponse = await generateClaudeResponse(profile, previousMessages, content);
          } else {
            // Default to OpenAI
            aiResponse = await generateOpenAIResponse(profile, previousMessages, content);
          }
          
          // Save the AI response
          const aiMessageResult = await pool.query(
            'INSERT INTO messages (content, role, conversation_id) VALUES ($1, $2, $3) RETURNING *',
            [aiResponse, 'assistant', req.params.id]
          );
          
          // Update conversation's updated_at timestamp
          await pool.query(
            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [req.params.id]
          );
          
          return res.json({
            userMessage: userMessage,
            aiMessage: aiMessageResult.rows[0]
          });
        } catch (error) {
          console.error('AI API error:', error);
          return res.status(500).json({ message: 'Error generating AI response', error: error.message });
        }
      }
      
      // If no API key, just return the user message
      return res.json({ userMessage: userMessage, aiMessage: null });
    }
    
    // For non-user messages, just return the created message
    res.json(userMessage);
    
  } catch (err) {
    next(err);
  }
});

// Generate a response using Claude API
async function generateClaudeResponse(profile, previousMessages, userMessage) {
  try {
    const messages = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the current user message
    messages.push({ role: 'user', content: userMessage });
    
    // Prepare the Claude API request
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: messages,
        system: profile.prompt_template || 'You are a helpful assistant.'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_API_KEY
        }
      }
    );
    
    return response.data.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message);
    throw new Error('Failed to generate Claude response');
  }
}

// Generate a response using OpenAI API
async function generateOpenAIResponse(profile, previousMessages, userMessage) {
  try {
    const messages = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the current user message
    messages.push({ role: 'user', content: userMessage });
    
    // Add system message with profile template
    messages.unshift({
      role: 'system',
      content: profile.prompt_template || 'You are a helpful assistant.'
    });
    
    // Prepare the OpenAI API request
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: messages,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw new Error('Failed to generate OpenAI response');
  }
}

// Update a conversation
router.put('/:id', auth, async (req, res, next) => {
  const { title, profile_id, workspace_id } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE conversations 
       SET title = COALESCE($1, title), 
           profile_id = COALESCE($2, profile_id), 
           workspace_id = COALESCE($3, workspace_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, profile_id, workspace_id, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete a conversation
router.delete('/:id', auth, async (req, res, next) => {
  try {
    // First delete all associated messages
    await pool.query('DELETE FROM messages WHERE conversation_id = $1', [req.params.id]);
    
    // Then delete the conversation
    const result = await pool.query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;