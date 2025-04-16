// Prompt service implementation
const { Pool } = require("pg");
const axios = require("axios");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

async function getAllPrompts() {
  const result = await pool.query("SELECT * FROM prompts ORDER BY name");
  return result.rows;
}

async function getUserPrompts(userId) {
  // Get both public prompts (without user_id) and the user's own prompts
  const result = await pool.query(
    "SELECT * FROM prompts WHERE user_id IS NULL OR user_id = $1 ORDER BY name",
    [userId]
  );
  return result.rows;
}

async function getPromptById(id) {
  const result = await pool.query("SELECT * FROM prompts WHERE id = $1", [id]);
  return result.rows[0];
}

async function createPrompt(prompt) {
  const result = await pool.query(
    "INSERT INTO prompts (name, template, user_id) VALUES ($1, $2, $3) RETURNING *",
    [prompt.name, prompt.template, prompt.user_id]
  );
  return result.rows[0];
}

async function updatePrompt(id, prompt) {
  const result = await pool.query(
    "UPDATE prompts SET name = $1, template = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
    [prompt.name, prompt.template, id]
  );
  return result.rows[0];
}

async function deletePrompt(id) {
  const result = await pool.query("DELETE FROM prompts WHERE id = $1 RETURNING id", [id]);
  return result.rows[0];
}

async function executePrompt(data) {
  // Fetch the prompt template
  const promptResult = await pool.query("SELECT * FROM prompts WHERE id = $1", [data.prompt_id]);
  if (promptResult.rows.length === 0) {
    throw new Error("Prompt not found");
  }
  
  const prompt = promptResult.rows[0];
  let template = prompt.template;
  
  // Replace variables in the template
  for (const [key, value] of Object.entries(data.variables || {})) {
    template = template.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  
  // If API keys are available, call the appropriate AI service
  if (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
    try {
      let aiResponse;
      
      if (process.env.ANTHROPIC_API_KEY) {
        // Call Claude API
        aiResponse = await callClaudeAPI(template);
      } else {
        // Default to OpenAI
        aiResponse = await callOpenAIAPI(template);
      }
      
      return { 
        result: aiResponse,
        prompt_id: data.prompt_id,
        variables: data.variables || {},
        ai_generated: true
      };
    } catch (error) {
      console.error('AI API error:', error);
      // Fallback to template 
      return { 
        result: template,
        prompt_id: data.prompt_id,
        variables: data.variables || {},
        ai_generated: false,
        error: error.message
      };
    }
  }
  
  // If no API keys, just return the processed template
  return { 
    result: template,
    prompt_id: data.prompt_id,
    variables: data.variables || {},
    ai_generated: false
  };
}

// Helper function to call Claude API
async function callClaudeAPI(content) {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{ role: 'user', content }]
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
    throw new Error('Failed to generate response from Claude');
  }
}

// Helper function to call OpenAI API
async function callOpenAIAPI(content) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
        messages: [{ role: 'user', content }],
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
    throw new Error('Failed to generate response from OpenAI');
  }
}

module.exports = {
  getAllPrompts,
  getUserPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  executePrompt
};
