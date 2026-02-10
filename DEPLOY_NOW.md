# 🚀 Deploy Two Track Teller Now (Free Plan)

## Quick Deploy (5 minutes)

### 1. Create `.env` file
```bash
cp .env.example .env
```

Edit `.env` and add your Firebase credentials (get from Firebase Console or run `firebase apps:sdkconfig web`)

### 2. Install & Build
```bash
npm install
npm run build
```

### 3. Deploy to Firebase
```bash
firebase login
firebase deploy --only hosting,firestore
```

That's it! Your app will be live at:
**https://two-track-teller-1770026581.web.app**

---

## ✅ What Gets Deployed (Free Spark Plan)

- ✅ **Hosting** - Your React app
- ✅ **Firestore Rules** - Database security
- ✅ **Firestore Indexes** - Query optimization
- ✅ **Authentication** - Phone & email auth

**NOT Deployed** (requires paid Blaze plan):
- ❌ Cloud Functions

**Why no functions?** The app has client-side code that handles user profile creation, so functions are optional.

---

## 🔍 Verify Deployment

1. Open https://two-track-teller-1770026581.web.app
2. Test phone authentication
3. Create a test user and add an expense
4. Check Firestore Console for `users` and `expenses` collections

---

## 📚 Full Documentation

See `DEPLOYMENT.md` for:
- CI/CD setup with GitHub Actions
- Troubleshooting guide
- Custom domain setup
- Monitoring and logs
- Preview deployments

---

## 🆘 Common Issues

### Build fails?
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Need to re-authenticate?
```bash
firebase logout
firebase login
firebase use two-track-teller-1770026581
```

### Want to add Cloud Functions later?
1. Upgrade to Blaze plan (pay-as-you-go with free tier)
2. Replace `firebase.json` with `firebase.json.with-functions`
3. Deploy: `firebase deploy`

---

**Ready to deploy? Run these 3 commands:**
```bash
npm install && npm run build
firebase login
firebase deploy --only hosting,firestore
```
