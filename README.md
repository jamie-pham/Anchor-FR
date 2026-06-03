# Anchor — Emergency Alert App

Anchor monitors 6 emergency types near your location and sends plain-English push notifications with specific action steps.

## Emergency Types Monitored

| Type | Data Source | Key Factors |
|------|-------------|-------------|
| Wildfire | NASA FIRMS VIIRS | Distance, wind direction/speed, temp, humidity |
| Earthquake | USGS Earthquake Hazards | Magnitude, depth, distance |
| Flood | BOM Flood Gauges | Gauge level vs threshold, rainfall, flood plain |
| Severe Storm | ECMWF / BOM | Wind speed, storm category, distance |
| Extreme Heat | ECMWF / BOM | Temperature, heat index, forecast duration |
| Tsunami | Pacific Tsunami Warning Centre | Wave height, distance, time to arrival |

## Risk Scoring

Scores are 0–100 and resolve to:
- **HIGH** ≥ 70
- **MEDIUM** ≥ 40
- **LOW** < 40

AI-generated alerts use the Anthropic Claude API (claude-sonnet-4-6) with prompt caching.

## Tech Stack

- **Frontend**: React Native + Expo (iOS, Android, Web)
- **Backend**: Node.js + Express + TypeScript
- **AI**: Anthropic Claude API
- **Push Notifications**: Expo Notifications

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Add ANTHROPIC_API_KEY
npm run dev
```

The API starts on `http://localhost:3000`.

**Key endpoints:**
- `GET  /health`
- `POST /api/alerts/check` — check for alerts at `{ lat, lng, deviceToken? }`
- `GET  /api/alerts?lat=&lng=` — fetch recent alerts
- `POST /api/risk/calculate` — get risk scores for `{ lat, lng }`
- `POST /api/notifications/register` — register device token

### Frontend

```bash
cd frontend
npm install
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or `w` for web.

## Environment Variables

### Backend (`.env`)
```
PORT=3000
NODE_ENV=development
ANTHROPIC_API_KEY=your_key_here
NASA_FIRMS_API_KEY=your_key_here
```

### Frontend (`.env`)
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_PROJECT_ID=your-eas-project-id
```

## Supported Regions

- Australia (launched)
- Greece, Portugal, Spain (expanding)
- California, Oregon, Washington (expanding)
- Sub-Saharan Africa (expanding)
