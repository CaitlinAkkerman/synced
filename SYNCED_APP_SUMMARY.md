# SYNCED - App Summary & Setup

## App Information

**App Name:** Synced
**Type:** Family period tracking app
**Description:** (TO BE FINALIZED)
**Vibe:** Clean + witty + professional

---

## Page Titles

| Page | Title | Subtitle | Status |
|------|-------|----------|--------|
| Dashboard | Sync Center | (TO BE FINALIZED) | ✅ Title locked |
| Profiles | (TO BE FINALIZED) | (TO BE FINALIZED) | ⏳ Pending |
| Profile Detail | Profile page | N/A | ✅ Existing |

---

## Deployment Status

**Frontend:** Vercel (deployed)
- URL: https://cyclopsychos-frontend-abc123.vercel.app (example)
- Environment Variable: `VITE_API_URL` = backend URL

**Backend:** Heroku (deployed)
- URL: https://cyclesychos-backend-caitlin.herokuapp.com (example)
- Environment Variables: `NODE_ENV=production`, `JWT_SECRET=[set]`

---

## Design System

**CSS Variables (--root):**
```
--primary: #ff006e
--secondary: #08f7fe
--dark-bg: #0a0e27
--card-bg: #1a1f3a
--text-primary: #ffffff
--text-secondary: #a8b5d1
--accent-red: #ff006e
--accent-blue: #08f7fe
--accent-purple: #7209b7
--success: #06d6a0
```

**Fonts:**
- Primary: Poppins (sans-serif)
- Code: Space Mono (monospace)

---

## Key Features Implemented

✅ User authentication (login/signup)
✅ Create multiple family member profiles
✅ Log periods with start/end dates
✅ Log symptoms independently
✅ Calendar visualization with multi-user color coding
✅ Period predictions based on cycle length
✅ Family insights (cycle sync detection, upcoming periods)
✅ Edit/delete log entries
✅ Profile management (edit age, cycle length, period length)
✅ Dynamic insights based on actual data

---

## Files & Components

**Frontend Components:**
- LoginScreen.jsx
- Dashboard.jsx
- ProfileDetailPage.jsx
- ProfileManager.jsx
- CycleLogger.jsx
- CycleChart.jsx

**Frontend Styles:**
- App.css
- Dashboard.css
- ProfileDetail.css
- ProfileManager.css
- Logger.css
- Charts.css

**Helper Functions:**
- api.js (API call handler with environment variable support)

**Backend Routes:**
- /api/auth (login, signup, logout)
- /api/profiles (CRUD operations)
- /api/logs (period & symptom logging)
- /api/household (household data)

---

## Known Issues Fixed

✅ CORS errors - added proper origin configuration
✅ Express.json() middleware - added to server.js
✅ Missing profileId in log submissions - fixed payload
✅ Profile edit not working - added PUT endpoint
✅ Modal sizing issues - CSS constraints added
✅ Custom symptom input closing modal - added stopPropagation()
✅ Content-Type headers - fixed in api.js helper
✅ Button styling - themed to match app aesthetic

---

## Recent Styling Updates

**Calendar:**
- Multi-user color coding (each profile gets unique color)
- Gradient backgrounds when multiple users have periods same day
- Dynamic legend showing each person's color

**Buttons:**
- Intensity buttons (Light/Medium/Heavy) - styled with theme colors
- Symptom buttons - themed with selected states
- All buttons use gradient backgrounds and smooth transitions

**Modal:**
- max-height: 85vh with scroll
- Proper stopPropagation on all interactive elements
- Clean close button

---

## Next Steps / TO DO

- [ ] Finalize app description for Synced
- [ ] Decide on profile management page title
- [ ] Add profile management page subtitle
- [ ] Test all features end-to-end
- [ ] Gather user feedback
- [ ] Consider additional features:
  - Export data as CSV
  - Custom symptom additions (✅ already working)
  - Notifications for upcoming periods
  - Dark/light mode toggle
  - Custom cycle predictions

---

## Important Files to Update When Changing Names/Titles

**App Name Changes:**
- frontend/package.json
- frontend/index.html
- frontend/src/App.jsx (navbar)
- backend/package.json

**Page Title Changes:**
- frontend/src/App.jsx (nav labels)
- frontend/src/components/Dashboard.jsx
- frontend/src/components/ProfileDetailPage.jsx
- frontend/src/components/ProfileManager.jsx

---

## Testing Notes

**Demo Account:**
- Email: demo@example.com
- Password: demo123
- Includes 2 pre-created profiles for testing

**Test Scenarios:**
- ✅ Sign up with new account
- ✅ Log period for single user
- ✅ Log period for multiple users
- ✅ Log symptoms only
- ✅ Edit period entry
- ✅ View calendar with multi-user highlights
- ✅ Check period predictions
- ✅ View family insights

---

## Branding Notes

**App Vibe:** Modern + Clean + Professional + Slightly Witty
**Not:** Overly cutesy, too corporate, absurdist (that was earlier iterations)
**Color Palette:** Dark theme with cyan/pink/purple accents
**Tone:** Helpful but sarcastic, informative but not preachy

---

## Contact Points

When starting new chat:
1. Mention: "Building Synced - period tracker app"
2. Current status: Deployed on Vercel (frontend) + Heroku (backend)
3. Latest decisions: App name is Synced, dashboard is "Sync Center"
4. Need help with: Profile page naming, final descriptions, future features

---

**Last Updated:** [Current Date]
**Status:** 🟢 Functional MVP - Ready for user testing
