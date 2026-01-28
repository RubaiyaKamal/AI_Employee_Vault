# Let's Deploy to Oracle Cloud NOW! 🚀

**Time to Complete:** 1-2 hours
**Cost:** $0/month (Forever Free)

---

## 🎯 What You Need Before Starting

### ✅ Information to Have Ready

1. **Email Address** - For Oracle Cloud account
2. **Credit/Debit Card** - For verification only (won't be charged)
3. **GitHub Account** - To host your vault repository

### ✅ Create GitHub Repository FIRST

**Do this now before starting:**

1. Go to https://github.com/new
2. Repository name: `ai-employee-vault`
3. Visibility: **Private** (recommended for security)
4. Initialize: **No** (we'll push existing code)
5. Click "Create repository"

6. **Create Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: "AI Employee Cloud Agent"
   - Scopes: Select **"repo"** (all checkboxes)
   - Click "Generate token"
   - **COPY THE TOKEN** - You'll need it soon!
   - Save it somewhere safe (you won't see it again)

### ✅ Push Your Vault to GitHub

**Run these commands on your LOCAL machine:**

```powershell
cd "C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault"

# Initialize git if not done
git init

# Add all files
git add .

# Commit
git commit -m "Platinum Tier - Ready for cloud deployment"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ai-employee-vault.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 📋 Deployment Checklist

Print this or keep it handy:

### Phase 1: Oracle Cloud Account (15 min)
- [ ] Sign up at oracle.com/cloud/free
- [ ] Verify email
- [ ] Add payment method
- [ ] Choose home region
- [ ] Wait for account activation

### Phase 2: Create VM (10 min)
- [ ] Login to cloud.oracle.com
- [ ] Create compute instance
- [ ] Name: ai-employee-cloud
- [ ] Image: Ubuntu 22.04
- [ ] Shape: VM.Standard.E2.1.Micro (Free)
- [ ] Generate SSH key
- [ ] Assign public IP
- [ ] Note IP address: ___________________

### Phase 3: Configure Firewall (5 min)
- [ ] Add ingress rule: Port 22 (SSH)
- [ ] Add ingress rule: Port 80 (HTTP)
- [ ] Add ingress rule: Port 443 (HTTPS)
- [ ] Add ingress rule: Port 8080 (Health)

### Phase 4: Setup VM (20 min)
- [ ] SSH into VM
- [ ] Run setup script
- [ ] Configure Git credentials
- [ ] Add deploy key to GitHub
- [ ] Test SSH connection

### Phase 5: Deploy Services (15 min)
- [ ] Create .env.cloud file
- [ ] Create docker-compose.yml
- [ ] Start cloud services
- [ ] Check health endpoint

### Phase 6: Test (30 min)
- [ ] Create test task locally
- [ ] Push to GitHub
- [ ] Cloud detects and drafts
- [ ] Local pulls and approves
- [ ] Verify 24/7 operation

---

## 🚀 STEP 1: Create Oracle Cloud Account

### 1.1 Sign Up

**Open:** https://www.oracle.com/cloud/free/

Click **"Start for free"**

**Fill form:**
- Country/Territory: Choose yours
- Email: Your email
- Click "Verify my email"

**Check email and click verification link**

### 1.2 Complete Account Setup

After email verification:

- **Cloud Account Name:** `ai-employee-cloud` (or your choice)
- **Home Region:** Choose closest to you
  - 🇺🇸 US East (Ashburn) - recommended for Americas
  - 🇪🇺 Germany Central (Frankfurt) - recommended for Europe
  - 🇯🇵 Japan East (Tokyo) - recommended for Asia

  ⚠️ **IMPORTANT:** Cannot change region later!

- **First Name, Last Name:** Your name
- **Address:** Your address
- **Password:** Create strong password

Click **"Continue"**

### 1.3 Payment Verification

⚠️ **Note:** Card required but you won't be charged for free tier!

- Add credit/debit card
- Small verification charge ($1-2) - will be refunded
- Complete verification

### 1.4 Wait for Activation

- Usually 5-10 minutes
- Check email for activation notice
- Check spam folder if not received

### ✅ Done when you can login to https://cloud.oracle.com

---

## 🚀 STEP 2: Create Free Tier VM

### 2.1 Access Cloud Console

1. **Login:** https://cloud.oracle.com
2. **Click:** Infrastructure → Compute → Instances
3. **Click:** "Create Instance"

### 2.2 Configure Instance

**Name and Compartment:**
- Name: `ai-employee-cloud`
- Compartment: (root) - default

**Image:**
- Click "Change Image"
- Select: **Canonical Ubuntu**
- Version: **22.04** (or latest 22.04 LTS)
- Click "Select Image"

**Shape:**
- Click "Change Shape"
- Select: **VM.Standard.E2.1.Micro**
  - ⚠️ Must say "Always Free Eligible"
  - 1 OCPU, 1 GB Memory
- Click "Select Shape"

**Networking:**
- Keep defaults or create new VCN
- ✅ **Assign a public IPv4 address** - IMPORTANT!

**SSH Keys:**

**Generate key on Windows:**
```powershell
# In PowerShell
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\oracle-cloud-ai-employee" -C "ai-employee"

# Display public key
Get-Content "$env:USERPROFILE\.ssh\oracle-cloud-ai-employee.pub"
```

**Copy the output** (starts with `ssh-ed25519`)

In Oracle Console:
- Select "Paste public keys"
- Paste your public key
- ✅ Done

**Boot Volume:**
- Keep default (50 GB - Free tier eligible)

**Click "Create"** at bottom

### 2.3 Wait for VM

- Status: PROVISIONING → RUNNING (2-3 min)
- Once RUNNING, copy the **Public IP Address**
- Save it: `___________________`

---

## 🚀 STEP 3: Configure Firewall

### 3.1 Add Security Rules

Still in Oracle Console:

1. Click your VM name
2. Click VCN name (under Primary VNIC)
3. Click "Security Lists"
4. Click "Default Security List"
5. Click "Add Ingress Rules"

**Add these 4 rules (one at a time):**

**Rule 1: SSH**
```
Source: 0.0.0.0/0
IP Protocol: TCP
Destination Port: 22
Description: SSH access
```
Click "Add Ingress Rules"

**Rule 2: HTTP**
```
Source: 0.0.0.0/0
IP Protocol: TCP
Destination Port: 80
Description: HTTP
```
Click "Add Ingress Rules"

**Rule 3: HTTPS**
```
Source: 0.0.0.0/0
IP Protocol: TCP
Destination Port: 443
Description: HTTPS
```
Click "Add Ingress Rules"

**Rule 4: Health Dashboard**
```
Source: 0.0.0.0/0
IP Protocol: TCP
Destination Port: 8080
Description: Health Dashboard
```
Click "Add Ingress Rules"

### ✅ Verify: You should see 4 new rules listed

---

## 🚀 STEP 4: Connect and Setup

### 4.1 SSH Into VM

**On Windows PowerShell:**

```powershell
# Replace YOUR_IP with your actual IP
ssh -i "$env:USERPROFILE\.ssh\oracle-cloud-ai-employee" ubuntu@YOUR_IP
```

First time: Type `yes` to accept fingerprint

### 4.2 Create Setup Script

Once connected to the VM:

```bash
# Create script file
cat > setup.sh << 'EOF'
# Paste the entire quick-oracle-setup.sh content here
EOF

# Make executable
chmod +x setup.sh

# Run it
./setup.sh
```

**The script will ask you for:**
1. GitHub username
2. Repository name (ai-employee-vault)
3. Personal access token (the one you created earlier)

**Then it will show you a deploy key to add to GitHub**

### 4.3 Add Deploy Key to GitHub

When the script shows the deploy key:

1. Copy the entire key (starts with `ssh-ed25519`)
2. Open: https://github.com/YOUR_USERNAME/ai-employee-vault/settings/keys
3. Click "Add deploy key"
4. Title: `AI Employee Cloud Agent`
5. Paste the key
6. ✅ **Check "Allow write access"**
7. Click "Add key"
8. Return to terminal and press Enter

### ✅ Setup script will complete automatically

---

## 🚀 STEP 5: Configure Cloud Environment

### 5.1 Create .env.cloud

Still SSH'd into the VM:

```bash
nano /opt/ai-employee/.env.cloud
```

**Paste this (update with your values):**

```bash
# Cloud Agent Configuration (READ-ONLY)
AGENT_ID=cloud
AGENT_ROLE=draft_generator
NODE_ENV=production
VAULT_PATH=/opt/ai-employee/vault

# Gmail (Read-Only) - Use same credentials from local
GMAIL_CLIENT_ID=19456572897-vrrdr8f227m2ttur2c9n0sr1j3pcfbum.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=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

# Monitoring (Optional)
ADMIN_EMAIL=kh0102267@gmail.com

# Git
GIT_REMOTE=origin
GIT_BRANCH=main

# Vault Sync
VAULT_SYNC_ENABLED=true
VAULT_SYNC_INTERVAL=300000

# Watchers
GMAIL_WATCHER_ENABLED=false
FILE_DROP_WATCHER_ENABLED=true

# Work Zone
ALLOWED_OPERATIONS=read,draft,create_approval_request

# IMPORTANT: NO sending credentials!
# NO EMAIL_PASSWORD
# NO LINKEDIN secrets
# NO social media tokens
```

**Save:** Ctrl+O, Enter, Ctrl+X

### 5.2 Create docker-compose.yml

```bash
nano /opt/ai-employee/docker-compose.yml
```

**Paste this:**

```yaml
version: '3.8'

services:
  cloud-agent:
    image: node:18-alpine
    container_name: ai-employee-cloud
    restart: always
    working_dir: /app
    command: node commands/cloud-agent.js
    environment:
      - AGENT_ID=cloud
      - VAULT_PATH=/app
      - HEALTH_CHECK_PORT=8080
    volumes:
      - ./vault:/app
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:8080/health"]
      interval: 60s
      timeout: 10s
      retries: 3

  vault-sync:
    image: node:18-alpine
    container_name: ai-employee-vault-sync
    restart: always
    working_dir: /app
    command: sh -c "while true; do node scripts/sync/vault-sync.js && sleep 300; done"
    environment:
      - AGENT_ID=cloud
      - VAULT_PATH=/app
    volumes:
      - ./vault:/app
      - ~/.ssh:/root/.ssh:ro
```

**Save:** Ctrl+O, Enter, Ctrl+X

---

## 🚀 STEP 6: Start Cloud Services

```bash
cd /opt/ai-employee

# Logout and login for Docker group
exit

# SSH back in
ssh -i ~/.ssh/oracle-cloud-ai-employee ubuntu@YOUR_IP

# Start services
cd /opt/ai-employee
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### ✅ Verify Health

```bash
curl http://localhost:8080/health
```

Should see JSON response!

---

## 🎉 CONGRATULATIONS!

Your cloud agent is now running 24/7!

**Test it:**
1. Create task locally
2. Push to Git
3. Cloud pulls and processes
4. Check results!

---

**Next:** See `PLATINUM_TIER_TESTING_GUIDE.md` for comprehensive testing!
