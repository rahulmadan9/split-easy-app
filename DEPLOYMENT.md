# Two Track Teller - Firebase Deployment Guide

## Overview
This guide walks you through deploying Two Track Teller to Firebase Hosting independently from Lovable.

**Firebase Project ID**: `two-track-teller-1770026581`
**Firebase Plan**: Spark (Free)
**Tech Stack**: Vite + React + TypeScript + Firebase (Auth, Firestore, Hosting)

## 🆓 Free Plan (Spark) Deployment

This project is configured to deploy on Firebase's **free Spark plan** without requiring Cloud Functions. Here's what you get:

✅ **Included (Free)**:
- Firebase Hosting - Static website hosting
- Firebase Authentication - Phone & email authentication
- Cloud Firestore - NoSQL database with security rules
- Free quotas: 10GB hosting storage, 360MB/day database reads, 10K auth verifications/month

❌ **Not Included (Requires Blaze Plan)**:
- Cloud Functions - Serverless backend functions

**Why No Functions?** The app has client-side code (`src/integrations/firebase/profiles.ts`) that handles user profile creation, making Cloud Functions optional. The only thing we lose is automatic cleanup when users are deleted, which is a nice-to-have but not essential.

### 💳 Need Cloud Functions? Upgrade to Blaze Plan

If you later decide you need Cloud Functions (for automatic data cleanup, server-side logic, etc.):

1. **Upgrade to Blaze plan** in Firebase Console: https://console.firebase.google.com/project/two-track-teller-1770026581/usage/details
2. **Restore functions config**: Replace `firebase.json` with `firebase.json.with-functions`
3. **Deploy with functions**: Run `firebase deploy` (will include functions)

**Note**: Blaze is pay-as-you-go with generous free tier. Most small apps stay within free quotas.

---

## Quick Start (First-Time Deployment)

### Step 1: Prerequisites
Ensure you have the following installed:
- Node.js 18+ (`node --version`)
- npm (`npm --version`)
- Firebase CLI (`npm install -g firebase-tools`)

### Step 2: Authentication
```bash
# Login to Firebase
firebase login

# Verify you're using the correct project
firebase use two-track-teller-1770026581
firebase projects:list
```

### Step 3: Configure Environment Variables
Create a `.env` file in the project root with your actual Firebase credentials:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your actual Firebase values:
```env
VITE_FIREBASE_API_KEY="your_actual_api_key"
VITE_FIREBASE_AUTH_DOMAIN="two-track-teller-1770026581.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="two-track-teller-1770026581"
VITE_FIREBASE_STORAGE_BUCKET="two-track-teller-1770026581.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_actual_sender_id"
VITE_FIREBASE_APP_ID="your_actual_app_id"
VITE_USE_FIREBASE_EMULATORS="false"
```

**Get your Firebase credentials**:
```bash
# Option 1: Via CLI
firebase apps:sdkconfig web

# Option 2: Via Firebase Console
# Go to: https://console.firebase.google.com/project/two-track-teller-1770026581/settings/general
# Scroll to "Your apps" → Select your web app → Copy config values
```

### Step 4: Install Dependencies
```bash
# Install dependencies
npm install
```

### Step 5: Verify Local Build
```bash
# Build the application
npm run build

# Preview the production build locally
npm run preview
# Open http://localhost:4173 in your browser
```

### Step 6: Deploy to Firebase
```bash
# Deploy all services (Firestore rules, indexes, and hosting)
# Note: We exclude functions to stay on the free Spark plan
firebase deploy --only hosting,firestore
```

This will deploy:
- **Firestore Rules**: Security rules for database access
- **Firestore Indexes**: Query optimization indexes
- **Hosting**: Your React application

**Expected Output**:
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/two-track-teller-1770026581/overview
Hosting URL: https://two-track-teller-1770026581.web.app
```

### Step 7: Verify Deployment
Open your deployed app: https://two-track-teller-1770026581.web.app

**Test the following**:
- [ ] App loads without errors
- [ ] Phone authentication works
- [ ] Can create user account
- [ ] Can add/edit/delete expenses
- [ ] Expenses are saved to Firestore
- [ ] Cannot access other users' expenses
- [ ] Mobile responsive design works

---

## CI/CD Automation (Recommended)

The GitHub Actions workflow is already configured in `.github/workflows/firebase-deploy.yml`.

### Setup GitHub Secrets

#### 1. Generate Firebase CI Token
```bash
firebase login:ci
# Copy the token that appears
```

#### 2. Add Secrets to GitHub
Go to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

Add these 7 secrets:

| Secret Name | Value |
|-------------|-------|
| `VITE_FIREBASE_API_KEY` | From your `.env` file |
| `VITE_FIREBASE_AUTH_DOMAIN` | `two-track-teller-1770026581.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `two-track-teller-1770026581` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `two-track-teller-1770026581.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From your `.env` file |
| `VITE_FIREBASE_APP_ID` | From your `.env` file |
| `FIREBASE_TOKEN` | From `firebase login:ci` command |

#### 3. Test the Workflow
```bash
# Push to development branch (deploys hosting only)
git checkout -b development
git push origin development

# Push to main branch (deploys hosting and firestore)
git checkout main
git push origin main
```

View workflow status:
```
https://github.com/[your-username]/two-track-teller/actions
```

---

## Deployment Commands

### Deploy Everything (Free Plan)
```bash
npm run build && firebase deploy --only hosting,firestore
```

### Deploy Specific Services
```bash
# Hosting only (after code changes)
npm run build && firebase deploy --only hosting

# Firestore rules only
firebase deploy --only firestore:rules

# Firestore indexes only
firebase deploy --only firestore:indexes

# Hosting and Firestore together
npm run build && firebase deploy --only hosting,firestore
```

### Preview Deployments (Development Testing)
```bash
# Create a preview channel that expires in 7 days
firebase hosting:channel:deploy preview --expires 7d

# Create a dev channel that expires in 30 days
firebase hosting:channel:deploy dev --expires 30d
```

### Rollback
```bash
# Rollback to previous hosting deployment
firebase hosting:rollback
```

---

## Deployment Workflow

### For Development/Testing
```bash
# 1. Make changes locally
npm run dev  # Test at http://localhost:5173

# 2. Build and preview
npm run build
npm run preview  # Test at http://localhost:4173

# 3. Deploy to preview channel
firebase hosting:channel:deploy dev --expires 30d

# 4. Or push to development branch (if CI/CD enabled)
git push origin development
```

### For Production
```bash
# Option 1: Manual deployment
npm run build
firebase deploy --only hosting,firestore

# Option 2: Via GitHub Actions (recommended)
git checkout main
git merge development
git push origin main  # CI/CD will auto-deploy
```

---

## Monitoring & Debugging

### View Logs
```bash
# View recent deployments
firebase deploy:list

# View hosting deployment history
firebase hosting:releases:list
```

### Firebase Console
Access your Firebase Console:
- **Overview**: https://console.firebase.google.com/project/two-track-teller-1770026581/overview
- **Authentication**: https://console.firebase.google.com/project/two-track-teller-1770026581/authentication
- **Firestore**: https://console.firebase.google.com/project/two-track-teller-1770026581/firestore
- **Hosting**: https://console.firebase.google.com/project/two-track-teller-1770026581/hosting

### Test Firestore Rules
```bash
firebase firestore:rules:test
```

---

## Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist .vite

# Rebuild
npm run build
```

### Authentication Issues
```bash
# Re-authenticate with Firebase
firebase logout
firebase login
firebase use two-track-teller-1770026581
```

### Environment Variables Not Working
- Ensure `.env` file exists in project root
- Verify all `VITE_*` variables are prefixed correctly
- Rebuild after changing `.env`: `npm run build`
- Check that `.env` is in `.gitignore` (it should be)

### Hosting Shows Old Version
```bash
# Clear browser cache (hard refresh: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
# Or open in incognito/private mode

# Verify latest deployment
firebase deploy:list
```

---

## Custom Domain Setup (Optional)

### Via Firebase Console
1. Go to: https://console.firebase.google.com/project/two-track-teller-1770026581/hosting
2. Click "Add custom domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait 24-48 hours for SSL certificate provisioning

### Via CLI
```bash
firebase hosting:sites:create your-domain-com
# Follow prompts for DNS configuration
```

---

## File Structure Reference

```
two-track-teller/
├── .env                          # Your actual credentials (NOT in git)
├── .env.example                  # Template for environment variables
├── .firebaserc                   # Firebase project configuration
├── firebase.json                 # Firebase services configuration
├── firebase.json.with-functions  # Backup config with functions (for Blaze plan)
├── firestore.rules               # Database security rules
├── firestore.indexes.json        # Query optimization indexes
├── functions/                    # Cloud Functions (NOT deployed on Spark plan)
│   ├── src/
│   │   └── index.ts             # Functions code (optional, requires Blaze plan)
│   ├── package.json             # Functions dependencies
│   └── tsconfig.json            # Functions TypeScript config
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml  # CI/CD workflow (Spark plan compatible)
├── dist/                        # Production build output (generated)
└── src/                         # React application source
```

---

## Security Checklist

Before deploying to production:
- [ ] `.env` file is in `.gitignore`
- [ ] Firebase credentials are not committed to git
- [ ] Firestore security rules are deployed
- [ ] Phone authentication reCAPTCHA is configured
- [ ] Only authorized domains are allowed in Firebase Console
- [ ] GitHub secrets are configured (if using CI/CD)
- [ ] User profile creation works (client-side code handles this)

---

## Quick Command Reference

```bash
# Development
npm run dev                                    # Local dev server
npm run build                                  # Production build
npm run preview                                # Preview production build

# Deployment (Spark Plan - Free)
firebase deploy --only hosting,firestore       # Deploy everything (Spark plan)
firebase deploy --only hosting                 # Deploy hosting only
firebase deploy --only firestore:rules         # Deploy Firestore rules
firebase deploy --only firestore:indexes       # Deploy Firestore indexes

# Preview Channels
firebase hosting:channel:deploy preview --expires 7d

# Monitoring
firebase deploy:list                           # List deployments
firebase hosting:releases:list                 # View hosting history

# Rollback
firebase hosting:rollback                      # Rollback hosting

# Authentication
firebase login                                 # Login to Firebase
firebase logout                                # Logout
firebase use two-track-teller-1770026581      # Select project

# Project Info
firebase projects:list                         # List all projects
firebase apps:sdkconfig web                    # Get web app config
```

---

## Support & Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Console**: https://console.firebase.google.com/project/two-track-teller-1770026581
- **Firebase CLI Reference**: https://firebase.google.com/docs/cli
- **GitHub Actions**: https://docs.github.com/en/actions

---

## Success Criteria

After deployment, verify:
- ✅ App accessible at https://two-track-teller-1770026581.web.app
- ✅ Phone authentication functional
- ✅ User profile creation works (check Firestore `users` collection)
- ✅ Expenses CRUD operations work
- ✅ Firestore security rules enforced (cannot access other users' data)
- ✅ No console errors in production
- ✅ Mobile responsive design works
- ✅ CI/CD pipeline operational (if enabled)

---

**Last Updated**: 2026-02-05
