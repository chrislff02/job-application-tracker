# Job Application Tracker

A full-stack web application for tracking job applications, interviews, and application progress in one place.

The app includes authentication, application management, a Kanban-style pipeline, interview tracking, dashboard metrics, analytics, and activity history.

## Features

- User registration and login
- JWT-based authentication
- Create, edit, delete, and view job applications
- Track application statuses:
  - Saved
  - Applied
  - Assessment
  - Phone Screen
  - Interview
  - Final Interview
  - Offer
  - Rejected
  - Withdrawn
- Search, filter, sort, and paginate applications
- Kanban-style pipeline with drag-and-drop status updates
- Mobile-friendly status controls
- Detailed application pages
- Recruiter and contact information
- Job posting links
- Notes and salary information
- Interview tracking
- Application activity history
- Dashboard metrics
- Recent applications
- Upcoming interviews
- Analytics for:
  - Applications added over time
  - Application sources
  - Status distribution
  - Interview rate
  - Rejection rate
  - Offer rate
  - Average response time
- Responsive design for desktop, tablet, and mobile

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Recharts
- CSS

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JSON Web Tokens
- bcrypt

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL

### Clone the Repository

git clone YOUR_REPOSITORY_URL

cd job-application-tracker

### Configure the Backend

Go into the server directory:

cd server

Install dependencies:

npm install

Create a .env file based on server/.env.example with:

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_jwt_secret

PORT=5001

CLIENT_URL=http://localhost:5173

Run the database migrations:

npx prisma migrate dev

Generate the Prisma client:

npx prisma generate

Start the backend:

npm run dev

The API will run at:

http://localhost:5001

You can verify that the API is running by visiting:

http://localhost:5001/api/health

### Configure the Frontend

Open another terminal and go into the client directory:

cd client

Install dependencies:

npm install

Create a .env file based on client/.env.example with:

VITE_API_URL=http://localhost:5001/api

Start the frontend:

npm run dev

The frontend will run at:

http://localhost:5173

## Available Scripts

### Client

npm run dev

npm run build

npm run lint

npm run preview

### Server

npm run dev

npm run build

npm start

npm run db:generate

npm run db:migrate

npm run db:deploy

## Environment Variables

### Client

VITE_API_URL

Base URL used by the frontend to communicate with the backend API.

### Server

DATABASE_URL

PostgreSQL connection string.

JWT_SECRET

Secret used to sign and verify authentication tokens.

PORT

Port used by the Express server.

CLIENT_URL

Allowed frontend origin for CORS.

## API Overview

Main API route groups include:

- /api/auth
- /api/applications
- /api/dashboard
- /api/applications/:applicationId/interviews
- /api/interviews/:id

Protected routes require an authentication token in the Authorization header.

Example:

Authorization: Bearer <token>

## Database

The application uses PostgreSQL with Prisma ORM.

Main models include:

- User
- Application
- Interview
- ApplicationActivity

Prisma migrations are stored in:

server/prisma/migrations

## Security

- Passwords are hashed using bcrypt
- Authentication uses signed JWTs
- Protected backend routes validate JWTs
- Application and interview data are scoped to the authenticated user
- CORS is restricted to the configured frontend origin
- Environment files containing secrets are excluded from Git

## Responsive Design

The interface is designed to work across desktop, tablet, and mobile devices.

The pipeline uses drag-and-drop interactions on larger screens and a status selector on mobile devices.

## Future Improvements

Potential future additions include:

- Resume and job-description comparison
- Skill matching and missing-skill detection
- Automatic extraction of job details from pasted job postings
- More advanced historical analytics
- Notifications and reminders
- Additional dashboard customization
