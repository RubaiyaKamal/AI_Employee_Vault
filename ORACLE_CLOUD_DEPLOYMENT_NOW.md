# Oracle Cloud Deployment - Live Guide

**Start Time:** Now
**Estimated Duration:** 1-2 hours
**Cost:** $0/month (Free Tier Forever)

Let's get your AI Employee running 24/7 in the cloud!

---

## ⏱️ STEP 1: Create Oracle Cloud Account (15 min)

### 1.1 Sign Up

1. **Open this URL:** https://www.oracle.com/cloud/free/

2. **Click "Start for free"**

3. **Fill out the form:**
   - Country: Select your country
   - Email: Use a valid email (you'll need to verify it)
   - Click "Verify my email"

4. **Check your email:**
   - Open verification email from Oracle Cloud
   - Click the verification link

5. **Complete account setup:**
   - **Account Name:** Choose a unique name (e.g., `ai-employee-cloud`)
   - **Home Region:** Choose closest to you (CANNOT be changed later!)
     - US: US East (Ashburn) or US West (Phoenix)
     - EU: Germany Central (Frankfurt) or UK South (London)
     - Asia: Japan East (Tokyo) or South Korea Central (Seoul)

6. **Payment verification:**
   - Add credit/debit card (required but won't be charged for free tier)
   - Verify small charge ($1-2, will be refunded)
   - Complete payment verification

7. **Wait for account activation:**
   - Usually takes 5-10 minutes
   - You'll receive email when ready
   - Check spam folder if not received

### ✅ Checkpoint 1
- [ ] Oracle Cloud account created
- [ ] Email verified
- [ ] Payment method added
- [ ] Account activated

---

## ⏱️ STEP 2: Provision Free Tier VM (10 min)

### 2.1 Access Cloud Console

1. **Go to:** https://cloud.oracle.com
2. **Sign in** with your credentials
3. Click **"Infrastructure" → "Compute" → "Instances"**

### 2.2 Create Compute Instance

Click **"Create Instance"**

**Basic Information:**
- **Name:** `ai-employee-cloud`
- **Compartment:** (root) - Default compartment

**Placement:**
- **Availability domain:** Select any (usually AD-1)

**Image and shape:**

1. **Click "Change Image"**
   - Select **"Canonical Ubuntu"**
   - Version: **"22.04"** (or latest 22.04 LTS)
   - Click **"Select Image"**

2. **Click "Change Shape"**
   - Shape series: **"Ampere"** or **"AMD"**
   - Shape: **"VM.Standard.E2.1.Micro"** (Always Free Eligible)
   - OCPUs: 1
   - Memory: 1 GB
   - Click **"Select Shape"**

**Networking:**
- **Virtual cloud network:** Create new VCN (or select existing)
- **Subnet:** Create new public subnet (or select existing)
- **Public IP address:** ✅ **Assign a public IPv4 address**

**Add SSH keys:**

IMPORTANT: Generate SSH key now!

**On Windows PowerShell:**
```powershell
# Generate SSH key
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\oracle-cloud-ai-employee" -C "ai-employee-cloud"

# Display public key
Get-Content "$env:USERPROFILE\.ssh\oracle-cloud-ai-employee.pub"
```

**Copy the public key output** and:
- Select **"Paste public keys"**
- Paste your public key in the text box

**Boot volume:**
- Keep defaults (50 GB storage - Free Tier eligible)

**Click "Create"** at the bottom

### 2.3 Wait for Provisioning

- Status will change: PROVISIONING → RUNNING
- Takes about 2-3 minutes
- Once RUNNING, note down the **Public IP address**

### ✅ Checkpoint 2
- [ ] VM created successfully
- [ ] Status: RUNNING
- [ ] Public IP noted: `___________________`
- [ ] SSH key generated and saved

---

## ⏱️ STEP 3: Configure Firewall (5 min)

### 3.1 Add Security List Rules

Still in Oracle Cloud Console:

1. **Navigate to:**
   - Click the VM name → Click VCN name
   - Click **"Security Lists"**
   - Click **"Default Security List"**

2. **Click "Add Ingress Rules"** (4 times for each port)

**Rule 1: SSH**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `22`
- Description: `SSH access`
- Click **"Add Ingress Rules"**

**Rule 2: HTTP**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `80`
- Description: `HTTP`
- Click **"Add Ingress Rules"**

**Rule 3: HTTPS**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `443`
- Description: `HTTPS`
- Click **"Add Ingress Rules"**

**Rule 4: Health Dashboard**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `8080`
- Description: `Health Dashboard`
- Click **"Add Ingress Rules"**

### ✅ Checkpoint 3
- [ ] 4 ingress rules added (SSH, HTTP, HTTPS, 8080)
- [ ] All rules show as active

---

## ⏱️ STEP 4: Connect and Run Setup Script (20 min)

### 4.1 SSH Into Your VM

**On Windows PowerShell:**
```powershell
# Replace YOUR_ORACLE_IP with your actual IP
ssh -i "$env:USERPROFILE\.ssh\oracle-cloud-ai-employee" ubuntu@YOUR_ORACLE_IP
```

**First time connecting:**
- Type `yes` to accept the host fingerprint

### 4.2 Update System

```bash
# Update package list
sudo apt-get update

# Upgrade system (optional but recommended)
sudo apt-get upgrade -y
```

### 4.3 Download and Run Setup Script

```bash
# Create directory
mkdir -p /tmp/ai-employee-setup
cd /tmp/ai-employee-setup

# Download setup script (you'll need to get this from your repo)
# For now, let's create it directly
```

Let me create an optimized setup script for you:
