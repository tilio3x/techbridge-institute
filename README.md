# 🖥️ TechBridge Institute

IT Vocational Training Platform — built with React + Vite, deployed on Azure App Service via GitHub Actions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| CI/CD | GitHub Actions |
| Hosting | Azure App Service (Node 20 LTS) |
| Runtime server | Express (static SPA server) |

---

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_ORG/techbridge-institute.git
cd techbridge-institute

# 2. Install dependencies
npm install

# 3. Start dev server (http://localhost:3000)
npm run dev

# 4. Build for production
npm run build
```

---

## 🚀 GitHub → Azure Deployment Setup

Follow these steps **once** to wire up automatic deployments.

---

### Step 1 — Create the GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `techbridge-institute`, set it to **Private**
3. Do **not** initialise with a README (you already have one)
4. Run locally:

```bash
git init
git add .
git commit -m "feat: initial TechBridge Institute platform"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/techbridge-institute.git
git push -u origin main
```

---

### Step 2 — Create the Azure App Service

#### Option A — Azure Portal (GUI)

1. Sign in to [portal.azure.com](https://portal.azure.com)
2. **Create a resource** → search **Web App**
3. Fill in:
   | Field | Value |
   |---|---|
   | **Subscription** | Your subscription |
   | **Resource Group** | `rg-techbridge` (create new) |
   | **Name** | `techbridge-institute` *(must be globally unique)* |
   | **Publish** | Code |
   | **Runtime stack** | Node 20 LTS |
   | **OS** | Linux |
   | **Region** | Closest to your users |
   | **Plan** | B1 or higher (B1 ~$13/mo) |
4. Click **Review + Create → Create**

#### Option B — Azure CLI

```bash
# Login
az login

# Create resource group
az group create --name rg-techbridge --location eastus

# Create App Service Plan (B1 = Basic tier)
az appservice plan create \
  --name plan-techbridge \
  --resource-group rg-techbridge \
  --sku B1 \
  --is-linux

# Create the Web App
az webapp create \
  --name techbridge-institute \
  --resource-group rg-techbridge \
  --plan plan-techbridge \
  --runtime "NODE:20-lts"
```

---

### Step 3 — Get the Publish Profile

1. In the Azure Portal, go to your **App Service → Overview**
2. Click **Download publish profile** (top toolbar)
3. Open the downloaded `.PublishSettings` file — copy **the entire XML content**

---

### Step 4 — Add the Secret to GitHub

1. In your GitHub repo, go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Value: paste the full XML you copied
5. Click **Add secret**

---

### Step 5 — Update the App Name in the Workflow

Open `.github/workflows/azure-deploy.yml` and update line 11:

```yaml
APP_NAME: 'techbridge-institute'   # ← must match your Azure App Service name exactly
```

Then push:

```bash
git add .github/workflows/azure-deploy.yml
git commit -m "ci: set Azure app name"
git push
```

---

### Step 6 — Watch it Deploy 🎉

1. Go to your GitHub repo → **Actions** tab
2. You'll see the **Build & Deploy to Azure App Service** workflow running
3. Once green, visit: `https://techbridge-institute.azurewebsites.net`

---

## CI/CD Flow

```
git push to main
       │
       ▼
GitHub Actions: Build job
  ├─ npm ci
  ├─ npm run build (Vite → /dist)
  └─ Upload dist/ as artifact
       │
       ▼
GitHub Actions: Deploy job
  ├─ Download dist/ artifact
  ├─ Create Express static server wrapper
  └─ azure/webapps-deploy → Azure App Service
       │
       ▼
Live at https://techbridge-institute.azurewebsites.net
```

PRs trigger the **build job only** (no deploy) so you always get build validation on pull requests.

---

## Environment Variables

Add runtime secrets in **Azure Portal → App Service → Configuration → Application settings**, or via CLI:

```bash
az webapp config appsettings set \
  --name techbridge-institute \
  --resource-group rg-techbridge \
  --settings \
    VITE_API_BASE_URL="https://api.techbridge.edu" \
    NODE_ENV="production"
```

For build-time variables (prefixed `VITE_`), add them as **GitHub Actions secrets** and reference them in the workflow's build step.

---

## Custom Domain (Optional)

```bash
# Add a custom domain
az webapp custom-hostname add \
  --webapp-name techbridge-institute \
  --resource-group rg-techbridge \
  --hostname www.techbridge.edu

# Bind a free managed TLS certificate
az webapp config ssl bind \
  --certificate-type managed \
  --name techbridge-institute \
  --resource-group rg-techbridge \
  --hostname www.techbridge.edu
```

---

## Project Structure

```
techbridge-institute/
├── .github/
│   └── workflows/
│       └── azure-deploy.yml   # CI/CD pipeline
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx               # React entry point
│   └── App.jsx                # Full application
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## Roadmap / Next Steps

- [ ] Backend API (Azure Functions + Cosmos DB)
- [ ] Microsoft Graph API — auto-provision M365 student accounts
- [ ] Azure AD B2C / Entra ID — authentication
- [ ] Moodle REST API integration
- [ ] SkillJa API integration
- [ ] Payment gateway (Stripe)
- [ ] Email notifications (Azure Communication Services)
