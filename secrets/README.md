# Secrets Directory

This directory contains sensitive credentials for the marketing analytics MCP servers.

**IMPORTANT:** All files in this directory (except `.gitignore` and `README.md`) are ignored by git.

## Required Files

### Google Analytics 4

- `ga4-service-account.json` - Service account key for GA4 Data API

**How to obtain:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable the "Google Analytics Data API"
4. Go to IAM & Admin → Service Accounts
5. Create a service account
6. Generate a JSON key and download it
7. Rename to `ga4-service-account.json` and place in this directory
8. In GA4, add the service account email to Property Access Management (Viewer role)

## Environment Variables

The following environment variables should be set in your `.env` file (NOT in this directory):

```env
# Google Analytics 4
GA4_PROPERTY_ID=123456789
GOOGLE_APPLICATION_CREDENTIALS=/secrets/ga4-service-account.json

# Meta Marketing API
META_ACCESS_TOKEN=EAAxxxxxxx...
META_AD_ACCOUNT_ID=act_123456789

# Shopify
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxx
SHOPIFY_STORE_URL=your-store.myshopify.com
```

## Docker Volume Mounting

The `ga4-service-account.json` file is mounted into Docker containers at `/secrets/ga4-service-account.json`:

```yaml
volumes:
  - ./secrets/ga4-service-account.json:/secrets/ga4-service-account.json:ro
```
