# ☁️ CloudVault — Secure Cloud Storage System

A full-stack cloud storage application with JWT-based Identity Access Management, file versioning, and AWS S3 integration.

## 🚀 Live Demo

- **Frontend**: [secure-vault-sepia-ten.vercel.app](https://secure-vault-sepia-ten.vercel.app)
- **Backend API**: [secure-vault-production-1159.up.railway.app](https://secure-vault-production-1159.up.railway.app)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Storage | AWS S3 |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## ✨ Features

- 🔐 JWT-authenticated user login & signup
- ☁️ Upload, download & manage files
- 🗂️ File versioning & rollback
- 🔁 Backup & replication via AWS S3
- 🛡️ Secure API access with middleware protection

---

## 📁 Project Structure

```
cloud-storage-system/
├── frontend/               # React + Vite app
│   ├── src/
│   ├── public/
│   ├── .env                # VITE_API_URL (not committed)
│   └── vite.config.js
│
└── secure-cloud-storage/
    └── backend/            # Node.js + Express API
        ├── config/         # DB connection
        ├── controllers/    # Route logic
        ├── middleware/     # Auth middleware
        ├── models/         # Mongoose models
        ├── routes/         # API routes
        ├── .env            # Secrets (not committed)
        ├── .env.example    # Template for env vars
        └── server.js       # Entry point
```

---


## 🔑 Environment Variables

### Backend `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name
```

### Frontend `.env`

```env
VITE_API_URL=https://your-backend-url.up.railway.app
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Files
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/files` | Get all files for user |
| POST | `/api/files/upload` | Upload a file |
| DELETE | `/api/files/:id` | Delete a file |

---

## 🚢 Deployment

| Service | Platform | Auto-deploy |
|---|---|---|
| Frontend | Vercel | ✅ On push to main |
| Backend | Railway | ✅ On push to main |
| Database | MongoDB Atlas | ☁️ Always on |

---
