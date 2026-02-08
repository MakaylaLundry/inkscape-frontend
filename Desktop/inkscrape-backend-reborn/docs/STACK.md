Your Backend Tech Stack (Hosted on Vultr)

Runtime \& Language



Node.js (v20+)



Runs your backend server



Chosen for fast iteration, strong ecosystem, and hackathon velocity



Web Framework



Express.js



Handles HTTP requests and routing



Lightweight and flexible



Works cleanly with Auth0 JWT verification and file uploads



Authentication \& Authorization



Auth0



Google OAuth for user login



Issues JWT access tokens



Auth0 JWT Verification Middleware



Backend verifies tokens on each request



Extracts auth0\_user\_id from token (sub)



Role-based access control



Roles stored in MongoDB (artist or company)



Express middleware gates routes by role



Database



MongoDB



Hosted on MongoDB Atlas



Accessed via Mongoose



Stored data



Users



Artworks (hash + metadata only)



Security tags



Permissions (versioned)



Companies



Compliance events



Agreements



File Processing



Multer (or similar)



Handles multipart uploads (artworks, datasets)



Node.js crypto



Computes SHA-256 hashes



Temporary filesystem usage



Files exist only during request processing



Deleted immediately after hashing



Dataset Handling



adm-zip or unzipper



Extract ZIP uploads for dataset scanning



fs / fs.promises



Traverse extracted files



Clean up temp directories



AI Integration



Google Gemini API



Generates agreement summaries



One-shot prompt → response



No agent loops or memory



Configuration \& Secrets



dotenv



Loads environment variables from .env



Environment variables



MongoDB URI



Auth0 domain + audience



Gemini API key



API Contract



OpenAPI 3.0 (openapi.yaml)



Defines all endpoints



Frontend-backend contract



Used as the single source of truth



Error Handling \& Logging



Centralized Express error handler



Console logging (sufficient for hackathon)



Structured JSON responses:



{ "ok": true, "data": {...} }

{ "ok": false, "error": {...} }



Hosting (Vultr)



Vultr Cloud Compute instance



Ubuntu



Node.js installed



Process manager (optional)



pm2 for keeping server alive



Reverse proxy (optional)



Nginx (nice-to-have, not required for demo)



One-Sentence Summary (use this everywhere)



“The backend is a Node.js + Express REST API, hosted on Vultr, using MongoDB for storage, Auth0 for authentication, and Google Gemini for agreement generation, with file hashing and exact-match dataset scanning.”



What you don’t have in your backend stack (intentionally)



No ML training or inference



No watermarking or computer vision



No background workers or queues



No payment systems



No DRM

