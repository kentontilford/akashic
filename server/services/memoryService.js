// Memory service implementation
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

async function getAllMemories() {
  const result = await pool.query("SELECT * FROM memories ORDER BY created_at DESC");
  return result.rows;
}

async function getUserMemories(userId) {
  const result = await pool.query(
    "SELECT * FROM memories WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows;
}

async function getMemoryById(id) {
  const result = await pool.query("SELECT * FROM memories WHERE id = $1", [id]);
  return result.rows[0];
}

async function createMemory(memory) {
  const result = await pool.query(
    "INSERT INTO memories (content, context, user_id) VALUES ($1, $2, $3) RETURNING *",
    [memory.content, memory.context || {}, memory.user_id]
  );
  return result.rows[0];
}

async function updateMemory(id, memory) {
  const result = await pool.query(
    "UPDATE memories SET content = $1, context = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
    [memory.content, memory.context || {}, id]
  );
  return result.rows[0];
}

async function deleteMemory(id) {
  const result = await pool.query("DELETE FROM memories WHERE id = $1 RETURNING id", [id]);
  return result.rows[0];
}

// Search memories by content
async function searchMemories(userId, searchTerm) {
  const result = await pool.query(
    "SELECT * FROM memories WHERE user_id = $1 AND content ILIKE $2 ORDER BY created_at DESC",
    [userId, `%${searchTerm}%`]
  );
  return result.rows;
}

module.exports = {
  getAllMemories,
  getUserMemories,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
  searchMemories
};
