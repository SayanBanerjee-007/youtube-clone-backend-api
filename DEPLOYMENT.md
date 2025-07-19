# 🚀 YouTube Clone Backend - Deployment Guide

## Pre-Deployment Checklist

### 🔐 Security Configuration

1. **Environment Variables**

   ```bash
   # Copy example environment file
   cp .env.example .env

   # Generate secure JWT secrets
   node -e "console.log('ACCESS_TOKEN_SECRET:', require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log('REFRESH_TOKEN_SECRET:', require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Database Setup**

   - Create MongoDB Atlas account
   - Set up production database cluster
   - Whitelist server IP addresses
   - Create database user with minimal required permissions

3. **Cloudinary Setup**
   - Verify Cloudinary account limits
   - Set up upload presets if needed
   - Configure auto-backup/sync if required

### 🌐 Production Environment

1. **CORS Configuration**

   - Update `CORS_ORIGIN` to your frontend domain
   - Remove localhost origins

2. **Cookie Security**

   - Cookies automatically secure in production
   - SameSite set to 'none' for cross-origin

3. **File Upload Limits**
   - Images: 2MB max
   - Videos: 100MB max
   - Adjust based on hosting provider limits

### 📦 Deployment Platforms

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway deploy
```

#### Render

- Connect GitHub repository
- Set environment variables
- Deploy automatically

#### DigitalOcean App Platform

- Connect GitHub repository
- Configure build and run commands
- Set environment variables

### 🔧 Server Configuration

1. **Environment Variables to Set**

   ```
   NODE_ENV=production
   PORT=8000
   MONGODB_URI=mongodb+srv://...
   CORS_ORIGIN=https://yourdomain.com
   ACCESS_TOKEN_SECRET=...
   REFRESH_TOKEN_SECRET=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

2. **Build Commands**

   ```bash
   # Build command (if required)
   npm run build

   # Start command
   npm start
   ```

### 🚨 Security Checklist

- [ ] Remove all console.log statements with sensitive data
- [ ] Update default rate limits if needed
- [ ] Verify HTTPS is enforced
- [ ] Check database connection security
- [ ] Validate file upload restrictions
- [ ] Test authentication flows
- [ ] Verify CORS configuration

### 📊 Monitoring

1. **Health Check Endpoint**

   - `GET /api/v1/healthcheck` - Server status

2. **Logging**

   - Monitor server logs for errors
   - Set up log aggregation if needed

3. **Performance**
   - Monitor API response times
   - Check database query performance
   - Monitor file upload success rates

### 🔄 Post-Deployment

1. **Test All Endpoints**

   - User registration/login
   - File uploads
   - CRUD operations
   - Authentication flows

2. **Update Frontend**

   - Update API base URL
   - Test cross-origin requests
   - Verify cookie handling

3. **Documentation**
   - Update API documentation URLs
   - Share production API endpoints

### 🆘 Troubleshooting

**Common Issues:**

1. **CORS Errors**

   - Check CORS_ORIGIN matches frontend domain exactly
   - Verify credentials: true in CORS config

2. **Cookie Issues**

   - Ensure HTTPS in production
   - Check SameSite settings for cross-origin

3. **Database Connection**

   - Verify MongoDB Atlas IP whitelist
   - Check connection string format

4. **File Upload Failures**

   - Verify Cloudinary credentials
   - Check file size limits

5. **Authentication Issues**
   - Verify JWT secrets are set
   - Check token expiry settings

### 📞 Support

For deployment issues, check:

- Server logs
- Database connection status
- Environment variable configuration
- Network connectivity

## 🎉 Ready for Production!

Once deployed, your API will be available at:

- Health Check: `https://your-domain.com/api/v1/healthcheck`
- API Docs: `https://your-domain.com/api-docs/v2`
