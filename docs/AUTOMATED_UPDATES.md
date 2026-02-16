# Automated MEP Data Updates

This document explains how to set up automated daily updates of MEP data from the Sejm API.

## Overview

The update pipeline:
1. ✅ Fetches latest MEP profiles from Sejm API
2. ✅ Fetches voting statistics
3. ✅ Combines and aggregates data
4. ✅ Uploads to Firestore database
5. ✅ Uploads new photos to Firebase Storage

**Runtime:** ~2-3 minutes
**Cost:** ~$0.03/month (daily updates)
**Frequency:** Daily at 3 AM UTC (configurable)

## Setup Instructions

### 1. Get Google Cloud Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `sejmograf-91428`
3. Navigate to: **IAM & Admin → Service Accounts**
4. Click on your service account (or create one)
5. Click **Keys** tab → **Add Key** → **Create new key**
6. Choose **JSON** format
7. Download the key file

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to: **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `GOOGLE_APPLICATION_CREDENTIALS`
5. Value: Paste the **entire contents** of the JSON key file
6. Click **Add secret**

### 3. Enable GitHub Actions

1. Go to your repository on GitHub
2. Click **Actions** tab
3. If prompted, enable GitHub Actions for your repository
4. The workflow will now run automatically every day at 3 AM UTC

### 4. Manual Trigger (Optional)

To manually trigger an update:
1. Go to **Actions** tab
2. Click **Update MEP Data** workflow
3. Click **Run workflow** → **Run workflow**

## Running Locally

You can also run the update pipeline locally:

```bash
# Run the full pipeline
node scripts/updateMepData.js

# Or run individual scripts
node scraping/scraper-basic.js
node scraping/scraper-voting.js
node scraping/scraper-combine-voting.js
node scraping/aggregate-voting-stats.js
node scripts/uploadToFirestore.js
node scripts/uploadToStorage.js
```

**Prerequisites:**
- Google Cloud credentials configured locally
- Run: `gcloud auth application-default login`

## Customizing Update Frequency

Edit `.github/workflows/update-mep-data.yml`:

```yaml
schedule:
  # Daily at 3 AM UTC
  - cron: '0 3 * * *'

  # Weekly on Mondays at 3 AM UTC
  # - cron: '0 3 * * 1'

  # Every 6 hours
  # - cron: '0 */6 * * *'
```

**Cron syntax:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6, Sunday to Saturday)
│ │ │ │ │
* * * * *
```

## Monitoring

### View Run History
1. Go to **Actions** tab on GitHub
2. Click **Update MEP Data** workflow
3. View all runs, logs, and status

### Email Notifications
GitHub will email you if a workflow fails (check repository notification settings).

### Check Firestore
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **Firestore Database**
3. Check the `meps` collection `updatedAt` timestamps

## Cost Breakdown

**Per update (498 MEPs):**
- Sejm API calls: Free
- Firestore writes: ~$0.001
- Storage uploads: ~$0.0001 (only new images)
- GitHub Actions: Free (2000 min/month for private repos)

**Monthly (daily updates):**
- Total: **~$0.03/month**
- Well within Firebase free tier limits

## Troubleshooting

### Workflow not running
- Check if GitHub Actions is enabled for your repository
- Verify the cron schedule syntax
- Check repository permissions

### Authentication errors
- Verify `GOOGLE_APPLICATION_CREDENTIALS` secret is set correctly
- Ensure service account has Firestore and Storage permissions
- Check that the JSON key is valid

### Pipeline failures
- Check the Actions logs for detailed error messages
- Run locally to debug: `node scripts/updateMepData.js`
- Verify Sejm API is accessible

## Alternative: Local Cron Job

If you prefer running updates on your local machine:

**macOS/Linux:**
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 3 AM)
0 3 * * * cd /path/to/sejmograf2 && node scripts/updateMepData.js >> logs/update.log 2>&1
```

**Windows:**
Use Task Scheduler to run `node scripts/updateMepData.js` on a schedule.

**Note:** Your machine must be on and connected to the internet for local cron jobs to work.
