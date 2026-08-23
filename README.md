# SocietyHub — Residential Maintenance & Notice Board Platform

SocietyHub is a modern, full-stack web application designed to streamline the management of residential societies. It provides a dedicated portal for residents to raise and track maintenance complaints, and a powerful dashboard for society administrators to manage those complaints, track resolution times, and publish community notices.

## 🚀 Key Features

### For Residents
* **Dashboard:** Overview of your recent complaints and their statuses.
* **Raise Complaints:** Submit detailed maintenance requests (e.g., plumbing, electrical, cleaning) with multiple photo attachments.
* **Track Status:** Monitor the progress of your complaints from "Open" to "In Progress" to "Resolved".
* **Notice Board:** Stay up to date with society announcements and important notices.
* **Profile Management:** Update your personal details, change your password, and upload a profile picture.

### For Administrators
* **Advanced Dashboard:** Visual analytics (using Recharts) for total complaints, volume trends, status distributions, and category breakdowns.
* **Complaint Management:** Bulk status updates, priority assignment, and resolution tracking.
* **Internal Admin Notes:** Keep private, internal logs on complaints that are hidden from residents.
* **Overdue Escalation:** Automated background jobs that flag complaints not resolved within a specified SLA (e.g., 48 hours).
* **Notice Publishing:** Create, edit, and broadcast notices to all residents via the platform (and optionally via email).

---

## 💻 Tech Stack

### Frontend
* **React 19** with **Vite**
* **TypeScript**
* **Tailwind CSS** for responsive styling
* **shadcn/ui** (Radix UI) for accessible components
* **Framer Motion** for subtle animations
* **Recharts** for data visualization
* **React Router v7** for navigation

### Backend
* **Node.js** with **Express 5**
* **TypeScript** (executed via `tsx`)
* **Prisma ORM** for database management
* **PostgreSQL** as the relational database
* **JWT (JSON Web Tokens)** for stateless authentication
* **Cloudinary** for image upload/hosting
* **Nodemailer** for email notifications

---

## 🛠 Prerequisites

Before cloning and running this project, ensure you have the following installed on your system:
* **Node.js** (v20+ recommended)
* **npm** (v10+)
* **PostgreSQL** (either installed locally or running via Docker)
* **Cloudinary Account:** For image uploads (free tier works perfectly)
* **SMTP Credentials:** For sending emails (e.g., Gmail App Password or Resend)

---

## 🚀 Getting Started (Installation Guide)

Follow these steps to assemble and run the project on a new computer.

### 1. Clone the Repository
```bash
git clone <your-github-repo-url>
cd Society_Maintenance_Tracker
```

### 2. Set Up the Database
If you have Docker installed, the easiest way to spin up a PostgreSQL instance is:
```bash
docker run --name societyhub_db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=societyhub -p 5432:5432 -d postgres
```
*(If you have a local PostgreSQL installation, ensure a database named `societyhub` exists).*

### 3. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` directory (`backend/.env`) and populate it with your credentials:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/societyhub?schema=public"

# Authentication
JWT_SECRET="generate-a-strong-random-secret-key-here"

# Server Configuration
PORT=4000
CLIENT_URL="http://localhost:5173"
COMPLAINT_OVERDUE_HOURS=48

# Cloudinary (for avatar & complaint photos)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Email Configuration (Nodemailer/SMTP)
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME="your-email@gmail.com"
MAIL_PASSWORD="your-app-password"
MAIL_FROM="your-email@gmail.com"

# Admin Seed Data
ADMIN_SEED_EMAIL="admin@societyhub.com"
ADMIN_SEED_PASSWORD="admin123"
```

**Database Migration & Seeding:**
Sync the Prisma schema with your database and generate the Prisma Client:
```bash
npx prisma generate
npx prisma db push
```

*(Optional)* Seed the database with demo data (creates an admin and dummy residents/complaints):
```bash
npm run seed:demo
```
*Demo Credentials:*
* Admin: `admin@societyhub.com` / `admin123`
* Resident: `alice@example.com` / `resident123`

**Start the Backend Server:**
```bash
npm run dev
```
The server will start on `http://localhost:4000`.

### 4. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

**Environment Variables:**
Create a `.env` file in the `frontend` directory (`frontend/.env`):
```env
VITE_API_URL="http://localhost:4000"
```

**Start the Frontend Development Server:**
```bash
npm run dev
```
The application will launch on `http://localhost:5173`.

---

## 📁 Project Structure

```
Society_Maintenance_Tracker/
├── backend/
│   ├── prisma/             # Database schema (schema.prisma)
│   ├── src/
│   │   ├── config/         # DB connection & global config
│   │   ├── controllers/    # Request handlers (auth, complaints, etc.)
│   │   ├── jobs/           # Scheduled background tasks (cron)
│   │   ├── middleware/     # Auth & validation middlewares
│   │   ├── routes/         # Express API routes
│   │   ├── scripts/        # Database seeders
│   │   ├── utils/          # Cloudinary, Email, and helper utilities
│   │   └── index.ts        # Application entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI components (shadcn, charts, etc.)
    │   ├── contexts/       # React Context providers (Auth)
    │   ├── hooks/          # Custom React hooks
    │   ├── layouts/        # Application layout wrappers (Sidebar, Navbar)
    │   ├── lib/            # Utility functions (API client, date formatters)
    │   ├── pages/          # Full page views (Admin/Resident Dashboards)
    │   ├── App.tsx         # Routing configuration
    │   └── main.tsx        # React mounting point
    ├── vite.config.ts      # Vite configuration & proxy settings
    └── package.json
```

---

## 📝 License

This project is licensed under the MIT License.
