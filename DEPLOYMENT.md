# Deployment Guide - Railway (Thailand Optimized)

## Why Railway?
- ✅ **Simplest deployment** - Deploy in 5 minutes
- ✅ **Asia-Pacific region** - Good performance for Thailand
- ✅ **Automatic SSL** - Free HTTPS certificates
- ✅ **PostgreSQL included** - Managed database
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **$5/month starter** - Very affordable

## Step-by-Step Deployment

### 1. Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (or email)
3. Verify your email

### 2. Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select this repository

### 3. Add PostgreSQL Database
1. In your project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provision it

### 4. Configure Environment Variables
Click on your app service → "Variables" tab → Add these:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=<generate-random-32-char-string>
DEBUG=False
```

To generate SECRET_KEY:
```bash
openssl rand -hex 32
```

### 5. Deploy!
1. Railway will automatically detect the `nixpacks.toml` configuration
2. It will:
   - Install Python dependencies
   - Build the React frontend
   - Run database migrations
   - Start the server
3. Wait 2-3 minutes for first deployment

### 6. Access Your App
1. Click "Settings" → "Generate Domain"
2. Railway will give you a URL like: `https://your-app-name.up.railway.app`
3. Open it in your browser!

### 7. Create Admin User
1. Go to your Railway dashboard
2. Click on your app service → "Deployments" → "View Logs"
3. Click "Shell" to open terminal
4. Run:
```python
python
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()
admin = User(
    username="admin",
    email="admin@example.com",
    password_hash=get_password_hash("ChangeThisPassword123!"),
    role=UserRole.ADMIN,
    full_name="System Administrator"
)
db.add(admin)
db.commit()
print("Admin user created!")
exit()
```

### 8. Login
- Go to your app URL
- Login with:
  - Username: `admin`
  - Password: `ChangeThisPassword123!` (or whatever you set)

## Alternative: Vercel (Frontend Only) + Railway (Backend)

If you want even faster performance in Thailand:

### Frontend on Vercel (Edge Network):
1. Push frontend to separate repo
2. Deploy to Vercel (has servers in Singapore)
3. Set `VITE_API_URL` to your Railway backend URL

### Backend on Railway:
- Keep backend on Railway with PostgreSQL

This gives you CDN-speed frontend with reliable backend.

## Cost Estimate

### Railway Only (All-in-One):
- Starter: $5/month
- Includes: App + Database + 512MB RAM

### Vercel + Railway:
- Vercel: Free (Hobby tier)
- Railway: $5/month (Backend + DB)
- **Total: $5/month** with better performance

## Custom Domain (Optional)

1. Buy domain from Namecheap/Google Domains
2. In Railway → Settings → Add custom domain
3. Add DNS records as shown
4. SSL certificate auto-generated

## Monitoring

Railway includes:
- Built-in logs
- CPU/Memory metrics
- Uptime monitoring
- Email alerts for downtime

## Backup Strategy

Railway provides automatic database backups, but for critical data:
1. Set up daily database exports
2. Store in cloud storage (AWS S3, Google Cloud Storage)

## Thailand-Specific Optimization

For best performance in Thailand:
1. **Use Railway's Singapore region** (if available in settings)
2. **Add Cloudflare** in front for CDN caching
3. **Enable Gzip compression** (already configured)

## Support

Railway has excellent support:
- Discord: https://discord.gg/railway
- Documentation: https://docs.railway.app
- Response time: Usually under 1 hour

---

## Quick Deploy Checklist

- [ ] Created Railway account
- [ ] Connected GitHub repository
- [ ] Added PostgreSQL database
- [ ] Set environment variables (DATABASE_URL, SECRET_KEY)
- [ ] Generated domain
- [ ] Created admin user
- [ ] Tested login and dashboard
- [ ] Added sample items via API docs
- [ ] Tested quick-entry forms

**Deployment time: ~10 minutes** ⚡
