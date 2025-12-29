# 🚀 DEPLOY BACKEND IN 2 MINUTES

## ✅ Frontend Already Live!
**URL:** https://5e173244.aid-inventory.pages.dev
- Deployed on Cloudflare Pages
- Global edge network (super fast in Thailand!)

## 🔧 Deploy Backend Now (2 Minutes)

### Option 1: Render.com (Recommended - FREE)

1. **Go to Render.com**
   - Visit: https://dashboard.render.com/register
   - Sign up with GitHub (use: simeon.garratt@gmail.com)

2. **Create PostgreSQL Database**
   - Click "+ New" → "PostgreSQL"
   - Name: `aid-inventory-db`
   - Region: **Singapore** (best for Thailand)
   - Plan: **Free**
   - Click "Create Database"
   - **Copy the Internal Database URL** (you'll need this in step 4)

3. **Create Web Service**
   - Click "+ New" → "Web Service"
   - Connect GitHub: `canboigay/aid-inventory-system`
   - Click "Connect"

4. **Configure Service**
   - Name: `aid-inventory-backend`
   - Region: **Singapore**
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: **Python 3**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   
5. **Set Environment Variables** (click "Advanced")
   - `DATABASE_URL` = (paste the Internal Database URL from step 2)
   - `SECRET_KEY` = (generate: run `openssl rand -hex 32` in terminal)
   - `DEBUG` = `False`

6. **Click "Create Web Service"**
   - Wait 3-5 minutes for deployment
   - You'll get a URL like: `https://aid-inventory-backend.onrender.com`

7. **Update Frontend**
   - Copy your backend URL
   - Run these commands:
   ```bash
   cd /Users/simeong/Desktop/Projects/aid-inventory-system/frontend
   # Update .env with your backend URL
   echo "VITE_API_URL=https://aid-inventory-backend.onrender.com/api" > .env
   npm run build
   wrangler pages deploy dist --project-name=aid-inventory
   ```

8. **Create Admin User**
   - In Render dashboard, click your service
   - Click "Shell" tab
   - Run:
   ```python
   python
   from app.db.session import SessionLocal
   from app.db.models.user import User, UserRole
   from app.core.security import get_password_hash
   
   db = SessionLocal()
   admin = User(
       username="admin",
       email="admin@example.com",
       password_hash=get_password_hash("Admin123!"),
       role=UserRole.ADMIN,
       full_name="Administrator"
   )
   db.add(admin)
   db.commit()
   print("✅ Admin user created!")
   exit()
   ```

## 🎉 Done!

Visit your app and login:
- Username: `admin`
- Password: `Admin123!`

## 💰 Cost
- **Cloudflare Pages:** FREE
- **Render.com:** FREE (750 hours/month)
- **Total:** $0/month

## 📍 Performance for Thailand
- Frontend: Cloudflare global CDN ⚡
- Backend: Singapore data center 🚀
- Database: Singapore 💾

---

**Need help?** The full setup takes 2-3 minutes!
