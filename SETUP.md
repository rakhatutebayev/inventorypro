# Setup Guide for InventoryPro

## Initial Setup

### 1. Environment Configuration

Copy environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env  # Optional, for custom API URL
```

Edit `backend/.env` and set:
- `SECRET_KEY` - Generate a secure random string
- `POSTGRES_PASSWORD` - Database password
- `DATABASE_URL` - Will be auto-configured in docker-compose

### 2. Start Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 8000
- Frontend on port 3000

### 3. Database Migration

```bash
# Create initial migration
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"

# Apply migration
docker-compose exec backend alembic upgrade head
```

### 4. Create Initial Data

Run the setup script (see README.md) or manually create:
- Admin user (username: admin, password: admin123)
- Sample companies, device types, warehouses, employees

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Environment Variables

For production, update `.env` files:
- Set `DEBUG=False`
- Use strong `SECRET_KEY`
- Configure proper `CORS_ORIGINS`
- Set `DATABASE_URL` for production database

### Frontend Build

```bash
cd frontend
npm run build
```

Build output will be in `frontend/dist/` directory.

### Using with Reverse Proxy (Nginx/Traefik)

The API is configured to work behind a reverse proxy. Set:
- `API_V1_PREFIX=/api/v1` (default)
- Frontend `VITE_API_URL` to your API endpoint

Example Nginx configuration:
```nginx
location /api/v1 {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location / {
    proxy_pass http://frontend:3000;
}
```

## Troubleshooting

### Database Connection Issues

Check that PostgreSQL container is running:
```bash
docker-compose ps
docker-compose logs postgres
```

### Backend Not Starting

Check backend logs:
```bash
docker-compose logs backend
```

Verify database connection in `.env` file.

### Frontend Not Connecting to Backend

- Check `VITE_API_URL` in `frontend/.env`
- Verify backend is accessible at the configured URL
- Check CORS settings in backend `config.py`


