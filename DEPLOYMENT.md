# Wedding Wager - Deployment Guide

## Overview
This application has been converted from a Vite React app to a Next.js application with Vercel Postgres database integration for persistent data storage across all users.

## Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up local database (optional for development):**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your local PostgreSQL connection details
   - Or skip this step and deploy directly to Vercel for database access

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## Deployment to Vercel

### Step 1: Deploy to Vercel
1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Deploy the application

### Step 2: Add Vercel Postgres Database
1. In your Vercel dashboard, go to your project
2. Navigate to the "Storage" tab
3. Click "Create Database" and select "Postgres"
4. Choose your plan (Hobby is free and sufficient for this app)
5. Create the database

### Step 3: Environment Variables
Vercel will automatically add the required environment variables for the Postgres database. No manual configuration needed.

### Step 4: Database Initialization
The database tables will be automatically created when the app first runs. The API includes automatic database initialization.

## Features

### Database Schema
- **users**: Stores user information and scores
- **criteria**: Stores prediction questions
- **predictions**: Stores user predictions for each question
- **winners**: Many-to-many relationship between criteria and winning users
- **game_settings**: Stores global settings like answer lock status

### API Endpoints
- `GET/POST /api/users` - User management and score updates
- `GET/POST /api/criteria` - Prediction question management
- `GET/POST /api/predictions` - User prediction submissions
- `POST /api/winners` - Toggle winners and update scores
- `GET/POST /api/settings` - Game settings (like answer locking)

### Key Changes from Original
1. **Persistent Storage**: Replaced local KV store with Vercel Postgres
2. **Real-time Sync**: Data syncs across all users every 5 seconds
3. **API Architecture**: All data operations go through Next.js API routes
4. **User Session**: User selection is now stored in localStorage (per-device)
5. **Database-backed Scoring**: Scores are calculated in the database for consistency

## Usage

1. **User Selection**: Each device selects a user from the predefined list
2. **Admin Access**: Admin users need the password "password1994"
3. **Making Predictions**: Users can submit predictions for each question
4. **Admin Controls**: Admins can add new questions, lock answers, and mark winners
5. **Scoring**: Winners automatically get points, viewable on the leaderboard

## Troubleshooting

### Database Connection Issues
- Ensure your Vercel Postgres database is active
- Check environment variables in Vercel dashboard
- View function logs in Vercel for specific errors

### Data Not Syncing
- Check browser console for API errors
- Verify all API endpoints are working in Vercel function logs
- Data refreshes every 5 seconds automatically

### User Authentication
- Admin password is hardcoded as "password1994"
- User selection is stored per-device in localStorage
- No traditional authentication system (designed for private wedding event)

## Security Notes
- This app is designed for a private wedding event
- Admin password is simple and hardcoded
- No user registration or complex authentication
- Database is accessible only through your Vercel deployment
- Consider changing admin password before deployment