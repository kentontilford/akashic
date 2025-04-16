-- Initialize database with default data

-- Import schema first
\i schema.sql

-- Create a default user (password: password123)
INSERT INTO users (email, password_hash, name) 
VALUES ('demo@example.com', '$2b$10$LIpVVwDuHWRn.OXYNtXzqe2hbpx8ZV9sxxQJlvftvVa1yfzVTHyKK', 'Demo User')
ON CONFLICT (email) DO NOTHING;

-- Insert default profiles
INSERT INTO profiles (name, prompt_template)
VALUES 
  ('The Mirror', 'Reflect this to the user: {{input}}'),
  ('The Strategist', 'Guide decisively: {{input}}')
ON CONFLICT DO NOTHING;

-- Insert some sample prompts
INSERT INTO prompts (name, template)
VALUES 
  ('Simple Echo', '{{input}}'),
  ('Analyze Text', 'Analyze the following text carefully and provide your insights: {{input}}'),
  ('Brainstorm Ideas', 'Brainstorm creative ideas related to: {{input}}')
ON CONFLICT DO NOTHING;
