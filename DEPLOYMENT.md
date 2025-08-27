# Margin Dashboard Deployment Guide

## Overview

The margin dashboard now supports two data sources:
1. **Live API** - Fetches real-time data from your server
2. **Static Files** - Uses pre-generated JSON files for static hosting

## Data Source Configuration

### Environment Variables

Copy `env.example` to `.env.local` and configure:

```bash
# For development with live API
VITE_DATA_SOURCE=api
VITE_API_URL=http://localhost:9008
VITE_REFRESH_INTERVAL=30000

# For production with static files
VITE_DATA_SOURCE=static
VITE_STATIC_DATA_PATH=/data/dashboard-data.json
VITE_REFRESH_INTERVAL=0
```

### Data Contract

The dashboard expects data in this exact format (see `src/types/data.ts`):

```typescript
interface DashboardData {
  managers: MarginManager[]
  loans: MarginLoan[]
  liquidations: MarginLiquidation[]
}
```

## Development

1. **Start with API data:**
   ```bash
   npm run dev
   ```
   - Dashboard will connect to `http://localhost:9008`
   - Use the "Switch to Static" button to test static data

2. **Test static data:**
   - Click "Switch to Static" button in development mode
   - Dashboard will load from `public/data/dashboard-data.json`

## Production Deployment (Vercel)

### Option 1: Static Data Only (Recommended for Vercel)

1. **Set environment variables in Vercel:**
   ```
   VITE_DATA_SOURCE=static
   VITE_REFRESH_INTERVAL=0
   ```

2. **Update static data:**
   - Modify `public/data/dashboard-data.json`
   - Commit and push changes
   - Vercel will rebuild automatically

### Option 2: Live API (if you have a hosted API)

1. **Set environment variables in Vercel:**
   ```
   VITE_DATA_SOURCE=api
   VITE_API_URL=https://your-api-domain.com
   VITE_REFRESH_INTERVAL=30000
   ```

2. **Ensure CORS is configured on your API server**

## Data Updates

### For Static Deployment

1. **Generate new data file:**
   ```bash
   # Export from your database/API
   curl https://your-api.com/dashboard-data > public/data/dashboard-data.json
   ```

2. **Commit and deploy:**
   ```bash
   git add public/data/dashboard-data.json
   git commit -m "Update dashboard data"
   git push
   ```

### For Live API

- Data updates automatically based on `VITE_REFRESH_INTERVAL`
- Set to `0` to disable auto-refresh

## File Structure

```
public/
  data/
    dashboard-data.json    # Static data file
src/
  types/
    data.ts               # Data contract interfaces
  services/
    dataService.ts        # Data source management
  App.tsx                # Main dashboard component
```

## Switching Between Sources

- **Development:** Use the toggle button in the header
- **Production:** Set `VITE_DATA_SOURCE` environment variable
- **Runtime:** Call `dataService.setDataSource('api' | 'static')`

## Benefits

1. **Clean Contract:** Data structure is clearly defined
2. **Easy Switching:** Toggle between live and static data
3. **Vercel Ready:** Optimized for static hosting
4. **Fallback Support:** Automatic fallback to static data if API fails
5. **Environment Based:** Different configs for dev/prod
