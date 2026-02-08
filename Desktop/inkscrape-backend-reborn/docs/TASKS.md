\# TASKS (Hackathon MVP)



Milestone 1: Backend skeleton

\- REST API server with health endpoint

\- MongoDB connection

\- Auth0 JWT verification middleware

\- Role model in DB (artist/company)



Milestone 2: Artist flows

\- Upload artwork (single + batch)

\- Hash SHA-256

\- Create tag UUID

\- Save permissions + versioning

\- Artist tag list + edit + revoke



Milestone 3: Company flows

\- Upload zip + individual files

\- Hash each file

\- Match exact hashes

\- Generate compliance report

\- Conditional => Gemini agreement + accept log

\- Compliance events visible to artists



Milestone 4: Perceptual hash similarity flags (pHash)

\- Add perceptual hash (pHash) computation for artwork uploads (single + batch) alongside existing SHA-256 hashing

\- Store pHash on artwork records as an optional, non-breaking schema update (with prefix + version for future changes)

\- During dataset scanning, after SHA-256 exact match checks, compute pHash for image files only

\- Compare dataset file pHash against stored artwork pHash values and calculate similarity percentage

\- Apply similarity thresholds:

\- ≥ 80% similarity → work\_at\_risk

\- 65%–79% similarity → may\_be\_at\_risk

\- < 65% similarity → no similarity flag

\- Ensure exact hash matches always take precedence over similarity results (similarity is informational only)

\- Group similarity findings separately from exact matches in scan results

\- Persist similarity findings into compliance\_events so artists can view them in compliance logs

\- Maintain existing constraints: no ML models, no heavy CV pipelines, no permanent file storage, immediate temp file deletion

\- Do not break or modify existing artist or company flows; all existing tests and curl flows must continue to pass



