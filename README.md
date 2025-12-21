## Draftly: Gmail AI Reply Agent

An automated Gmail assistant that monitors an inbox, generates AI-powered draft replies, and exposes them via a web UI for review, editing, approval, or rejection before sending.

## Overview

Draftly is a Node.js + TypeScript application that:

- Connects to a Gmail inbox using IMAP and app-password auth
- Polls for new messages and generates reply drafts using the Groq API
- Stores drafts and their lifecycle history in a lightweight JSON datastore
- Exposes REST APIs for listing, editing, approving, and rejecting drafts
- Serves a minimal frontend to manage the review-and-approve workflow

## Features

- **Email Monitoring**: Continuously checks for new emails in a Gmail inbox
- **Spam Filtering**: Identifies and filters out potential spam messages
- **AI-Powered Responses**: Generates contextually appropriate responses using the Groq API
- **Personalized Context**: Maintains a consistent persona and response style
- **Automated Reply System**: Sends responses without requiring manual intervention

The application follows a modular architecture with the following key components:

### Core Components

1. **Email Service**: Handles email polling, fetching, and sending replies
2. **Groq Service**: Integrates with the Groq AI API to generate responses
3. **Handlers**: Process emails and manage the response generation workflow
4. **Draft Store**: Persists generated drafts, statuses, and history

### Directory Structure

```
src/
├── config/         # Configuration settings
├── handlers/       # Email and AI response handlers
├── services/       # Core services (Email, Groq, Draft store)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and logging
├── server.ts       # Express API server
└── index.ts        # Application entry point

public/
└── index.html      # Minimal frontend for draft review
```

## Core Components

### Email Service

Responsible for:

- Connecting to Gmail using IMAP protocol
- Polling for new emails at regular intervals
- Parsing email content
- Sending automated responses

### Groq Service

Manages interactions with the Groq API:

- Formats prompts for AI response generation
- Sends requests to the AI model
- Processes and returns generated responses

### Handlers & Draft Store

- **EmailHandler**: Main orchestrator that coordinates email processing workflow and creates drafts instead of auto-sending
- **SpamHandler**: Filters out spam based on keywords
- **AIResponseHandler**: Creates contextual prompts and manages the response generation, supporting multiple tones
- **DraftStore**: File-backed JSON store for drafts, statuses (pending / draft_generated / draft_edited / sent / rejected), and history

### REST API & Frontend

- **Express Server (`server.ts`)**

  - `GET /api/drafts?status=<optional>` – List drafts, optionally filtered by status
  - `GET /api/drafts/:id` – Get a single draft with its original email and history
  - `POST /api/drafts/:id/edit` – Update draft text and tone
  - `POST /api/drafts/:id/approve` – Approve and send a reply via Gmail, mark as `sent`
  - `POST /api/drafts/:id/reject` – Mark draft as `rejected`, no email is sent

- **Frontend **
  - List of drafts with status filters
  - Detail view with original email, AI draft, tone selector, and history
  - Buttons to save edits, approve & send, or reject

## Configuration

The application uses environment variables for configuration:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
GROQ_API_KEY=your-groq-api-key
EMAIL_POLL_INTERVAL=3000  # Optional, defaults to 3000ms
GROQ_MODEL=mixtral-8x7b-32768  # Optional
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the required configuration
4. Start the application:

   ```
   npm run dev
   ```

5. Open the web UI:

6. Navigate to `/frontend`
7. Install dependencies:
   ```
   npm install
   ```
8. Create a `.env` file with the required configuration
9. Start the application:

   ```
   npm run dev
   ```

in your browser to access the Draftly frontend.

## Development

- `npm run dev` – Start the app with `ts-node` for quick iteration (HTTP API + frontend served from `public/`).

## Technical Stack

- **Node.js**: Runtime environment
- **TypeScript**: Programming language
- **IMAP**: Protocol for email retrieval
- **Nodemailer**: Library for sending emails
- **Groq API**: AI service for generating responses

## Security Considerations

- The application requires email credentials stored in environment variables
- It's recommended to use app-specific passwords rather than primary account passwords
- For production use, implement additional error handling and security measures
