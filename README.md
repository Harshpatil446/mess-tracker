# Mess Tiffin Tracker

A full-stack MERN application for tracking mess/tiffin plans, meal consumption, and automatic end-date calculation.

## Features
- **User Authentication:** JWT based secure login/register.
- **Mess Plans:** Create full or half plans with initial payment date tracking.
- **Calendar Tracking:** Mark breakfast/lunch for each day on an interactive calendar.
- **Dynamic Stats:** Automatically calculate consumed days (half/full), skipped days, and project the plan's end date.
- **History:** View past mess cycles and their statistics.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, React Router, Axios, date-fns, lucide-react.
- **Backend:** Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, bcryptjs.

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `server` folder: `cd server`
2. Install dependencies: `npm install`
3. Add your MongoDB Atlas connection string to `server/.env`:
   ```env
   MONGO_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_jwt_secret_here
   PORT=8080
   CLIENT_URL=http://localhost:5173
   ```
4. Start the development server: `npm run dev`

### 2. Frontend Setup
1. Navigate to the `client` folder: `cd client`
2. Install dependencies: `npm install`
3. Ensure `client/.env` has the correct API URL (defaults to `http://localhost:8080/api`).
4. Start the development server: `npm run dev`

## Folder Structure
Follows a clean, beginner-friendly MVP structure for both client and server.
