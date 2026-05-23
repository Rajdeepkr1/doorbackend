



😈 RealtyDoor - Epic Breakdown
RealtyDoor - Epic Breakdown

By Krishnamurthy M Gokarnkar

Overview 
This document provides the complete epic and story breakdown for RealtyDoor, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

Requirements Inventory 
Functional Requirements 
FR1: Support 3-tier user hierarchy (Admin, Partner, User) with distinct permissions.
FR2: Partners can create property listings via a multi-step wizard. (Bulk CSV is Phase 2)
FR3: Admins review and approve/reject Partner property listings before they go public.
FR4: Implement unified property search (merging amenities and societyFeatures queries).
FR5: Generate and track leads when Users request property visits.
FR6: Support manual dispatch of leads via the Admin panel.
FR7: Mask User phone numbers via the Anti-Leakage Engine (OTP required for Partners to reveal).
FR8: Send automated WhatsApp triggers at T+24h (feedback) and T+7d (Still Deciding).
FR9: Support lead drop workflows (Partners request drop, Admins approve).
FR10: Generate PDF invoices automatically when a deal is closed (Admins manually set the commission rate per deal) - [Phase 2].
FR11: Allow Users and Partners to self-declare NRI status.
FR12: Track all listing modifications in an immutable PropertyEditLog for transparency.
FR13: Partners must upload KYC identity documents to unlock CRM access.
FR14: Admin must have analytics dashboards showing revenue, partner performance, and lead funnel metrics.
FR15: Admins can define locality benchmark data that shows as deal-value badges on property pages.
FR16: Support B2B Premium Partner tier (₹4,999/month) with hidden inventory access and escrow + loan tracking - [Phase 2 for Premium/B2B].

NonFunctional Requirements 
NFR1: Render public properties via ISR and search pages via SSR for optimal SEO.
NFR2: Ensure sub-100ms faceted search latency.
NFR3: Ensure full DPDPA 2023 compliance (data deletion pipelines, encrypted resting data).
NFR4: KYC documents (Aadhar/PAN) must be stored in private buckets and served strictly via 1-hour pre-signed URLs.

Additional Requirements 
Initial setup MUST use the official Next.js App Router CLI (npx create-next-app@latest ...).

UI must be built using Vanilla CSS Modules + Radix UI primitives (unstyled). Shadcn/UI components may only be used if the Tailwind dependency is removed and components are re-styled with Vanilla CSS Modules. Tailwind classes are strictly forbidden.

Authentication and Role Management (Admin/Partner/User) must be implemented using Clerk (publicMetadata).

Edge middleware must protect routes based on Clerk Roles without hitting the database.

Database must be MongoDB managed via Prisma ORM.

File storage for KYC and Properties must use Cloudflare R2 (or AWS S3).

State management for complex UIs (Wizard, CRM) must use React Query (Server state) and Zustand (Client state).

Background jobs (7-day follow-ups) must use Inngest.

WhatsApp automation must use WATI for OTP verification, follow-ups, and notifications.

Invoices must be generated server-side using @react-pdf/renderer.

UX Design Requirements 
None found in a dedicated UX document (UI requirements are implied within FRs and Architecture).

FR Coverage Map 
FR1: Epic 1 - 3-tier user hierarchy (Admin, Partner, User)
FR2: Epic 2 - Partners can create property listings
FR3: Epic 2 - Admins review and approve/reject listings
FR4: Epic 3 - Unified property search
FR5: Epic 4 - Generate leads when Users request property visits
FR6: Epic 5 - Support manual dispatch of leads via Admin panel
FR7: Epic 4 - Mask User phone numbers (Anti-Leakage Engine)
FR8: Epic 6 - Automated WhatsApp follow-ups (T+24h feedback, T+7d Still Deciding)
FR9: Epic 5 - Lead drop workflow (Partners request drop, Admins approve)
FR10: Epic 6 - PDF invoice generation on deal closure
FR11: Epic 1 - Self-declare NRI status
FR12: Epic 2 - Immutable PropertyEditLog for fraud auditing
FR13: Epic 2 - KYC Verification
FR14: Epic 7 - Admin Analytics Dashboards
FR15: Epic 11 - Locality Insights
FR16: Epic 8 - B2B & Premium Partner tier (subscriptions, escrow, loan)

Epic List 
Epic 1: Platform Foundation & Identity 
Goal: Establish the core Next.js application, connect the database, and allow Users, Partners, and Admins to securely log in with their correct permissions.
FRs covered: FR1, FR11
Stories: 1.1 (Initialize Next.js Foundation), 1.2 (Integrate Clerk Authentication), 1.3 (Role-Based Edge Middleware), 1.4 (User Profiles & NRI Status), 1.5 (Phone Verification - Lazy Verification)

Epic 2: Partner Property Management 
Goal: Partners can securely upload property listings (with images via Cloudflare R2), and Admins can review, approve, or reject them.
FRs covered: FR2, FR3, FR12, FR13
Stories: 2.1 (Partner KYC), 2.2 (Multi-Step Listing Wizard), 2.3 (Cloudflare R2 Image Uploads), 2.4 (Admin Property Approval), 2.5 (Immutable Edit Logs), 2.6 (Microsite Builder)

Epic 3: Public Property Discovery 
Goal: Buyers can browse public property pages (fast SEO rendering), use the unified faceted search, and compare properties side-by-side.
FRs covered: FR4
Stories: 3.1 (ISR Property Pages), 3.2 (Faceted Search), 3.3 (SSR Results), 3.4 (Property Comparison)

Epic 4: Lead Generation & Anti-Leakage 
Goal: Buyers can request property visits securely, generating leads while masking their phone number behind a WhatsApp OTP.
FRs covered: FR5, FR7
Stories: 4.1 (Visit Request Form), 4.2 (Lead Created & Admin Notified), 4.3 (WhatsApp OTP Generation via WATI), 4.4 (OTP Verification & Phone Reveal), 4.5 (Staff Coordination - Visit Scheduling)

Epic 5: Admin Dispatch & Partner CRM 
Goal: Admins can manually dispatch verified leads to specific Partners, and Partners can manage these leads, request drops, and track commissions.
FRs covered: FR6, FR9
Stories: 5.1 (Admin Lead Dispatch), 5.2 (Partner CRM Lead View), 5.3 (Lead Drop Workflow), 5.4 (Partner Commission Tracker)

Epic 6: Automated Follow-ups & Deal Closure 
Goal: The system automatically engages leads who are "Still Deciding" via WhatsApp, generates PDF invoices when a deal is closed, and runs onboarding drip emails for new Partners.
FRs covered: FR8, FR10
Stories: 6.1 (7-Day STILL_DECIDING Follow-up), 6.2 (Deal Closure & Commission Input - Phase 2), 6.3 (PDF Invoice Generation - Phase 2), 6.4 (Partner Onboarding Drip Sequence)

Epic 7: Admin Analytics & Dashboards 
Goal: Provide Admins with revenue, lead funnel, and partner performance analytics.
FRs covered: FR14, FR16
Stories: 7.1 (Global Revenue Dashboard), 7.2 (Partner Performance Analytics)

Epic 9: Value-Added User Services 
Goal: Allow users to purchase home maintenance and legal services directly through the platform, tracked via a ticketing system.
FRs covered: FR16
Stories: 9.1 (Service Catalog & Purchasing), 9.2 (User Support Ticketing System), 9.3 (Ticket Resolution Flow)

Epic 10: Financial Integrations 
Goal: Support Razorpay Escrow for token advances, home loan application tracking, and document vault for loan processing.
FRs covered: FR16
Stories: 10.1 (Token Advance Escrow), 10.2 (Home Loan Application Form), 10.3 (Document Vault Flow)

Epic 11: Locality Insights Engine 
Goal: Admins define benchmark price data per locality; deal-value badges display on property pages.
FRs covered: FR15
Stories: 11.1 (Admin Benchmark Data Management), 11.2 (Dynamic Deal Badges)

Epic 1: Platform Foundation & Identity 
Establish the core Next.js application, connect the database, and allow Users, Partners, and Admins to securely log in with their correct permissions.

Story 1.1: Initialize Next.js Foundation & Database 
As a developer,
I want to initialize the Next.js App Router codebase with Vanilla CSS and Prisma,
So that I have a clean, standard foundation for development.

Acceptance Criteria:

Given the project directory is empty
When the Next.js initialization command is run
Then a Next.js App Router application is created using TypeScript and Turbopack
And Prisma is initialized with a MongoDB connection string, and the database connects successfully.
And the initial Prisma schema is defined and migrated to the database.

Story 1.2: Integrate Clerk Authentication & Webhooks 
As a User,
I want to securely log in using Clerk (Google/Email/Phone),
So that my identity is protected and verified.

Acceptance Criteria:

Given the Next.js app is running
When a user clicks "Sign In"
Then they are presented with the secure Clerk authentication modal
And upon successful registration, a Clerk Webhook fires to automatically create a corresponding User record in the MongoDB database.

Story 1.3: Role-Based Edge Middleware 
As an Admin,
I want edge middleware to block unauthorized access to the (admin) and (partner) route groups,
So that sensitive CRM and approval tools are secure.

Acceptance Criteria:

Given a user is logged in
When they try to access /admin/* but their Clerk publicMetadata.role is 'USER'
Then the Clerk edge middleware immediately redirects them to the homepage
And when their role is 'ADMIN', they are granted access without a database lookup.

Story 1.4: User Profiles & NRI Status Self-Declaration 
As a User,
I want to update my profile to self-declare my NRI (Non-Resident Indian) status,
So that I receive appropriate property recommendations and tax guidance.

Acceptance Criteria:

Given a user is logged in and views their profile settings
When they toggle their NRI status checkbox and save
Then the status is updated in the MongoDB database via a Next.js Server Action
And the UI updates optimistically to reflect the saved state.

Story 1.5: Phone Verification (Lazy Verification) 
As a User,
I want to verify my phone number only when I perform an action that requires it (inquiry, save property, chat, book visit, purchase service),
So that I'm not forced to verify at signup and can explore the platform freely first.

Acceptance Criteria:

Given a user is logged in via Google (Clerk) without phone verification
When they try an action requiring phone (e.g., submit inquiry)
Then they are redirected to /verify-phone
And they enter their phone number
And WATI WhatsApp API sends a 4-digit OTP
And upon entering correct OTP, phoneVerified is set to true
And the action proceeds without interruption.

Epic 2: Partner Property Management 
Partners can securely upload property listings (with images via Cloudflare R2), and Admins can review, approve, or reject them.

Story Execution Order Dependency: Story 2.1 (KYC) MUST be implemented before Story 2.2 (Listing Wizard) because the Partner CRM middleware gate (kycStatus: VERIFIED) must exist before any listing API can be tested end-to-end. The wizard cannot be fully verified without an approved KYC account.

Story 2.1: Partner KYC Document Upload & Approval 
As a Partner,
I want to upload my KYC documents (Aadhar/PAN), and as an Admin I want to approve them,
So that only verified partners can access the CRM.

Acceptance Criteria:

Given a Partner accesses their dashboard
When they submit their KYC documents
Then the documents are uploaded to Cloudflare R2 using pre-signed URLs
And the Admin can review and set their KYC status to APPROVED
And CRM access is conditionally unlocked based on this status.
And the Prisma schema for UserDocument is migrated to the database.
And if upload fails, a toast notification alerts the Partner to try again.

Story 2.2: Multi-Step Property Listing Wizard 
As a Partner,
I want to use a multi-step wizard to enter property details (amenities, location, price),
So that the process is organized and easy to complete without losing data.

Acceptance Criteria:

Given a Partner is logged in and clicks "Add Property"
When they navigate through the wizard steps
Then Zustand stores their draft state locally so they don't lose progress if they go back a step
And the property is only saved to the MongoDB database via a Server Action when they submit the final step.
And the Prisma schema for Property is migrated to the database.
And if mandatory fields are missing on submit, the UI prevents submission and highlights the missing fields with error states.

Story 2.3: Cloudflare R2 Image Uploads 
As a Partner,
I want to upload multiple property images securely,
So that buyers can visually inspect the listing before requesting a visit.

Acceptance Criteria:

Given the Partner is on the "Images" step of the wizard
When they select image files to upload
Then the client requests a secure pre-signed URL from a Next.js Route Handler
And uploads the file directly to the Cloudflare R2 bucket
And the resulting R2 URLs are saved to the Property document.
And if the file size exceeds limits or format is invalid, a client-side error rejects the upload immediately.

Story 2.4: Admin Property Approval Workflow 
As an Admin,
I want to review newly submitted properties and mark them as APPROVED or REJECTED,
So that no low-quality or fraudulent listings reach the public search.

Acceptance Criteria:

Given an Admin is on the /admin/properties dashboard
When they view properties with status="PENDING"
Then they can click "Approve" or "Reject"
And a Server Action securely updates the status in the database, making APPROVED properties visible to the public.

Story 2.5: Immutable Property Edit Logs 
As an Admin,
I want all edits made to a property after it is approved to be logged in an immutable ledger,
So that I can audit changes for fraud or bait-and-switch tactics.

Acceptance Criteria:

Given an approved Property exists
When a Partner updates its details (e.g., changes the price)
Then a new PropertyEditLog document is automatically created in MongoDB
And the log captures the propertyId, the oldState, the newState, and the partnerId who made the change.
And the Prisma schema for PropertyEditLog is migrated to the database.

Story 2.6: Microsite Builder (Single Template) 
As a Partner (Builder),
I want to use a step-by-step microsite builder wizard to create project listings with multiple units,
So that I can showcase large under-construction projects professionally.

Acceptance Criteria:

Given a Partner clicks "Add New Listing" and chooses "Microsite Builder"
When they navigate through the wizard steps (Project Details, Photos, CMS Fields, Unit Configurations)
Then Zustand stores their draft state locally
And the microsite is only saved to MongoDB via a Server Action when they submit the final step
And the project is created with isMicrosite: true and status: PENDING_APPROVAL
And Admin reviews and approves/rejects the microsite before it goes live at /properties/[project-slug]

Epic 3: Public Property Discovery 
Buyers can browse public property pages (fast SEO rendering) and use the unified faceted search to find specific homes.

Story 3.1: Static Property Detail Pages (ISR) 
As a Buyer,
I want to view fast-loading, SEO-optimized property detail pages,
So that I can easily browse listings and share links without delay.

Acceptance Criteria:

Given an APPROVED property exists in the database
When a user navigates to /properties/[id]
Then Next.js renders the page statically using ISR (Incremental Static Regeneration)
And the page loads instantly with proper SEO meta tags.

Story 3.2: Unified Property Faceted Search 
As a Buyer,
I want to search for properties using a combination of amenities (e.g., Gym) and society features (e.g., Gated),
So that I can find exactly the type of home I need.

Acceptance Criteria:

Given a user is on the Search page
When they select filters that exist in both the amenities and societyFeatures arrays
Then the Server Action queries MongoDB Atlas Search using a unified OR logic gate
And returns the correct properties with sub-100ms latency.

Story 3.3: Server-Side Search Results Page 
As a Buyer,
I want to see my search results and pagination update when I change filters,
So that I can refine my search easily.

Acceptance Criteria:

Given the user has entered search parameters
When the results are displayed
Then the Next.js page uses SSR (Server-Side Rendering) to fetch and display the results to ensure real-time accuracy and SEO crawlability
And URL search params (e.g., ?minPrice=50000) are used to maintain the state so the links are shareable.

Story 3.4: Property Comparison Tool 
As a Buyer,
I want to compare up to 3 properties side-by-side in a structured table,
So that I can quickly evaluate differences in price, area, and amenities before making a decision.

Acceptance Criteria:

Given a Buyer is viewing search results
When they tick the "Compare" checkbox on up to 3 property cards
Then a sticky comparison bar appears at the bottom of the page showing "Comparing X/3 properties"
And clicking "View Comparison" navigates to /compare?ids=abc,def,ghi and renders a side-by-side table
And the selected property IDs are persisted in localStorage so the selection survives page refreshes.

Epic 4: Lead Generation & Anti-Leakage 
Buyers can request property visits securely, generating leads while masking their phone number behind an SMS OTP.

Story 4.1: Property Visit Request Form 
As a Buyer,
I want to request a site visit directly from a property page,
So that I can schedule a viewing and get more information.

Acceptance Criteria:

Given a user is viewing an approved property
When they submit the "Request Visit" form with their contact details
Then input is validated (e.g., valid Indian phone number)
And a Lead document is created in MongoDB with status="UNASSIGNED" (matching the canonical LeadStatus enum in the PRD schema).
And the Prisma schema for Lead is formally mapped and migrated to the database.

Story 4.2: Anti-Leakage Phone Number Masking 
As an Admin,
I want buyer phone numbers to be masked (e.g., +91 98XXXXXX89) in the Partner CRM by default,
So that Partners cannot bypass the platform and steal the lead.

Acceptance Criteria:

Given a Partner is viewing their leads in the CRM
When the Next.js Server Component fetches the data
Then the server automatically masks the phone field before sending the JSON payload to the client
And only Admin roles receive the unmasked payload by default.

Story 4.3: WhatsApp OTP Verification (WATI) 
As a Partner,
I want to reveal a buyer's phone number by submitting an OTP that was sent to the buyer via WhatsApp,
So that I can contact them securely while proving the buyer is genuinely engaged.

Acceptance Criteria:

Given a Partner clicks "Reveal Number" on a masked lead
When they trigger the action
Then the WATI API sends a 6-digit WhatsApp OTP to the buyer's actual phone number
And when the Partner enters the correct OTP in the modal, a Server Action returns the unmasked phone number and securely logs the reveal event in the database.
And if the WATI API is down or the OTP is invalid, a clear error boundary or toast notification alerts the Partner without crashing the application.

Story 4.5: Staff Coordination (Visit Scheduling) 
As an Admin,
I want to coordinate visit scheduling by calling both the Buyer and Partner after the Partner requests a visit,
So that visits are properly scheduled while keeping the Buyer's phone number masked from the Partner.

Acceptance Criteria:

Given a Partner requests a visit via the platform and confirms the date/time picker
When POST /api/leads/[id]/schedule-visit is triggered
Then a random 4-digit OTP is generated and saved to lead.siteVisitOTP
And automated WhatsApp (WATI) sends OTP to Buyer: "Visit OTP: {otp}. Share with your agent."
And the Admin sees the visit request in the dashboard
And the Admin calls the Buyer to confirm visit details and answer questions
And the Admin calls the Partner to coordinate timing and provide context
And the Partner never sees the Buyer's phone number at any point
And at the site visit, the Buyer verbally shares the OTP to the Partner
And when the Partner enters the OTP, isOtpVerified is set to true and the phone number is revealed for direct communication.

Epic 5: Admin Dispatch & Partner CRM 
Admins can manually dispatch verified leads to specific Partners, and Partners can manage these leads or request to drop them.

Story 5.1: Admin Manual Lead Dispatch 
As an Admin,
I want to assign a NEW lead to a specific Partner,
So that the Partner can begin working on closing the deal.

Acceptance Criteria:

Given an Admin is viewing the /admin/leads dashboard
When they select a NEW lead and choose a Partner from the assignment dropdown
Then the lead's partnerId is updated in MongoDB
And the lead's status is automatically updated to ASSIGNED (matching the canonical LeadStatus enum).

Story 5.2: Partner CRM Pipeline Board 
As a Partner,
I want to see my assigned leads organized by their status (e.g., Dispatched, In Progress, Still Deciding),
So that I can easily track and manage my sales pipeline.

Acceptance Criteria:

Given a Partner is viewing /partner/pipeline
When the page loads
Then they see their assigned leads organized into columns based on status (using canonical LeadStatus values: UNASSIGNED, ASSIGNED, SITE_VISIT_SCHEDULED, SITE_VISIT_DONE, CLOSED, DROPPED)
And they can update the status (e.g., from ASSIGNED to SITE_VISIT_SCHEDULED) using a Server Action.

Story 5.3: Lead Drop Request Workflow 
As a Partner,
I want to request to drop a dead lead,
So that it is removed from my active pipeline.

Acceptance Criteria:

Given a Partner is viewing an active lead
When they click "Drop Lead" and submit a reason
Then the lead's dropRequested flag is set to rue and status changes to DROPPED pending Admin approval
And the lead remains visible in their pipeline but is locked for further edits until an Admin reviews the request.

Story 5.4: Admin Drop Approval Workflow 
As an Admin,
I want to review and approve or reject lead drop requests from Partners,
So that I can prevent Partners from prematurely abandoning leads or attempting to bypass the system.

Acceptance Criteria:

Given an Admin is reviewing a lead where dropRequested: true
When they click "Approve Drop"
Then the lead status changes to DROPPED
And if they click "Reject Drop", the lead status reverts to IN_PROGRESS and the Partner must continue working it.

Epic 6: Automated Follow-ups & Deal Closure 
The system automatically engages leads who are "Still Deciding" via WhatsApp, and automatically generates PDF invoices when a deal is closed.

Story 6.1: Automated WhatsApp Follow-up Jobs (Inngest) 
As an Admin,
I want leads in the STILL_DECIDING state to automatically receive a WhatsApp message 7 days after their property visit,
So that they are continuously engaged without manual effort from my team.

Acceptance Criteria:

Given a lead has been in the STILL_DECIDING state for exactly 7 days
When the Inngest background job runs
Then it securely fetches the unmasked phone number
And triggers a WATI API call to send a templated WhatsApp message
And logs the communication in the lead's history.

Story 6.2: Deal Closure & Commission Input [Phase 2] 
As an Admin,
I want to manually input the final commission percentage when marking a deal as CLOSED,
So that the system can accurately calculate the revenue generated.

Acceptance Criteria:

Given an Admin is managing a lead in the CRM
When they select "Close Deal"
Then a modal prompts them to input the final negotiated commission percentage
And the Server Action updates the lead status to CLOSED and saves the commission rate.

Story 6.3: Server-Side PDF Invoice Generation [Phase 2] 
As an Admin,
I want a PDF invoice to be automatically generated when a deal is closed,
So that I can immediately send it to the developer or partner for payment.

Acceptance Criteria:

Given a deal has just been marked as CLOSED
When the Server Action completes
Then @react-pdf/renderer generates a PDF on the server containing the property details, commission rate, and total amount
And the PDF is saved to Cloudflare R2 and linked to the lead document for download.

Story 6.4: Partner Onboarding Drip Email Sequence 
As an Admin,
I want automated onboarding emails to be sent to new Partners based on their actions (KYC submitted, first listing added),
So that Partners are guided to full activation without manual follow-up from my team.

Acceptance Criteria:

Given a new Partner registers
When 24 hours pass without KYC being submitted
Then Inngest fires a "Reminder: Complete your verification" email via Resend
And after KYC approval, Inngest fires a "First Listing Prompt" email at T+1 day
And if no listing is added after 3 days, Inngest fires a "nudge" email
And if no listing is added after 7 days, Inngest fires a "tips" email.

Epic 7: Admin Analytics & Dashboards 
Provide Admins with a bird's-eye view of platform health, revenue generation, and Partner performance.

Story 7.1: Global Revenue Dashboard 
As an Admin,
I want to view total commissions earned, split by property types and dates,
So that I can monitor the financial health of the platform.

Acceptance Criteria:

Given the Admin is on /admin/dashboard
When the page loads
Then a Server Component fetches all CLOSED leads and aggregates their commission values
And displays them in a time-series chart (e.g., Recharts) and summary cards.

Story 7.2: Partner Performance Analytics 
As an Admin,
I want to see metrics for individual Partners (e.g., Conversion Rate, Average Time to Close),
So that I can identify top performers and cull inactive agents.

Acceptance Criteria:

Given the Admin views a specific Partner's profile
When the analytics tab is selected
Then the system calculates and displays the ratio of DISPATCHED vs CLOSED leads
And shows the average time spent in the SITE_VISIT_DONE phase.

Epic 9: Value-Added User Services 
Allow users to purchase home maintenance and legal services directly through the platform, tracked via a ticketing system.

Story 9.1: Service Catalog & Purchasing 
As a User,
I want to browse and purchase services like Home Maintenance or Legal Document Registration,
So that I can handle all real estate needs in one place.

Acceptance Criteria:

Given a User is logged in
When they select a service package and complete payment
Then a new ServiceOrder document is created in MongoDB
And an Admin is immediately notified to fulfill the service.

Story 9.2: User Support Ticketing System 
As a User,
I want to open support tickets for issues or active services,
So that I can track resolution progress.

Acceptance Criteria:

Given a User views their active Service Order
When they submit a new ticket
Then a Ticket document is created linked to the order
And Admins can reply and update the status from OPEN to RESOLVED.

Story 9.3: Ticket Resolution Flow 
As an Admin,
I want to dispatch vendors to service tickets and track verification of work completion,
So that services are delivered and users can verify work quality.

Acceptance Criteria:

Given a User purchases a service and a Ticket is created automatically
When the Admin reviews the ticket in /admin/tickets
Then the Admin selects a vendor from the vendor list and clicks "Dispatch Vendor"
And a notification is sent to the vendor with ticket details
And when the Vendor performs the work, they upload photos/notes via POST /api/tickets/[id]/upload-evidence
And the User receives a notification to verify the work
And the User clicks "Verify" or "Reject" to update the ticket status
And if VERIFIED, the ticket is closed and the service is marked complete
And if REJECTED, the Vendor must redo the work.

Epic 10: Financial Integrations 
Support Razorpay Escrow for token advance payments and provide an interface for tracking Home Loan applications.

Story 10.1: Token Advance Escrow Integration 
As a Buyer,
I want to pay a property token advance securely into an Escrow account,
So that my money is safe until the deal is finalized.

Acceptance Criteria:

Given a lead reaches the DEAL_AGREED stage
When the buyer clicks "Pay Token"
Then the system initiates a Razorpay Escrow transaction
And upon successful payment, the Lead status updates to TOKEN_PAID and funds are held until Admin release
And the webhook handler enforces idempotency by checking the razorpay_payment_id to prevent double-crediting.

Story 10.2: Home Loan Application Form 
As a Buyer,
I want to submit my basic financial details to apply for a home loan,
So that RealtyDoor can assist me in getting financing.

Acceptance Criteria:

Given a User is logged in
When they submit the Loan Application form
Then a LoanApplication document is created in MongoDB with status PENDING_REVIEW
And the Admin dashboard reflects the new application for offline processing.

Story 10.3: Document Vault Flow 
As a User,
I want to upload documents for loan processing and track their approval status,
So that I can manage my loan application requirements through the platform.

Acceptance Criteria:

Given a User is logged in
When they upload documents via POST /api/documents/upload
Then a Document record is created with { userId, type, status: PENDING, fileUrl }
And the Admin reviews the documents and clicks "Approve" or "Reject"
And PATCH /api/documents/[id] updates the status to APPROVED or REJECTED
And Partners (lenders/builders) access the vault via /partner/document-vault to view approved documents
And Users track loan application status via /user/document-vault

Epic 11: Locality Insights Engine 
Admins can manage and display benchmark data for specific localities, which appear as "Deal Badges" on properties.

Story 11.1: Admin Benchmark Data Management 
As an Admin,
I want to define benchmark data (e.g., average price per sqft) for specific cities and localities,
So that buyers can compare listing prices against market averages.

Acceptance Criteria:

Given an Admin is on the /admin/insights page
When they create or update a LocalityInsight record for "Bandra West, Mumbai"
Then the benchmark data is securely saved to MongoDB.

Story 11.2: Dynamic "Deal Badges" on Property Pages 
As a Buyer,
I want to see an automated badge (e.g., "Great Deal!" or "Fair Price") on property pages,
So that I know if the listing is priced well compared to the market.

Acceptance Criteria:

Given a User views a property in "Bandra West, Mumbai"
When the page renders
Then the Next.js component compares the listing's price/sqft against the LocalityInsight benchmark
And displays a UI badge indicating value (e.g., Green for < market avg)
And if an Admin updates the benchmark, an On-Demand ISR Revalidation is triggered for all properties in that locality so the static pages update instantly.

