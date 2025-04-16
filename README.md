# Akashic

Akashic is an AI assistant workspace application that enables users to have conversations with various AI profiles and manage memories and prompts.

## Features

- Multiple AI profiles with customizable prompt templates
- Memory system for context-aware conversations
- Prompt management for reusable templates
- Workspace organization for different projects

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Deployment**: Render, Vercel

## Getting Started

### Prerequisites

- Node.js 16+ 
- PostgreSQL 12+

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/akashic.git
cd akashic
```

2. Set up environment variables
```bash
# Copy the example env file
cp .env.example .env
# Edit the .env file with your configurations
```

3. Install dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

4. Set up the database
```bash
# Create a new PostgreSQL database
createdb akashic_db

# Run the initialization scripts
psql -d akashic_db -f db/schema.sql
psql -d akashic_db -f db/init.sql
```

5. Start the development servers
```bash
# Start the backend server (from the server directory)
npm run dev

# Start the frontend server (from the client directory)
npm run dev
```

The frontend should now be running at http://localhost:3000 and the backend at http://localhost:4000.

## Deployment

### Backend Deployment (Render)

1. Push your code to a Git repository
2. Create a new Web Service on Render
3. Connect your repository
4. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Environment Variables: Add all variables from your .env file

### Frontend Deployment (Vercel)

1. Push your code to a Git repository
2. Import your project into Vercel
3. Configure environment variables as needed
4. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
