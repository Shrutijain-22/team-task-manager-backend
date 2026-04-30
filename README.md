# Team Task Manager - Backend

A RESTful API server for the Team Task Manager application. Built with Node.js, Express, and MongoDB, it provides secure authentication, project-level role-based access control, and full task management capabilities.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)

---

## Project Overview

This backend powers the Team Task Manager platform. It implements a project-centric security model where permissions are determined by project ownership rather than global user roles. Any authenticated user can create a project, and the project creator controls team membership and task assignment.

Key architectural decisions:
- JWT-based stateless authentication
- Project-level access control middleware (`checkProjectAdmin`, `checkProjectMember`)
- Task status updates restricted strictly to the assigned user

---

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| Runtime      | Node.js (ESM)           |
| Framework    | Express.js              |
| Database     | MongoDB (via Mongoose)  |
| Auth         | JSON Web Tokens (JWT)   |
| Password     | bcryptjs                |
| Dev Server   | Nodemon                 |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A MongoDB Atlas cluster (or local MongoDB instance)

### Installation

```bash
# Clone the repository
git clone <your-backend-repo-url>
cd team-task-manager-backend

# Install dependencies
npm install
```

### Running Locally

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The server will start on the port defined in your `.env` file (default: `5000`).

---

## Environment Variables

Create a `.env` file in the root of the backend directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

| Variable    | Description                                   |
|-------------|-----------------------------------------------|
| `PORT`      | Port the server listens on                    |
| `MONGO_URI` | MongoDB connection string (Atlas or local)    |
| `JWT_SECRET`| Secret key used to sign and verify JWT tokens |

---

## API Endpoints

All protected routes require the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint           | Access | Description         |
|--------|--------------------|--------|---------------------|
| POST   | `/api/auth/signup` | Public | Register a new user |
| POST   | `/api/auth/login`  | Public | Login and get token |

### Users

| Method | Endpoint     | Access    | Description       |
|--------|--------------|-----------|-------------------|
| GET    | `/api/users` | Protected | Get all users     |

### Projects

| Method | Endpoint                          | Access           | Description                        |
|--------|-----------------------------------|------------------|------------------------------------|
| GET    | `/api/projects`                   | Protected        | Get all projects for current user  |
| POST   | `/api/projects`                   | Protected        | Create a new project               |
| PUT    | `/api/projects/:id`               | Project Creator  | Update project details             |
| DELETE | `/api/projects/:id`               | Project Creator  | Delete a project                   |
| PUT    | `/api/projects/:id/add-member`    | Project Creator  | Add a user to the project team     |
| PUT    | `/api/projects/:id/remove-member` | Project Creator  | Remove a user from the project team|

### Tasks

| Method | Endpoint        | Access           | Description                              |
|--------|-----------------|------------------|------------------------------------------|
| GET    | `/api/tasks`    | Protected        | Get tasks (assigned to me or my projects)|
| POST   | `/api/tasks`    | Project Creator  | Create a task within an owned project    |
| GET    | `/api/tasks/:id`| Assigned / Creator | Get a single task                      |
| PUT    | `/api/tasks/:id`| Assigned User Only | Update task status                     |
| DELETE | `/api/tasks/:id`| Project Creator  | Delete a task                            |

**Query parameters for GET /api/tasks:**
- `project` - Filter by project ID
- `status` - Filter by status (`todo`, `in-progress`, `in-review`, `done`)
- `assignedTo` - Filter by assigned user ID
- `overdue=true` - Return only overdue tasks

### Dashboard

| Method | Endpoint         | Access    | Description                                         |
|--------|------------------|-----------|-----------------------------------------------------|
| GET    | `/api/dashboard` | Protected | Get personal task stats and project admin analytics |

**Response shape:**
```json
{
  "myStats": {
    "totalTasks": 5,
    "completedTasks": 2,
    "pendingTasks": 3,
    "overdueTasks": 1,
    "tasksByStatus": { "todo": 1, "inProgress": 1, "inReview": 1, "done": 2 }
  },
  "adminStats": {
    "totalProjects": 2,
    "totalTasks": 10,
    "completedTasks": 4,
    "pendingTasks": 6,
    "overdueTasks": 2,
    "tasksByStatus": { "todo": 2, "inProgress": 2, "inReview": 2, "done": 4 },
    "tasksPerUser": [{ "name": "John", "email": "john@example.com", "count": 5 }]
  }
}
```
> `adminStats` is `null` if the user does not own any projects.

---

## Deployment

The backend is deployed on **Railway**.

**Live API Base URL:** `https://team-task-manager-backend-production-2da3.up.railway.app`

### Deployment Notes

- Set all environment variables (`MONGO_URI`, `JWT_SECRET`, `PORT`) in the Railway service settings.
- Railway automatically runs `npm start` to launch the server.
- Ensure your MongoDB Atlas cluster allows connections from Railway's IP range (or use `0.0.0.0/0` for open access during development).
