# GitHub Repository Secrets

To enable full test suite in GitHub Actions CI, you need to add the following secrets to your repository:

## Required Secrets

### STORAGE_MONGODB_URI (Optional)
If you want to run database tests in CI, add this secret with your MongoDB connection string:

```
mongodb+srv://Vercel-Admin-dongfeng:atqNFcRNHjHQn9fO@dongfeng.ij0ylfc.mongodb.net/?retryWrites=true&w=majority
```

**Note:** Tests will gracefully skip if this is not set, so it's optional. The deployment will still work without it.

## How to Add Secrets

1. Go to your GitHub repository: https://github.com/LusnakSimon/vercel-demo
2. Click on **Settings**
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add:
   - Name: `STORAGE_MONGODB_URI`
   - Value: Your MongoDB connection string (see above)
6. Click **Add secret**

## Other Useful Secrets (Already Configured)

- `VERCEL_URL` - Base URL for smoke tests (e.g., https://researchnotebook.vercel.app)
- Vercel deployment secrets are managed through Vercel's GitHub integration

## Security Note

**Never commit secrets to your repository!** Always use environment variables and GitHub secrets for sensitive data like:
- Database connection strings
- API keys
- JWT secrets
- OAuth credentials
