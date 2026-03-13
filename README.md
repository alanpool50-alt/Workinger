# Workinger - Recruitment Management System

A full-stack recruitment platform supporting English, Kurdish (Sorani), and Arabic.

## Features

- **Multi-language Support**: English, Kurdish, and Arabic with RTL support.
- **Job Exploration**: Browse and search for jobs with filters.
- **Application System**: Candidates can apply for jobs with a message.
- **Admin Dashboard**:
  - Real-time analytics (Total users, jobs, applications).
  - Dynamic Database Manager (View, edit, and delete records from any table).
- **Messaging**: Basic messaging system between candidates and recruiters.
- **Saved Jobs**: Bookmark jobs to view them later.
- **Responsive Design**: Mobile-first UI built with Tailwind CSS and Framer Motion.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Express.js, Better-SQLite3.
- **Language**: TypeScript.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses SQLite with the following tables:
- `users`: Candidate and Admin profiles.
- `companies`: Employer information.
- `jobs`: Job postings.
- `applications`: Job applications.
- `saved_jobs`: User bookmarks.
- `messages`: Chat history.

## Environment Variables

- `DATABASE_URL`: Path to the SQLite database file (default: `database.sqlite`).
- `GEMINI_API_KEY`: (Optional) For AI-powered features.
