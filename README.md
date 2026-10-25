# Gossip Backend

A real-time chat application backend built with **Node.js**, **Express**, **Socket.io**, and **MongoDB**. Gossip supports one-on-one messaging, group chats, audio/video calls via WebRTC, AI-powered chatbot, image analysis, message translation, and conversation summarization.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schemas](#database-schemas)
- [REST API Endpoints](#rest-api-endpoints)
- [WebSocket Events](#websocket-events)
- [Authentication & Middleware](#authentication--middleware)
- [AI Integration](#ai-integration)
- [File Upload & Storage](#file-upload--storage)
- [Email Service](#email-service)
- [Session Management](#session-management)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

---

## Architecture Overview

```
Client (Web/Mobile App)
        │
        ├── HTTP REST ──> Express Server ──> MongoDB
        │
        └── WebSocket ──> Socket.io Server ──> In-Memory Session Store
                             │
                    ┌────────┴────────┐
                    │                  │
             AI Python Server    Firebase Storage
          (Chatbot, Translate,    (Images, Profile
           Summarize, Caption)      Pictures)
```

The server runs on a single Node.js process. An HTTP server created with the native `http` module wraps both the Express app and the Socket.io server, allowing them to share the same port. The Socket.io server handles real-time bidirectional events for messaging, calls, AI features, and user presence. REST APIs handle authentication, user profile operations, and fetching friend lists with chat history.

---

## Tech Stack

| Technology               | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| **Node.js**              | JavaScript runtime                                       |
| **Express 4**            | HTTP web framework                                       |
| **Socket.io 4**          | Real-time bidirectional event communication              |
| **MongoDB + Mongoose 8** | Database & ODM                                           |
| **JWT (jsonwebtoken)**   | Authentication tokens                                    |
| **bcryptjs**             | Password hashing                                         |
| **Firebase Storage**     | Profile picture & image message storage                  |
| **Sharp**                | Server-side image processing (resize, format conversion) |
| **Multer**               | Multipart file upload handling                           |
| **Nodemailer**           | Email OTP delivery                                       |
| **Axios**                | HTTP client for AI proxy server calls                    |
| **express-validator**    | Request payload validation                               |
| **nanoid**               | Short unique user identifiers (5-char UIDs)              |

---

## Project Structure

```
├── index.js                    # Entry point: Express + Socket.io server setup
├── database.js                 # MongoDB connection handler
├── package.json
├── .env.example                # Environment variable template
├── .gitignore
│
├── routes/
│   ├── auth.js                 # Auth REST routes
│   └── chat.js                 # Chat REST routes
│
├── controllers/
│   ├── auth.js                 # Auth business logic
│   └── chat.js                 # Chat business logic
│
├── schemas/
│   ├── user.js                 # User model with settings
│   ├── chat.js                 # One-on-one chat message model
│   ├── group.js                # Group metadata model
│   └── groupchat.js            # Group chat message model
│
├── middlewares/
│   └── authUser.js             # JWT verification middleware
│
├── sockets/
│   ├── user.js                 # User presence & friend request events
│   ├── chat.js                 # Message send/receive/seen events
│   ├── call.js                 # WebRTC video/audio call signaling
│   ├── ai_proxy.js             # AI chatbot, translation, summarization events
│   └── settings.js             # User settings update events
│
├── store/
│   └── sessionStore.js         # In-memory online user session store
│
├── utils/
│   └── imageUpload.js          # Cloudinary image upload utility (unused in active code)
│
├── assets/
│   └── profile/                # Local profile picture storage
│
└── tests/
    ├── firebaseTesting.js      # Firebase storage upload test
    └── cloudinaryTesting.js    # Cloudinary upload test
```

---

## Database Schemas

### User (`schemas/user.js`)

| Field                                  | Type                      | Description                                                        |
| -------------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| `Username`                             | String (required)         | Display name                                                       |
| `FirstName`                            | String                    | User's first name                                                  |
| `LastName`                             | String                    | User's last name                                                   |
| `Email`                                | String (required, unique) | Login email                                                        |
| `uid`                                  | String (required, unique) | 5-character short unique ID (nanoid)                               |
| `ProfilePicture`                       | String                    | Firebase Storage URL or empty string                               |
| `Password`                             | String (required)         | bcrypt hashed password                                             |
| `DOB`                                  | Date                      | Date of birth                                                      |
| `settings.translation.language`        | String                    | Preferred translation language (`"original"` by default)           |
| `settings.translation.alwaysTranslate` | Boolean                   | Auto-translate all incoming messages                               |
| `settings.summarization.format`        | String                    | Summarization format: `"paragraph"`, `"bullet"`, or `"structured"` |
| `timestamps`                           | Auto                      | `createdAt`, `updatedAt`                                           |

### Chat (`schemas/chat.js`) — One-on-One Messages

| Field            | Type                                    | Description                                                                |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `Sender_ID`      | String (ref: User)                      | Sender's 5-char UID                                                        |
| `Receiver_ID`    | String (ref: User)                      | Receiver's 5-char UID                                                      |
| `text`           | String (required)                       | Message content (text or Firebase URL for images)                          |
| `seen`           | Boolean                                 | `null` if not yet delivered, `false` if delivered not seen, `true` if seen |
| `type`           | String (required)                       | `"text"`, `"image"`, or `"friend"` (friend-connection marker)              |
| `translatedText` | Array of `{ language, translatedText }` | Cached translations for this message                                       |
| `timestamps`     | Auto                                    | `createdAt`, `updatedAt`                                                   |

**Note:** Friend relationships are stored as `Chat` documents with `type: "friend"` and `text: "friend"`. These records act as an edge/relationship between two users.

### Group (`schemas/group.js`)

| Field        | Type                   | Description               |
| ------------ | ---------------------- | ------------------------- |
| `AdminID`    | ObjectId (ref: User)   | Group creator/admin       |
| `Members`    | [ObjectId] (ref: User) | Array of member ObjectIds |
| `timestamps` | Auto                   | `createdAt`, `updatedAt`  |

### GroupChat (`schemas/groupchat.js`)

| Field        | Type                  | Description              |
| ------------ | --------------------- | ------------------------ |
| `GroupID`    | ObjectId (ref: Group) | Target group             |
| `SenderID`   | ObjectId (ref: User)  | Message sender           |
| `text`       | String (required)     | Message content          |
| `timestamps` | Auto                  | `createdAt`, `updatedAt` |

---

## REST API Endpoints

All auth endpoints are prefixed with `/api/auth/`. All chat endpoints are prefixed with `/api/chat/`.

### Auth Routes (`/api/auth/`)

| Method   | Endpoint          | Auth | Description                                                        |
| -------- | ----------------- | ---- | ------------------------------------------------------------------ |
| `GET`    | `/`               | No   | Health check — returns `"hello from auth"`                         |
| `POST`   | `/signup`         | No   | Register a new user (multipart form with optional `profile` image) |
| `POST`   | `/signin`         | No   | Login with email & password — returns JWT + user data              |
| `POST`   | `/getuser`        | Yes  | Fetch authenticated user's profile data                            |
| `PUT`    | `/`               | No   | Update user (not yet implemented)                                  |
| `DELETE` | `/`               | No   | Delete user (not yet implemented)                                  |
| `POST`   | `/send-email-otp` | No   | Send a 6-digit OTP to the provided email via Nodemailer            |
| `GET`    | `/profile/:name`  | No   | Serve profile picture (local file or Firebase proxy)               |

#### Signup Request (multipart/form-data)

| Field      | Type            | Description                                            |
| ---------- | --------------- | ------------------------------------------------------ |
| `username` | String          | Display name                                           |
| `email`    | String          | Valid email address                                    |
| `password` | String          | Minimum 8 characters                                   |
| `dob`      | String          | Date of birth (ISO format)                             |
| `fullname` | String          | JSON string: `{"firstname": "...", "lastname": "..."}` |
| `profile`  | File (optional) | Profile picture file                                   |

#### Signin Response

```json
{
  "authtoken": "jwt_token_here",
  "msg": "Login Successful",
  "profile": "url_or_empty",
  "username": "display_name",
  "fullname": { "firstname": "...", "lastname": "..." },
  "uid": "abc12",
  "dob": "2000-01-01T00:00:00.000Z",
  "settings": {
    "translation": { "language": "original", "alwaysTranslate": false },
    "summarization": { "format": "paragraph" }
  }
}
```

### Chat Routes (`/api/chat/`)

| Method | Endpoint      | Auth | Description                                    |
| ------ | ------------- | ---- | ---------------------------------------------- |
| `POST` | `/getFriends` | Yes  | Get friend list (online status) + chat history |

---

## WebSocket Events

Socket.io is initialized with `cors: {}` (all origins allowed). Upon connection, five handler modules are registered per socket:

| Module                | Events Registered                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sockets/user.js`     | `user:connection`, `user:finduser`, `user:sendchatrequest`, `user:requestanswer`, `disconnect`                                                                                                                            |
| `sockets/chat.js`     | `chat:sendmessage`, `chat:seenmessages`                                                                                                                                                                                   |
| `sockets/call.js`     | `call:videocalloutgoing`, `call:videocallanswer`, `call:videocallcanceled`, `call:audiocalloutgoing`, `call:audiocallanswer`, `call:audiocallcanceled`, `call:peer-nego-needed`, `call:peer-nego-done`, `call:sendtracks` |
| `sockets/ai_proxy.js` | `ai:chatbot:fromclient`, `ai:image-analyze`, `ai:translate:multiple-messages`, `ai:translate:single-message`, `ai:summarization`                                                                                          |
| `sockets/settings.js` | `settings:translate:languageChange`, `settings:translate:alwaysTranslateChange`, `settings:summarization:formatChange`                                                                                                    |

### User Events

| Event (Client → Server) | Payload                                  | Description                                                                                  |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `user:connection`       | `{ profile, uid, username, settings }`   | Registers user as online, joins room `uid`, notifies friends, marks pending messages as seen |
| `user:finduser`         | `uid`                                    | Search for online users by UID prefix (regex, case-insensitive)                              |
| `user:sendchatrequest`  | `(fromuid, touid)`                       | Send a friend request to an online user                                                      |
| `user:requestanswer`    | `{ tousername, fromuid, touid, answer }` | Accept or reject a received friend request                                                   |
| `disconnect`            | —                                        | Notifies friends of offline status, removes from session store                               |

| Event (Server → Client) | Payload                      | Description             |
| ----------------------- | ---------------------------- | ----------------------- |
| `friendonline`          | `{ uid }`                    | Friend came online      |
| `friendoffline`         | `{ uid }`                    | Friend went offline     |
| `requestfromuser`       | `{ uid, profile, username }` | Incoming friend request |
| `successmessage`        | `{ msg, user }`              | Friend request accepted |
| `errormessage`          | `string`                     | Friend request rejected |

### Chat Events

| Event (Client → Server) | Payload                             | Description                                                                                                     |
| ----------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `chat:sendmessage`      | `{ fromuid, touid, message, type }` | Send a text or image message. For images, `message.data` is a base64 buffer and `message.type` is the MIME type |
| `chat:seenmessages`     | `{ fromuid, touid }`                | Mark all messages from `fromuid` as seen                                                                        |

| Event (Server → Client) | Payload       | Description                       |
| ----------------------- | ------------- | --------------------------------- |
| `chat:receivemessage`   | Chat document | New message delivered to receiver |
| `seenmessages`          | `{ uid }`     | Messages marked as seen           |

### Call Events (WebRTC Signaling)

| Event (Client → Server)  | Payload                     | Description                    |
| ------------------------ | --------------------------- | ------------------------------ |
| `call:videocalloutgoing` | `{ fromuid, touid, offer }` | Initiate video call            |
| `call:videocallanswer`   | `{ touid, answer }`         | Answer video call              |
| `call:videocallcanceled` | `{ touid }`                 | Cancel video call              |
| `call:audiocalloutgoing` | `{ fromuid, touid, offer }` | Initiate audio call            |
| `call:audiocallanswer`   | `{ touid, answer }`         | Answer audio call              |
| `call:audiocallcanceled` | `{ touid }`                 | Cancel audio call              |
| `call:peer-nego-needed`  | `{ to, offer }`             | WebRTC renegotiation needed    |
| `call:peer-nego-done`    | `{ to, ans }`               | WebRTC renegotiation complete  |
| `call:sendtracks`        | `{ to }`                    | Request media tracks from peer |

### AI Events

| Event (Client → Server)          | Payload                    | Description                              |
| -------------------------------- | -------------------------- | ---------------------------------------- |
| `ai:chatbot:fromclient`          | `{ message, tone, uid }`   | Send message to AI chatbot               |
| `ai:image-analyze`               | `{ url }`                  | Request AI image captioning              |
| `ai:translate:multiple-messages` | `{ messages, to }`         | Translate multiple chat messages at once |
| `ai:translate:single-message`    | `{ id, text, to }`         | Translate a single message               |
| `ai:summarization`               | `{ conversation, format }` | Summarize a conversation                 |

| Event (Server → Client)           | Payload                  | Description             |
| --------------------------------- | ------------------------ | ----------------------- |
| `ai:translated:multiple-messages` | `{ language, messages }` | Bulk translation result |

### Settings Events

| Event (Client → Server)                    | Payload                          | Description                           |
| ------------------------------------------ | -------------------------------- | ------------------------------------- |
| `settings:translate:languageChange`        | `{ authtoken, language }`        | Update preferred translation language |
| `settings:translate:alwaysTranslateChange` | `{ authtoken, alwaysTranslate }` | Toggle auto-translation               |
| `settings:summarization:formatChange`      | `{ authtoken, format }`          | Change summarization format           |

Settings updates are persisted to MongoDB and the in-memory session store simultaneously.

---

## Authentication & Middleware

### JWT Authentication (`middlewares/authUser.js`)

The `authUser` middleware validates requests by:

1. Extracting the JWT from the `authtoken` header
2. Verifying the token with `JWT_SECRET`
3. Attaching `req.user` (containing `{ id }`) for downstream handlers

Tokens are generated at signup and signin with payload `{ user: { id: mongoose_id } }`.

### Input Validation

Signup and signin endpoints use `express-validator` to enforce:

- Username must exist (signup only)
- Email must be a valid email format
- Password must be at least 8 characters

---

## AI Integration

The server proxies AI requests to an external Python-based AI server via HTTP (Axios). The AI server URL is configured with the `AIServerURL` environment variable.

| Feature                      | AI Server Endpoint                         | Request                         |
| ---------------------------- | ------------------------------------------ | ------------------------------- |
| Chatbot                      | `POST /api/ai/chatbot`                     | `{ session_id, tone, message }` |
| Image Captioning             | `POST /api/ai/analyze-image`               | `{ url }`                       |
| Single Message Translation   | `POST /api/ai/translate/single-message`    | `{ text, to }`                  |
| Multiple Message Translation | `POST /api/ai/translate/multiple-messages` | `{ messages, to }`              |
| Conversation Summarization   | `POST /api/ai/summarize`                   | `{ conversation, method }`      |

When `alwaysTranslate` is enabled in user settings:

- Incoming messages from other users are automatically translated at send time
- When fetching chat history, undelivered translations are fetched in bulk and cached in the `translatedText` array on each Chat document

---

## File Upload & Storage

### Profile Pictures

1. User uploads a profile image via `POST /api/auth/signup` (multipart, field name: `profile`)
2. Multer saves the file to `assets/profile/`
3. Sharp processes the image:
   - Resizes to 400×400 (cover fit, no enlargement)
   - Converts to PNG format
4. Processed image is uploaded to **Firebase Storage** under `profilePicture/{email}.png`
5. The Firebase download URL is stored in the user document

### Profile Picture Serving (`GET /api/auth/profile/:name`)

1. First checks for a local file in `assets/profile/`
2. If not found locally, fetches the user's `ProfilePicture` URL from Firebase and streams the response

### Chat Image Messages

1. Client sends base64-encoded image data with MIME type via socket event `chat:sendmessage`
2. Server decodes the buffer and uploads to Firebase Storage under `images/{timestamp}.{ext}`
3. The Firebase download URL replaces the raw data and is stored as the message `text`

---

## Email Service

`POST /api/auth/send-email-otp` sends a 6-digit OTP via **Nodemailer** configured for Gmail:

- **Service:** Gmail SMTP
- **Credentials:** `Email` and `AppPassword` from environment variables
- The AppPassword is generated from Google Account → Security → 2-Step Verification → App Passwords
- The email includes both plain text and HTML content with a "Copy OTP" button

---

## Session Management

### In-Memory Session Store (`store/sessionStore.js`)

A custom `ServerUserStore` class extends a base `UserStore` abstract class. It uses a `Map` keyed by user UID to track online users:

- **`saveUser(uid, session)`** — Add/update user in session map
- **`getUser(uid)`** — Retrieve a single user's session
- **`findUser(uid, socketuid)`** — Regex search by UID prefix (excludes the requesting user)
- **`userDisconnected(uid)`** — Remove user from session map
- **`updateTranslationSettings(uid, translationObject)`** — Update translation preferences in memory
- **`updateSummarizationSettings(uid, summarizationObject)`** — Update summarization preferences in memory

This store enables fast online status checks and user lookups without querying MongoDB.

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable            | Description                               |
| ------------------- | ----------------------------------------- |
| `PORT`              | Server port (default: `5000`)             |
| `DATABASE`          | MongoDB connection string                 |
| `JWT_SECRET`        | Secret key for JWT signing                |
| `apiKey`            | Firebase API key                          |
| `appId`             | Firebase app ID                           |
| `authDomain`        | Firebase auth domain                      |
| `measurementId`     | Firebase measurement ID                   |
| `messagingSenderId` | Firebase messaging sender ID              |
| `projectId`         | Firebase project ID                       |
| `storageBucket`     | Firebase storage bucket                   |
| `AIServerURL`       | Base URL of the Python AI server          |
| `Email`             | Gmail address for sending OTPs            |
| `AppPassword`       | Gmail app password (requires 2FA enabled) |

---

## Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **MongoDB** instance (local or Atlas)
- **Firebase** project with Storage enabled
- **Python AI server** (for AI features)
- **Gmail account** with 2FA and an App Password (for email OTPs)

### Installation

```bash
# Clone the repository
git clone https://github.com/Yashwant937363/Gossip_Backend.git
cd Gossip_Backend

# Install dependencies
npm install

# Create .env file and fill in the required variables
cp .env.example .env
```

### Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will start on the configured PORT (default: `5000`).

---

## Deployment

The application can be deployed to any Node.js hosting platform (e.g., Railway, Render, DigitalOcean, or a VPS).

Key considerations:

1. **MongoDB** — Use MongoDB Atlas or a managed MongoDB instance
2. **Firebase Storage** — Configure CORS on the Firebase bucket for your client domain
3. **Socket.io** — If using a reverse proxy (Nginx), ensure WebSocket upgrade headers are forwarded
4. **AI Server** — Deploy the Python AI server separately and point `AIServerURL` to it
5. **Environment** — Set all environment variables on the hosting platform; keep `JWT_SECRET` strong and unique
6. **Session Store** — The in-memory store is lost on restart; consider scaling with sticky sessions or replacing with Redis for multi-instance deployments
7. **CORS** — The Socket.io CORS is currently wide open (`cors: {}`) — restrict it to your client origin in production

---

## Notes

- The `utils/imageUpload.js` and `tests/cloudinaryTesting.js` files contain Cloudinary upload code that is **not currently used** in the active application — Firebase Storage is the active file storage solution.
- Group chat and group management REST APIs are not yet exposed in routes; the schemas exist for future development.
- The friend relationship system uses Chat documents with `type: "friend"` as a lightweight edge store instead of a dedicated friendships collection.
- The `updateUser` and `deleteUser` controller functions are stubs awaiting implementation.
