// Profile service implementation
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Load defaults from files
const rolesDirectory = path.join(__dirname, "../../db/roles");

async function getAllProfiles() {
  const result = await pool.query("SELECT * FROM profiles ORDER BY name");
  return result.rows;
}

async function getUserProfiles(userId) {
  // Get both public profiles (without user_id) and the user's own profiles
  const result = await pool.query(
    "SELECT * FROM profiles WHERE user_id IS NULL OR user_id = $1 ORDER BY name",
    [userId]
  );
  return result.rows;
}

async function getProfileById(id) {
  const result = await pool.query("SELECT * FROM profiles WHERE id = $1", [id]);
  return result.rows[0];
}

async function createProfile(profile) {
  const result = await pool.query(
    "INSERT INTO profiles (name, prompt_template, user_id) VALUES ($1, $2, $3) RETURNING *",
    [profile.name, profile.prompt_template, profile.user_id]
  );
  return result.rows[0];
}

async function updateProfile(id, profile) {
  const result = await pool.query(
    "UPDATE profiles SET name = $1, prompt_template = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
    [profile.name, profile.prompt_template, id]
  );
  return result.rows[0];
}

async function deleteProfile(id) {
  const result = await pool.query("DELETE FROM profiles WHERE id = $1 RETURNING id", [id]);
  return result.rows[0];
}

async function loadDefaultProfiles() {
  try {
    // Check if we need to load default profiles
    const profileCount = await pool.query("SELECT COUNT(*) FROM profiles");
    
    // Only load defaults if there are no profiles yet
    if (parseInt(profileCount.rows[0].count) === 0) {
      const defaultProfiles = [
        {
          name: "The Mirror",
          prompt_template: "You are a reflective assistant that echoes back user input with minimal processing. Simply reflect the user's thoughts and questions back to them."
        },
        {
          name: "The Strategist",
          prompt_template: "You are a decisive strategic advisor. Provide clear, actionable guidance on any topic. Focus on concrete steps, decision frameworks, and implementable plans."
        },
        {
          name: "The Scholar",
          prompt_template: "You are a scholarly assistant with deep knowledge across many fields. Respond with well-researched, nuanced answers that consider multiple perspectives and cite relevant sources when possible."
        },
        {
          name: "The Creative",
          prompt_template: "You are a highly creative assistant focused on generating novel ideas and connections. Think outside the box and provide innovative, imaginative responses to any prompt."
        }
      ];
      
      // Try to load from files first
      let loadedFromFiles = false;
      
      try {
        if (fs.existsSync(rolesDirectory)) {
          const files = fs.readdirSync(rolesDirectory);
          
          for (const file of files) {
            if (file.endsWith(".json")) {
              const filePath = path.join(rolesDirectory, file);
              const content = fs.readFileSync(filePath, "utf8");
              const profileData = JSON.parse(content);
              
              await pool.query(
                "INSERT INTO profiles (name, prompt_template) VALUES ($1, $2)",
                [profileData.name, profileData.prompt_template]
              );
              console.log(`Added profile from file: ${profileData.name}`);
              loadedFromFiles = true;
            }
          }
        }
      } catch (err) {
        console.error("Error loading profiles from files:", err);
      }
      
      // Fall back to hardcoded defaults if no files were loaded
      if (!loadedFromFiles) {
        for (const profile of defaultProfiles) {
          await pool.query(
            "INSERT INTO profiles (name, prompt_template) VALUES ($1, $2)",
            [profile.name, profile.prompt_template]
          );
          console.log(`Added default profile: ${profile.name}`);
        }
      }
    } else {
      console.log(`Profiles already exist (${profileCount.rows[0].count}), skipping defaults`);
    }
  } catch (err) {
    console.error("Error loading default profiles:", err);
    throw err;
  }
}

module.exports = {
  getAllProfiles,
  getUserProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  loadDefaultProfiles
};
