# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build: `cd client && npm run build`
- Dev: `cd client && npm run dev`
- Start: `cd client && npm run start`

## Code Style
- TypeScript with strict mode enabled
- React functional components with hooks
- NextJS for frontend framework
- Tailwind CSS for styling
- 2-space indentation
- Single quotes for strings
- No semicolons at line endings
- PascalCase for components and interfaces
- camelCase for variables, functions, and properties
- Use explicit types rather than inferred where possible
- Prefer async/await over Promise chains
- Use try/catch for error handling
- Group imports: React, external libraries, internal components, styles

## Project Structure
- Frontend code in `/client`
- Backend code in `/server`
- Database files in `/db`
- Documentation in `/docs`