Product Requirements Document (PRD)

Product Name: Inkscape

&nbsp;Product Type: Security Tag Implementer + AI Dataset Compliance Checker

&nbsp;Scope: Hackathon MVP

&nbsp;Primary Users: Artists / Creators, AI Companies / Businesses



Tech Stack (Fixed for MVP)

Frontend

React





Tailwind CSS





Hosted on Lovable





Backend

Hosted on Vultr





REST API for file parsing, hashing, scanning, tag lookup





Authentication

Auth0





Google OAuth





Role-based access: artist, company





Database

MongoDB





AI Services

Google Gemini API (agreement text generation only)







1\. Objective

Build a two-sided web application that enables:

Artists to upload work, generate security tags, and define AI usage permissions





AI companies to upload datasets, scan for tagged works, and receive compliance reports





Conditional use cases to trigger LLM-generated agreement summaries





Transparent visibility of compliance activity for artists





The system supports ethical AI data sourcing without blocking innovation or modifying training data.



2\. Assumptions (Explicit for Demo)

All users act in good faith





Agreements are informational and illustrative





Exact-match detection only (hash-based)





No legal enforcement; only acceptance logs





Uploaded files are processed temporarily (hashing only)







3\. Explicit Non-Goals

The system will will not:

Prevent scraping or copying





Modify files or embed watermarks





Perform similarity search or computer vision





Train or run ML models





Handle payments or royalties





Act as DRM or access control







4\. Core Definitions

4.1 Security Tag (MVP Definition)

A security tag is:

A backend-generated UUID





Stored in MongoDB





Associated with an artwork file hash (SHA-256)





Used for permission lookup during compliance checks





Constraints

Registry-based only





No file embedding or watermarking







4.2 Artwork Identification

SHA-256 hash computed on upload





Only hashes and metadata stored long-term





Raw files discarded after processing







4.3 Dataset Scanning

“Scanning a dataset” means:

Hashing each uploaded file





Comparing hashes against stored artwork hashes





Reporting exact matches only





Out of Scope

Fuzzy matching





Partial similarity





Visual inference







4.4 LLM Usage (Gemini)

Used only for agreement generation





One-shot prompt → response





No memory or agent loops







5\. Authentication \& Roles

5.1 Login

Auth0 Universal Login with Google OAuth





Role selected once at onboarding:





artist





company





5.2 Authorization

Backend enforces role-based access





Role stored in MongoDB user profile linked to Auth0 user\_id







6\. System Architecture

Frontend

Artist Dashboard





Company Dashboard





Accessibility controls:





Dark/light mode





Colorblind modes





Adjustable text size





Keyboard navigation





ARIA labels





Backend

REST API





File upload + hashing





Dataset scanning





MongoDB access





Gemini agreement generation







7\. Artist Dashboard

7.1 Upload \& Tag Creation

Flow:

Upload artwork





Backend hashes file





Security tag generated





Artist assigns permissions





Permissions:

AI training allowed: yes | no | conditional





Allowed use cases:





general\_training





fine\_tuning





style\_learning





commercial





research\_only





Attribution required: boolean





Notes (optional)







7.2 Tag Management

View all tags





Filter by permission state





Edit permissions (versioned)





Revoke tags (non-retroactive)







7.3 Compliance Visibility

Artists can see:

Company name





Declared use case





Scan timestamp





Outcome:





allowed





removed





agreement\_accepted





Agreement text (if applicable)







8\. Company Dashboard

8.1 Company Profile

Required before scanning:

Company name





Declared AI use case(s)





Use case description







8.2 Dataset Submission

Accepted:

Zip files





Individual files





Dataset manifest (CSV/JSON)





(MVP: zip + individual files only)



8.3 Compliance Analysis

Backend:

Hash dataset files





Match hashes to tagged artworks





Compare permissions vs declared use case





Output:

Compliance report:





Allowed





Conditional





Restricted







8.4 Resolution Options

For conditional/restricted items:

Remove files





Proceed with allowed subset





Generate agreement







9\. Agreement Generation (Gemini)

Purpose:

&nbsp;Generate plain-language agreement summaries aligning permissions and use cases.

Required Prompt Clause:

Generate an agreement that strictly respects the artist’s permissions and restrictions, aligns with the company’s declared AI use case, grants no additional rights, and uses neutral legal language for informational compliance purposes.

Stored:

agreement\_text





tag\_id





company\_id





acceptance flag





timestamp





Agreements are informational for demo.



10\. Accessibility Requirements

Dark / light mode





Colorblind-safe palettes:





Deuteranopia





Protanopia





Tritanopia





Adjustable font size





High-contrast mode





Keyboard navigation





ARIA labels







11\. Data Model (MongoDB)

Collections:

users





artworks





tags





permissions





companies





compliance\_events





agreements





(As previously defined.)



12\. Hard Technical Exclusions

Payments / royalties





Legal enforcement





Background jobs





Multi-org role hierarchies





Watermarking / CV pipelines





Similarity search





Permanent file storage







13\. MVP Success Criteria

Auth0 login works with role-based routing





Artist tagging + permission setting works





Company dataset scanning works





Agreement generation works via Gemini





Artists can view compliance logs





End-to-end demo completes smoothly







14\. Guiding Principle

When uncertain:

Choose the simplest implementation





Prefer explicit user input





Optimize for demo clarity, not production scale



