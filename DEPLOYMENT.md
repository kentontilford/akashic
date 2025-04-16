# Deployment Guide for Akashic

This guide provides instructions for deploying the Akashic application to production environments.

## Prerequisites

- Node.js 16+
- PostgreSQL 12+
- Git repository for your project
- [Render](https://render.com/) account for backend and database hosting
- [Vercel](https://vercel.com/) account for frontend hosting (optional)

## Backend Deployment (Render)

1. Create a new Web Service on Render:
   - Go to the Render dashboard and click "New" → "Web Service"
   - Connect your GitHub/GitLab repository
   - Use the following settings:
     - Name: `akashic-server`
     - Environment: `Node`
     - Build Command: `cd server && npm install`
     - Start Command: `cd server && node index.js`
     - Instance Type: Select according to your needs (at least `Starter` recommended)

2. Set up environment variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a secure random string
   - `DATABASE_URL`: This will be automatically set if you create a Render PostgreSQL database
   - `ANTHROPIC_API_KEY`: Your Claude API key (if using Claude)
   - `OPENAI_API_KEY`: Your OpenAI API key (if using OpenAI)

3. Create a PostgreSQL database on Render:
   - Go to the Render dashboard and click "New" → "PostgreSQL"
   - Use the following settings:
     - Name: `akashic-db`
     - PostgreSQL Version: 14 or higher
     - Instance Type: Select according to your needs (at least `Starter` recommended)
   - After creation, note the connection details

4. Initialize the database:
   - Once the database is created, you can run the initialization scripts either:
     - Through Render postDeploy script (specified in render.yaml)
     - Manually by connecting to the database and running the SQL files in the db folder

## Frontend Deployment (Vercel)

1. Import your project to Vercel:
   - Go to Vercel dashboard and click "Add New" → "Project"
   - Import your GitHub/GitLab repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: `client`
     - Build Command: `npm run build`
     - Output Directory: `.next`

2. Set up environment variables:
   - `NEXT_PUBLIC_API_URL`: URL of your backend service (e.g., `https://akashic-server.onrender.com`)

3. Deploy the project:
   - Click "Deploy" and wait for the build to complete

## Alternative Frontend Deployment (Render)

If you prefer to host both frontend and backend on Render:

1. Create a new Web Service on Render:
   - Name: `akashic-client`
   - Environment: `Node`
   - Build Command: `cd client && npm install && npm run build`
   - Start Command: `cd client && npm start`
   - Environment Variables:
     - `NEXT_PUBLIC_API_URL`: URL of your backend service

## DNS Configuration (Optional)

If you have a custom domain:

1. Configure DNS for your domain:
   - Add CNAME records pointing to your Vercel and/or Render deployments
   - For example: `app.yourdomain.com` → `yourproject.vercel.app`
   - For example: `api.yourdomain.com` → `akashic-server.onrender.com`

2. Update environment variables:
   - Update `NEXT_PUBLIC_API_URL` to use your custom domain
   - Update CORS settings in the backend to allow your custom domain

## Monitoring and Logging

- Use Render's built-in logging to monitor your application
- Consider implementing a more robust logging solution for production

## Troubleshooting

If you encounter issues with your deployment:

1. Check the logs in Render/Vercel for error messages
2. Verify that all environment variables are correctly set
3. Ensure your database is properly initialized with the schema
4. Check CORS settings if the frontend cannot communicate with the backend

## Updating Your Deployment

To update your application:

1. Push changes to your repository
2. Render and Vercel will automatically rebuild and deploy the changes