# AuthSentinel — TUBES Cloud Computing

Cloud Native Authentication System berbasis AWS EC2 + Docker + PostgreSQL + JWT.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML, CSS, JavaScript, Chart.js |
| Backend | Node.js, Express.js, Winston, Swagger |
| Database | PostgreSQL 15 |
| Auth | JWT + Bcrypt |
| Container | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Cloud | AWS EC2 us-east-1 |
| CI/CD | GitHub Actions |

## Struktur Project

```
authsentinel/
├── frontend/
│   └── index.html          # SPA dashboard + auth
├── backend/
│   ├── src/
│   │   ├── server.js       # Entry point (Winston + Swagger)
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Auth & User controllers
│   │   ├── middleware/      # JWT, error, validation
│   │   ├── routes/         # auth, user, health, system
│   │   └── utils/          # logger.js, swagger.config.js
│   ├── db/migrations/      # SQL schema
│   └── Dockerfile
├── nginx/
│   └── nginx.conf          # Reverse proxy config
├── .github/workflows/
│   └── deploy.yml          # CI/CD auto-deploy ke EC2
├── docker-compose.yml
└── .env                    # Konfigurasi environment
```

## Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/dioaliqbal/DioAlIqbal_TUBES_CC.git
cd DioAlIqbal_TUBES_CC
```

### 2. Jalankan Docker
```bash
docker compose up --build -d
```

### 3. Buka browser
```
http://localhost
```

## API Endpoints

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | /api/health | - | Health check |
| GET | /api/docs | - | Swagger docs |
| POST | /api/auth/register | - | Daftar |
| POST | /api/auth/login | - | Login |
| POST | /api/auth/logout | JWT | Logout |
| GET | /api/auth/me | JWT | Info user |
| GET | /api/system/status | JWT | Status infrastruktur |
| GET | /api/system/logs | JWT | Auth logs |
| GET | /api/system/chart | JWT | Chart data 7 hari |

## CI/CD Setup (GitHub Actions)

Tambahkan secrets di GitHub → Settings → Secrets:
- `EC2_HOST` — Public IP EC2
- `EC2_USER` — `ubuntu`
- `EC2_SSH_KEY` — Isi file .pem
- `EC2_APP_DIR` — `/home/ubuntu/DioAlIqbal_TUBES_CC`

Setelah itu, setiap push ke `main` otomatis deploy ke EC2.
