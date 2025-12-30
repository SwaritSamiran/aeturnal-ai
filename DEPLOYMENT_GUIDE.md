# AETURNUS-AI DEPLOYMENT GUIDE

## Step 1: Export Your Code from v0

1. Click the **three dots (...)** in the top right corner of your v0 preview
2. Select **"Download ZIP"**
3. Extract the ZIP file on your computer

## Step 2: Install the Project Locally

You have two options to set up the project:

### Option A: Using shadcn CLI (Recommended)
```bash
# Open terminal in the extracted folder
npx shadcn@latest add
# Follow the prompts to install dependencies
```

### Option B: Manual Setup
```bash
npm install
# or
yarn install
# or
pnpm install
```

## Step 3: Test Locally

Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see your app.

## Step 4: Deploy to Vercel (FREE)

### Method 1: Direct from v0 (Easiest)
1. In v0, click the **"Publish"** button in the top right
2. Connect your Vercel account if prompted
3. Click **"Deploy"**
4. Your app will be live in 2-3 minutes!

### Method 2: From GitHub
1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/aeturnus-ai.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click **"New Project"**
4. Import your GitHub repository
5. Click **"Deploy"**

Your app will be live at: `https://aeturnus-ai.vercel.app` (or similar)

## Step 5: Connect Your Backend

Once deployed, you need to connect your AI model backend:

### Environment Variables Setup
1. In Vercel dashboard, go to your project
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-api.com
   API_SECRET_KEY=your-secret-key
   ```

### Backend API Endpoints Needed

Your backend needs to provide these endpoints:

#### 1. Food Scan Endpoint
```
POST /api/scan
Content-Type: application/json

Request Body:
{
  "foodInput": "Monster Energy Drink",
  "imageBase64": "data:image/jpeg;base64,...", // Optional
  "userData": {
    "age": "25",
    "weight": "70",
    "height": "175",
    "medicalHistory": "Diabetes",
    "selectedClass": "glucose-guardian"
  }
}

Response:
{
  "food": "Monster Energy Drink",
  "calories": 110,
  "protein": 1,
  "carbs": 27,
  "fats": 0,
  "sugar": 27,
  "sodium": 180,
  "isHealthy": false,
  "healthRisk": "high",
  "redPillConsequences": "High sugar and caffeine may spike blood sugar. Energy crash in 2 hours. -15 vitality",
  "bluePillAlternative": "Green tea or black coffee. Same energy boost, zero sugar. +10 vitality, +50 XP",
  "detailedAnalysis": "NUTRITIONAL_BREAKDOWN:\n- Calories: 110\n- Sugar: 27g (135% DV)\n- Caffeine: 160mg\n\nWARNINGS:\n- High sugar content dangerous for glucose control\n- May cause insulin spike\n- Artificial sweeteners present\n\nRECOMMENDATION: Avoid",
  "ingredients": ["Carbonated Water", "Sucrose", "Glucose", "Citric Acid", "Taurine", "..."],
  "allergens": ["May contain traces of soy"],
  "additives": ["E950", "E951", "E952"]
}
```

#### 2. Record User Choice Endpoint
```
POST /api/record-choice
Content-Type: application/json

Request Body:
{
  "userId": "john_doe",
  "foodScanned": "Monster Energy Drink",
  "choice": "blue", // or "red"
  "timestamp": "2025-01-27T10:30:00Z",
  "nutritionalData": {
    "calories": 110,
    "sugar": 27
  }
}

Response:
{
  "success": true,
  "xpAwarded": 50,
  "vitalityChange": 10,
  "message": "Good choice! Keep it up!"
}
```

#### 3. Get User History Endpoint
```
GET /api/history?userId=john_doe&date=2025-01-27

Response:
{
  "meals": [
    {
      "date": "2025-01-27",
      "time": "08:30",
      "food": "Oatmeal with Berries",
      "calories": 300,
      "choice": "blue",
      "isHealthy": true
    },
    ...
  ]
}
```

### Integration in Code

All backend integration points are marked with comments:
```javascript
// ========================================
// BACKEND INTEGRATION POINT #1: FOOD SCAN API
// ========================================
```

Search for these comments in `components/dashboard-stage.tsx` to find where to add your API calls.

## Step 6: Testing the Integration

1. Replace mock data with actual API calls
2. Test with various foods:
   - Healthy options (fruits, vegetables)
   - Unhealthy options (energy drinks, chips)
   - Edge cases (unclear labels, missing data)
3. Verify the red/blue pill system works correctly
4. Check that XP and vitality are updated

## Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run build`
- Verify Node.js version (16.8 or higher required)

### API Connection Issues
- Check CORS settings on your backend
- Verify environment variables are set in Vercel
- Use `console.log` to debug API responses

### Styling Issues
- Clear browser cache
- Check if Tailwind CSS is working: `npx tailwindcss -i ./app/globals.css -o ./output.css`

## Performance Optimization

For production, consider:
1. Image optimization (use Next.js Image component)
2. Lazy loading for heavy components
3. API caching for repeated scans
4. CDN for static assets

## Support

If you need help:
1. Check Vercel logs for errors
2. Review Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
3. Contact Vercel support at [vercel.com/help](https://vercel.com/help)

Good luck with your hackathon!
