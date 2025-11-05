# Phần 2: Yêu cầu và Chuẩn bị Môi trường (Step-by-Step Guide)

## 📋 Tổng quan

Phần này hướng dẫn chi tiết từng bước để chuẩn bị và setup môi trường phát triển trên Project IDX, bao gồm troubleshooting thực tế và automation scripts.

```
┌─────────────────────────────────────────────────────────┐
│           SETUP WORKFLOW OVERVIEW                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. CHECK REQUIREMENTS  →  2. CREATE ACCOUNT            │
│     (Hardware, Network)      (Google Sign-in)            │
│            ↓                        ↓                     │
│  3. CREATE WORKSPACE    →  4. CONFIGURE NIX              │
│     (Template/GitHub)        (.idx/dev.nix)              │
│            ↓                        ↓                     │
│  5. INSTALL DEPENDENCIES  →  6. TEST & VERIFY           │
│     (npm, pip, etc.)          (Run dev server)           │
│            ↓                        ↓                     │
│  7. SETUP GIT/FIREBASE  →  8. DEPLOY & MONITOR         │
│     (Integration)              (Production)              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 2.1. Yêu cầu Hệ thống - Kiểm tra Chi tiết

### 2.1.1. Yêu cầu Phần cứng

Do Project IDX là nền tảng cloud-based, compute power chạy trên server của Google, client chỉ cần đủ để chạy browser mượt mà.

#### ✅ Yêu cầu tối thiểu:
| Component | Specification | Notes |
|-----------|--------------|-------|
| **CPU** | Dual-core 1.6 GHz+ | Intel Core i3 / AMD Ryzen 3 hoặc tương đương |
| **RAM** | 4 GB | Đủ cho 1-2 tabs Project IDX |
| **Storage** | 500 MB free | Cache browser và temp files |
| **Display** | 1280x720 pixels | Minimum resolution |
| **Input** | Keyboard + Mouse | Touchscreen optional |
| **Network** | 5 Mbps down / 1 Mbps up | Stable connection required |

#### 🚀 Yêu cầu khuyến nghị (Optimal Experience):
| Component | Specification | Benefits |
|-----------|--------------|----------|
| **CPU** | Quad-core 2.0 GHz+ | Smoother multi-tasking |
| **RAM** | 8 GB+ | Multiple tabs + browser dev tools |
| **Storage** | 1 GB+ free | More cache, faster reload |
| **Display** | 1920x1080 (Full HD) | Better code readability |
| **GPU** | Integrated graphics | WebGL preview support |
| **Network** | 25 Mbps down / 10 Mbps up | Fast sync, instant preview |

#### 🔧 Hardware Check Script (Windows/macOS/Linux)

**Windows (PowerShell):**
```powershell
# Check CPU
Write-Host "=== CPU Information ===" -ForegroundColor Green
Get-WmiObject Win32_Processor | Select-Object Name, NumberOfCores, MaxClockSpeed

# Check RAM
Write-Host "`n=== Memory Information ===" -ForegroundColor Green
$ram = Get-WmiObject Win32_PhysicalMemory | Measure-Object Capacity -Sum
$totalRAM = [math]::Round($ram.Sum / 1GB, 2)
Write-Host "Total RAM: $totalRAM GB"

# Check Disk Space
Write-Host "`n=== Disk Space ===" -ForegroundColor Green
Get-PSDrive -PSProvider FileSystem | Where-Object {$_.Free -ne $null} | 
  Select-Object Name, @{Name="Free(GB)";Expression={[math]::Round($_.Free/1GB,2)}}

# Check Network Speed (requires Speedtest CLI)
Write-Host "`n=== Network Test ===" -ForegroundColor Green
Write-Host "Run: speedtest-cli (install from: speedtest.net/apps/cli)" -ForegroundColor Yellow
```

**macOS/Linux (Bash):**
```bash
#!/bin/bash

echo "=== CPU Information ==="
if [[ "$OSTYPE" == "darwin"* ]]; then
    sysctl -n machdep.cpu.brand_string
    sysctl -n hw.ncpu
else
    lscpu | grep -E 'Model name|CPU\(s\)'
fi

echo -e "\n=== Memory Information ==="
if [[ "$OSTYPE" == "darwin"* ]]; then
    total_ram=$(sysctl -n hw.memsize)
    echo "Total RAM: $((total_ram / 1024 / 1024 / 1024)) GB"
else
    free -h | grep Mem
fi

echo -e "\n=== Disk Space ==="
df -h / | awk 'NR==2 {print "Free space: " $4}'

echo -e "\n=== Network Test ==="
echo "Install speedtest-cli: pip install speedtest-cli"
echo "Run: speedtest-cli"
```

### 2.1.2. Yêu cầu Phần mềm - Setup Browser

#### A. Browser Compatibility Matrix

| Browser | Version | Support Level | Notes |
|---------|---------|--------------|-------|
| **Chrome** | 90+ | ⭐⭐⭐⭐⭐ Full | **RECOMMENDED** - Best performance |
| **Edge (Chromium)** | 90+ | ⭐⭐⭐⭐⭐ Full | Equivalent to Chrome |
| **Firefox** | 88+ | ⭐⭐⭐⭐ Good | Some WebAssembly limitations |
| **Safari** | 14+ | ⭐⭐⭐ Basic | Limited WebGL support |
| **Opera** | 76+ | ⭐⭐⭐⭐ Good | Chromium-based |
| **Brave** | 1.25+ | ⭐⭐⭐⭐ Good | Chromium-based, privacy-focused |

#### B. Browser Setup Checklist

**Step 1: Check Browser Version**
```javascript
// Open Console (F12) and run:
console.log('Browser:', navigator.userAgent);
console.log('Version:', navigator.appVersion);

// Check critical features:
console.log('WebAssembly:', typeof WebAssembly !== 'undefined');
console.log('WebGL:', !!document.createElement('canvas').getContext('webgl'));
console.log('LocalStorage:', typeof Storage !== 'undefined');
console.log('WebSocket:', typeof WebSocket !== 'undefined');
```

**Expected Output:**
```
✅ Browser: Chrome/120.0.0.0
✅ WebAssembly: true
✅ WebGL: true
✅ LocalStorage: true
✅ WebSocket: true
```

**Step 2: Configure Browser Settings**

**Chrome/Edge Settings:**
```markdown
1. Enable JavaScript
   - Settings → Privacy and Security → Site Settings
   - JavaScript → Sites can use Javascript ✅

2. Enable Cookies
   - Settings → Privacy and Security → Cookies
   - Allow all cookies (or add exception for *.idx.google.com)

3. Allow Pop-ups (for OAuth)
   - Settings → Privacy and Security → Site Settings
   - Pop-ups and redirects → Add [*.]idx.google.com

4. Hardware Acceleration
   - Settings → System
   - Use hardware acceleration when available ✅

5. Clear Cache (if issues)
   - Settings → Privacy and Security → Clear browsing data
   - Cached images and files ✅
   - Time range: Last 7 days
```

**Firefox Settings:**
```markdown
1. about:config changes (optional, for performance)
   - webgl.force-enabled = true
   - javascript.options.wasm = true

2. Privacy & Security
   - Enhanced Tracking Protection → Standard
   - Cookies → Accept all or add exception

3. Clear Cache
   - Preferences → Privacy & Security → Clear Data
```

#### C. Required Browser Extensions (Optional but Recommended)

| Extension | Purpose | Install Link |
|-----------|---------|--------------|
| **React DevTools** | Debug React apps | [Chrome Store](https://chrome.google.com/webstore) |
| **Redux DevTools** | Debug Redux state | [Chrome Store](https://chrome.google.com/webstore) |
| **JSON Formatter** | Pretty-print JSON | [Chrome Store](https://chrome.google.com/webstore) |
| **Wappalyzer** | Detect tech stack | [Chrome Store](https://chrome.google.com/webstore) |
| **Lighthouse** | Audit performance | Built-in to Chrome DevTools |

### 2.1.3. Yêu cầu Mạng - Network Testing

#### A. Speed Test & Latency Check

**Method 1: Online Speed Test**
```markdown
1. Visit: https://fast.com (Netflix)
   OR: https://speedtest.net (Ookla)

2. Requirements:
   ✅ Download: ≥ 25 Mbps (minimum: 5 Mbps)
   ✅ Upload: ≥ 10 Mbps (minimum: 1 Mbps)
   ✅ Latency: ≤ 50ms (maximum: 150ms)

3. If below requirements:
   - Try wired connection (Ethernet)
   - Disconnect other devices
   - Contact ISP if persistent issues
```

**Method 2: Command Line Test**

**Windows (Command Prompt):**
```cmd
REM Ping test to Google servers
ping -n 10 8.8.8.8

REM Trace route to IDX
tracert idx.google.com

REM Expected:
REM Average latency: < 100ms
REM Hops: < 15
```

**macOS/Linux (Terminal):**
```bash
# Ping test
ping -c 10 8.8.8.8

# Trace route
traceroute idx.google.com

# Check open ports
nc -zv idx.google.com 443

# Expected output:
# Connection to idx.google.com port 443 [tcp/https] succeeded!
```

#### B. Firewall & Network Configuration

**Corporate Network / Firewall Rules:**

```markdown
## Domains to Whitelist

MUST ALLOW:
- *.idx.google.com         (Main IDX domain)
- *.googleapis.com         (Google APIs)
- *.firebase.google.com    (Firebase services)
- *.cloudflare.com         (CDN for assets)
- *.github.com             (Git repositories)
- *.npmjs.org              (NPM packages)
- *.pypi.org               (Python packages)

## Ports to Open

INBOUND:
- None required (client-initiated only)

OUTBOUND:
- TCP 443 (HTTPS) - REQUIRED
- TCP 80 (HTTP) - For redirects
- TCP 22 (SSH) - For Git over SSH
- TCP 9418 (Git) - For git:// protocol

## Protocol Support

MUST SUPPORT:
- HTTPS (TLS 1.2+)
- WebSocket (WSS)
- Server-Sent Events (SSE)
- HTTP/2

## Proxy Configuration (if behind corporate proxy)

Environment Variables:
export HTTP_PROXY="http://proxy.company.com:8080"
export HTTPS_PROXY="http://proxy.company.com:8080"
export NO_PROXY="localhost,127.0.0.1,.local"
```

**Test Connectivity Script:**

```bash
#!/bin/bash
# test-connectivity.sh

echo "Testing Project IDX Connectivity..."
echo "===================================="

# Test 1: Basic HTTP connectivity
echo -e "\n[1/5] Testing HTTPS connectivity..."
if curl -s -o /dev/null -w "%{http_code}" https://idx.google.com | grep -q "200\|30[0-9]"; then
    echo "✅ HTTPS connection successful"
else
    echo "❌ HTTPS connection failed"
fi

# Test 2: WebSocket support
echo -e "\n[2/5] Testing WebSocket support..."
if curl -I -H "Connection: Upgrade" -H "Upgrade: websocket" https://idx.google.com 2>&1 | grep -q "101\|426"; then
    echo "✅ WebSocket supported"
else
    echo "❌ WebSocket not supported"
fi

# Test 3: DNS resolution
echo -e "\n[3/5] Testing DNS resolution..."
if nslookup idx.google.com >/dev/null 2>&1; then
    echo "✅ DNS resolution working"
else
    echo "❌ DNS resolution failed"
fi

# Test 4: Port 443 accessibility
echo -e "\n[4/5] Testing port 443..."
if nc -zv idx.google.com 443 2>&1 | grep -q "succeeded\|open"; then
    echo "✅ Port 443 accessible"
else
    echo "❌ Port 443 blocked"
fi

# Test 5: Latency check
echo -e "\n[5/5] Testing latency..."
latency=$(ping -c 5 8.8.8.8 | tail -1 | awk -F '/' '{print $5}')
echo "Average latency: ${latency}ms"
if (( $(echo "$latency < 150" | bc -l) )); then
    echo "✅ Latency acceptable"
else
    echo "⚠️  High latency detected"
fi

echo -e "\n===================================="
echo "Connectivity test complete!"
```

### 2.1.4. Tài khoản Google - Setup & Permissions

#### A. Account Types & Requirements

**Personal Google Account (Gmail)**
```yaml
Requirements:
  - Valid Gmail address (e.g., user@gmail.com)
  - 2-Factor Authentication (HIGHLY RECOMMENDED)
  - Recovery email/phone number
  - Account age: No restrictions
  
Best For:
  - Individual developers
  - Students
  - Personal projects
  - Open source contributors
  
Limitations:
  - No enterprise SSO
  - Limited organizational features
  - Personal support only
```

**Google Workspace Account (Business/Education)**
```yaml
Requirements:
  - Domain-based email (e.g., user@company.com)
  - Managed by organization admin
  - May require IT approval
  
Features:
  - Enterprise SSO support
  - Centralized billing
  - Admin controls & policies
  - Priority support
  - Data residency options
  
Best For:
  - Companies
  - Universities
  - Government agencies
  - Large teams
```

#### B. Account Setup - Step-by-Step

**Step 1: Create/Verify Google Account**

**Option 1: Create New Gmail Account**
```markdown
1. Visit: https://accounts.google.com/signup
2. Fill required information:
   - First name
   - Last name
   - Username (email address)
   - Password (min 8 chars, mix of letters/numbers/symbols)
   
3. Verify phone number (for security)
4. Agree to Terms of Service

⏱️ Time: 5 minutes
```

**Option 2: Use Existing Account**
```markdown
1. Visit: https://myaccount.google.com
2. Verify account is active
3. Check security settings
4. Enable 2FA (strongly recommended)

⏱️ Time: 2 minutes
```

**Step 2: Enable 2-Factor Authentication (2FA)**

```markdown
Why Enable 2FA?
  ✅ Protects against account hijacking
  ✅ Required for some enterprise features
  ✅ Best practice for security
  ✅ Prevents unauthorized code access

How to Enable:
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" section
3. Click "Get Started"
4. Choose method:
   - Google Authenticator app (RECOMMENDED)
   - SMS text message
   - Voice call
   - Hardware security key (MOST SECURE)

5. Follow setup wizard
6. Save backup codes (IMPORTANT!)

⏱️ Time: 10 minutes
💡 Tip: Use Google Authenticator for best UX
```

**Step 3: Configure Account Permissions**

```markdown
Required Permissions for Project IDX:
┌─────────────────────────────────────────────┐
│ Permission                    │ Why Needed   │
├───────────────────────────────┼──────────────┤
│ ✅ Drive API                  │ File storage │
│ ✅ Cloud Resource Manager     │ GCP projects │
│ ✅ Cloud Build API            │ CI/CD        │
│ ✅ Firebase Admin SDK         │ Backend svcs │
│ ✅ Identity & Access Mgmt     │ Auth         │
│ ✅ Cloud Run Admin            │ Deployment   │
└─────────────────────────────────────────────┘

How to Grant:
1. Visit: https://idx.google.com
2. Click "Sign in"
3. Select your Google account
4. Review permissions request
5. Click "Allow" for each permission
6. Complete OAuth flow

⚠️ NOTE: You can revoke permissions anytime at:
https://myaccount.google.com/permissions
```

#### C. Account Security Best Practices

```yaml
Essential Security Steps:

1. Strong Password:
   Minimum: 12 characters
   Include: Uppercase, lowercase, numbers, symbols
   Avoid: Dictionary words, personal info
   Tool: Use password manager (1Password, LastPass)

2. Recovery Options:
   Add recovery email: ✅
   Add recovery phone: ✅
   Keep up to date: ✅

3. Security Checkup:
   URL: https://myaccount.google.com/security-checkup
   Frequency: Monthly
   Actions:
     - Review recent activity
     - Check connected devices
     - Verify third-party app access
     - Update recovery info

4. Advanced Protection (Optional):
   For high-security needs:
     - Hardware security key (YubiKey)
     - Restricted app access
     - Enhanced safe browsing
   
   How to enroll:
   https://landing.google.com/advancedprotection/

5. Session Management:
   - Sign out from public computers
   - Use "Private/Incognito" on shared devices
   - Review active sessions regularly
```

---

## 2.2. Cài đặt và Cấu hình Chi tiết

### 2.2.1. Đăng ký và Truy cập Project IDX - Complete Guide

#### Step 1: Access Project IDX

```markdown
1. Open browser (Chrome recommended)
2. Navigate to: https://idx.google.com
3. Wait for page to load (~2-3 seconds)

Expected Landing Page:
┌────────────────────────────────────────────┐
│  🏠 Project IDX                             │
│                                             │
│  Build full-stack apps with AI assistance  │
│                                             │
│  [Sign in with Google]  [Learn More]       │
│                                             │
│  ✨ Features:                               │
│  • Cloud-based IDE                         │
│  • AI-powered coding                       │
│  • Multi-framework support                 │
│                                             │
└────────────────────────────────────────────┘
```

#### Step 2: Sign In Process

```markdown
1. Click "Sign in with Google" button

2. Google OAuth Screen appears:
   ┌──────────────────────────────────┐
   │  Choose an account               │
   │                                   │
   │  ○ user@gmail.com                │
   │    (Personal)                     │
   │                                   │
   │  ○ user@company.com              │
   │    (Work)                         │
   │                                   │
   │  [Use another account]            │
   └──────────────────────────────────┘

3. Select appropriate account

4. If 2FA enabled:
   ┌──────────────────────────────────┐
   │  2-Step Verification              │
   │                                   │
   │  Enter code from:                 │
   │  Google Authenticator app         │
   │                                   │
   │  [ _ _ _ _ _ _ ]                 │
   │                                   │
   │  [Verify]    [Try another way]   │
   └──────────────────────────────────┘

5. Permissions Request Screen:
   ┌──────────────────────────────────┐
   │  Project IDX wants to:            │
   │                                   │
   │  ✓ View your email address       │
   │  ✓ Access Google Drive files     │
   │  ✓ Manage Cloud resources        │
   │  ✓ Deploy to Cloud Run           │
   │                                   │
   │  Learn more about permissions     │
   │                                   │
   │  [Cancel]  [Allow]               │
   └──────────────────────────────────┘

6. Click "Allow"

7. Wait for initialization (~5-10 seconds)
```

#### Step 3: First-Time Setup Wizard

```markdown
Welcome Screen:
┌────────────────────────────────────────────┐
│  Welcome to Project IDX! 🎉                │
│                                             │
│  Let's set up your workspace               │
│                                             │
│  [ ] I'm a student                         │
│  [ ] I'm a professional developer          │
│  [ ] I'm learning to code                  │
│  [ ] I'm a teacher/educator                │
│                                             │
│  [Next]                                     │
└────────────────────────────────────────────┘

Preferences Screen:
┌────────────────────────────────────────────┐
│  Customize your experience                 │
│                                             │
│  Editor Theme:                              │
│  ○ Light  ● Dark  ○ High Contrast          │
│                                             │
│  Tab Size:  [2] ▼                          │
│  Font Size: [14] ▼                         │
│                                             │
│  Enable AI Assistance:  ☑️                  │
│  Enable Telemetry:      ☑️                  │
│                                             │
│  [Back]  [Finish Setup]                    │
└────────────────────────────────────────────┘
```

### 2.2.2. Tạo Workspace - 3 Methods với Examples

#### Method 1: Template-Based Workspace (RECOMMENDED for beginners)

**Step 1: Browse Templates**
```markdown
1. Click "New Workspace" button
2. Select "From Template" tab

Available Templates Grid:
┌──────────────┬──────────────┬──────────────┐
│ Next.js      │ React + Vite │ Angular      │
│ ⭐⭐⭐⭐⭐     │ ⭐⭐⭐⭐⭐     │ ⭐⭐⭐⭐       │
│ 15k uses     │ 12k uses     │ 8k uses      │
└──────────────┴──────────────┴──────────────┘
┌──────────────┬──────────────┬──────────────┐
│ Flutter      │ Python Flask │ Node.js      │
│ ⭐⭐⭐⭐⭐     │ ⭐⭐⭐⭐       │ ⭐⭐⭐⭐⭐     │
│ 10k uses     │ 6k uses      │ 9k uses      │
└──────────────┴──────────────┴──────────────┘

3. Click on desired template (e.g., "Next.js")
```

**Step 2: Configure Template**
```markdown
Template Configuration Screen:
┌────────────────────────────────────────────┐
│  Configure Next.js Workspace               │
│                                             │
│  Workspace Name:                            │
│  [my-nextjs-app_____________]              │
│                                             │
│  Region (select nearest):                   │
│  [US-Central (Iowa) ▼]                     │
│                                             │
│  Template Options:                          │
│  ☑️ Include TypeScript                      │
│  ☑️ Include Tailwind CSS                    │
│  ☑️ Include ESLint                          │
│  ☐ Include Jest                            │
│  ☐ Include Storybook                       │
│                                             │
│  [Cancel]  [Create Workspace]              │
└────────────────────────────────────────────┘

4. Fill workspace name (alphanumeric + hyphens)
5. Select region closest to you for better latency
6. Check optional features
7. Click "Create Workspace"
```

**Step 3: Wait for Provisioning**
```markdown
Provisioning Progress:
┌────────────────────────────────────────────┐
│  Creating your workspace...                │
│                                             │
│  ✅ Allocating resources                    │
│  ✅ Installing Node.js 20                   │
│  ✅ Setting up Next.js 14                   │
│  ⏳ Installing dependencies (npm install)   │
│  ⏸️  Configuring development server         │
│                                             │
│  Estimated time: 2-3 minutes                │
│  Progress: ████████░░░░  65%               │
└────────────────────────────────────────────┘

5. Wait for completion
6. Workspace opens automatically
```

**What You Get:**
```yaml
Project Structure:
my-nextjs-app/
├── .idx/
│   └── dev.nix          # Environment configuration
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── public/
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md

Pre-installed:
  - Node.js 20 LTS
  - Next.js 14
  - React 18
  - TypeScript 5
  - Tailwind CSS 3
  - ESLint configured

Dev Server:
  - Automatically started
  - Hot reload enabled
  - Preview URL: https://3000-[workspace-id].idx.google.com
```

---

#### Method 2: Import from GitHub (RECOMMENDED for existing projects)

**Step 1: Authorize GitHub**
```markdown
1. Click "New Workspace"
2. Select "Import from GitHub" tab
3. Click "Connect GitHub Account"

GitHub OAuth Screen:
┌────────────────────────────────────────────┐
│  Authorize Project IDX                     │
│                                             │
│  Project IDX by Google would like to:      │
│  • Read access to code                     │
│  • Read access to metadata                 │
│  • Read and write access to pull requests │
│                                             │
│  This will also grant access to:           │
│  - All public repositories                 │
│  - Your organizations (if any)             │
│                                             │
│  [Cancel]  [Authorize Project IDX]         │
└────────────────────────────────────────────┘

4. Click "Authorize Project IDX"
5. Complete 2FA if prompted
```

**Step 2: Select Repository**
```markdown
Repository Selection Screen:
┌────────────────────────────────────────────┐
│  Import from GitHub                        │
│                                             │
│  Search:  [________________] 🔍            │
│                                             │
│  Your Repositories:                         │
│  ☐ username/portfolio-website             │
│     ↳ HTML, CSS, JavaScript                │
│     ↳ Updated 2 days ago                   │
│                                             │
│  ☐ username/react-todo-app                │
│     ↳ React, Node.js                       │
│     ↳ Updated 1 week ago                   │
│                                             │
│  ☐ username/python-api                    │
│     ↳ Python, Flask                        │
│     ↳ Updated 3 weeks ago                  │
│                                             │
│  [Load More...]                            │
└────────────────────────────────────────────┘

6. Search or scroll to find repository
7. Click on repository row to select
```

**Step 3: Configure Import**
```markdown
Import Configuration:
┌────────────────────────────────────────────┐
│  Import: username/react-todo-app           │
│                                             │
│  Branch:  [main ▼]                         │
│                                             │
│  Workspace Name:                            │
│  [react-todo-app_____________]             │
│                                             │
│  Auto-detect project type:  ☑️              │
│  Detected: React + Node.js                 │
│                                             │
│  Region:  [US-Central (Iowa) ▼]           │
│                                             │
│  ℹ️  IDX will analyze your package.json     │
│     and automatically configure the         │
│     development environment.                │
│                                             │
│  [Cancel]  [Import]                        │
└────────────────────────────────────────────┘

8. Select branch (main/master/develop)
9. Optionally rename workspace
10. Click "Import"
```

**Step 4: Auto-Configuration**
```markdown
IDX analyzes your project:
┌────────────────────────────────────────────┐
│  Analyzing project structure...            │
│                                             │
│  ✅ Found package.json                      │
│  ✅ Detected Node.js 18+ required           │
│  ✅ Detected React 18                       │
│  ✅ Found npm scripts:                      │
│     - start: react-scripts start           │
│     - build: react-scripts build           │
│     - test: react-scripts test             │
│                                             │
│  Creating .idx/dev.nix...                  │
│  Installing dependencies...                │
│                                             │
│  Progress: ████████████░░  85%             │
└────────────────────────────────────────────┘

Result: Fully configured workspace with:
  - Correct Node.js version
  - All dependencies installed
  - Dev scripts ready to run
  - Git connected to GitHub
```

---

#### Method 3: Blank Workspace (For advanced users/custom setups)

**Step 1: Create Blank Workspace**
```markdown
1. Click "New Workspace"
2. Select "Blank" tab

Blank Workspace Configuration:
┌────────────────────────────────────────────┐
│  Create Blank Workspace                    │
│                                             │
│  Workspace Name:                            │
│  [custom-project______________]            │
│                                             │
│  Primary Language:  [JavaScript ▼]         │
│  Options: JavaScript, TypeScript, Python,  │
│           Go, Rust, Java, C++, Ruby        │
│                                             │
│  Include Git:  ☑️                           │
│  Initialize README:  ☑️                     │
│                                             │
│  [Cancel]  [Create]                        │
└────────────────────────────────────────────┘

3. Fill configuration
4. Click "Create"
```

**Step 2: Manual Configuration (.idx/dev.nix)**

This is the MOST IMPORTANT file in Project IDX - it defines your entire development environment.

#### Editor Settings

```json
{
  "editor.fontSize": 14,
  "editor.fontFamily": "Fira Code, monospace",
  "editor.tabSize": 2,
  "editor.wordWrap": "on",
  "editor.minimap.enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  }
}
```

#### Theme và Appearance

1. **Chọn Theme**
   - Dark theme (default)
   - Light theme
   - High contrast theme
   - Custom themes

2. **Layout Configuration**
   - Sidebar position (left/right)
   - Panel position (bottom/right)
   - Activity bar visibility

#### Terminal Configuration

```bash
# Cấu hình default shell
"terminal.integrated.shell.linux": "/bin/bash"

# Font size
"terminal.integrated.fontSize": 13

# Cursor style
"terminal.integrated.cursorStyle": "line"
```

### 2.2.4. Cài đặt Extensions

Project IDX đi kèm nhiều extensions có sẵn, nhưng bạn có thể cài thêm:

#### Essential Extensions:

1. **ESLint**
   - Linting cho JavaScript/TypeScript
   - Auto-fix on save

2. **Prettier**
   - Code formatting
   - Consistent code style

3. **GitLens**
   - Git history và blame annotations
   - Repository insights

4. **Path Intellisense**
   - Autocomplete filenames
   - Import path suggestions

5. **Auto Rename Tag**
   - Automatically rename paired HTML/XML tags

#### Language-specific Extensions:

**Python:**
- Python (Microsoft)
- Pylance
- Python Docstring Generator

**JavaScript/TypeScript:**
- JavaScript (ES6) code snippets
- TypeScript Hero
- Import Cost

**Flutter/Dart:**
- Flutter
- Dart
- Flutter Widget Snippets

### 2.2.5. Cấu hình Git

#### Thiết lập Git Identity

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Connect to GitHub

1. Generate SSH Key:
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

2. Copy public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. Add to GitHub:
   - Go to GitHub Settings → SSH and GPG keys
   - Add new SSH key
   - Paste public key

#### Configure Git Credentials

```bash
# Use credential helper
git config --global credential.helper store

# Or use GitHub CLI
gh auth login
```

### 2.2.6. Cấu hình Firebase (Nếu cần)

#### Bước 1: Cài Firebase CLI

```bash
npm install -g firebase-tools
```

#### Bước 2: Login Firebase

```bash
firebase login
```

#### Bước 3: Initialize Firebase Project

```bash
firebase init
```

Chọn các services cần dùng:
- [ ] Hosting
- [ ] Firestore
- [ ] Functions
- [ ] Storage
- [ ] Authentication

### 2.2.7. Cấu hình Google Cloud (Nếu cần)

#### Bước 1: Enable Google Cloud APIs

```bash
gcloud init
```

#### Bước 2: Authenticate

```bash
gcloud auth login
```

#### Bước 3: Set Project

```bash
gcloud config set project YOUR_PROJECT_ID
```

---

### 2.2.3. Cấu hình Nix (.idx/dev.nix) - QUAN TRỌNG NHẤT

#### A. Giới thiệu về Nix trong Project IDX

**Nix là gì?**
```yaml
Định nghĩa:
  - Nix là package manager (trình quản lý gói) declarative (khai báo)
  - Cho phép tái tạo môi trường phát triển chính xác 100%
  - Đảm bảo consistency (tính nhất quán) giữa các developers

Tại sao IDX dùng Nix?
  ✅ Reproducibility (Khả năng tái tạo): Môi trường giống hệt nhau mọi lúc
  ✅ Isolation (Cô lập): Mỗi workspace độc lập, không conflict
  ✅ Declarative (Khai báo): Mô tả "cần gì" thay vì "làm thế nào"
  ✅ Rollback (Quay lại): Dễ dàng quay về version cũ nếu có lỗi
```

**File .idx/dev.nix:**
```nix
# File này định nghĩa TOÀN BỘ môi trường phát triển của bạn
# Mọi thứ từ:
#   - Ngôn ngữ lập trình (Node.js, Python, Go, etc.)
#   - Database (PostgreSQL, MySQL, Redis)
#   - Tools (Git, Docker, etc.)
#   - Environment variables
#   - Startup commands
#   - VS Code extensions
```

---

#### B. Cấu trúc File dev.nix - Giải thích Chi tiết

**Template Cơ bản:**

```nix
# .idx/dev.nix
{ pkgs, ... }: {
  # Phần 1: Chọn channel (kênh phát hành)
  channel = "stable-23.11";  # Stable hoặc unstable
  
  # Phần 2: Packages cần cài đặt
  packages = [
    # Liệt kê các package từ Nixpkgs
  ];
  
  # Phần 3: Services (dịch vụ chạy nền)
  services = {
    # VD: PostgreSQL, Redis, etc.
  };
  
  # Phần 4: Environment variables
  env = {
    # Biến môi trường của bạn
  };
  
  # Phần 5: IDX configuration
  idx = {
    # Extensions, workspace config, previews
  };
}
```

---

#### C. Ví dụ Thực tế theo Tech Stack

**Ví dụ 1: Full-stack Next.js + PostgreSQL + Redis**

```nix
# .idx/dev.nix - E-commerce Application
{ pkgs, ... }: {
  # Chọn phiên bản ổn định
  channel = "stable-23.11";
  
  # =================================================================
  # PACKAGES: Các công cụ và runtime cần thiết
  # =================================================================
  packages = [
    # Node.js ecosystem
    pkgs.nodejs_20      # Node.js phiên bản 20 LTS
    pkgs.corepack       # Để dùng pnpm/yarn
    
    # Database clients
    pkgs.postgresql_15  # PostgreSQL client tools (psql, pg_dump)
    
    # Development tools
    pkgs.git            # Version control
    pkgs.curl           # HTTP requests
    pkgs.jq             # JSON processing
    pkgs.htop           # Process monitoring
  ];
  
  # =================================================================
  # SERVICES: Các dịch vụ chạy trong background
  # =================================================================
  services = {
    # PostgreSQL Database
    postgres = {
      enable = true;
      package = pkgs.postgresql_15;
      
      # Extension nếu cần
      extensions = extensions: [
        extensions.postgis  # Cho geographic data (nếu cần)
      ];
      
      # Initial setup SQL
      initialScript = ''
        CREATE DATABASE ecommerce_dev;
        CREATE USER devuser WITH PASSWORD 'devpassword';
        GRANT ALL PRIVILEGES ON DATABASE ecommerce_dev TO devuser;
      '';
    };
    
    # Redis Cache (optional)
    # Uncomment nếu cần
    # redis = {
    #   enable = true;
    #   port = 6379;
    # };
  };
  
  # =================================================================
  # ENVIRONMENT VARIABLES: Biến môi trường
  # =================================================================
  env = {
    # Database connection
    DATABASE_URL = "postgresql://devuser:devpassword@localhost:5432/ecommerce_dev";
    
    # Application settings
    NODE_ENV = "development";
    NEXT_PUBLIC_API_URL = "http://localhost:3000/api";
    
    # API Keys (dùng Secret Manager trong production!)
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY = "pk_test_...";
    STRIPE_SECRET_KEY = "sk_test_...";
    
    # Email service
    SMTP_HOST = "smtp.gmail.com";
    SMTP_PORT = "587";
    
    # Redis (nếu dùng)
    # REDIS_URL = "redis://localhost:6379";
  };
  
  # =================================================================
  # IDX CONFIGURATION: Cấu hình workspace
  # =================================================================
  idx = {
    # VS Code extensions tự động cài đặt
    extensions = [
      "dbaeumer.vscode-eslint"        # ESLint
      "esbenp.prettier-vscode"        # Prettier
      "bradlc.vscode-tailwindcss"     # Tailwind CSS IntelliSense
      "prisma.prisma"                 # Prisma ORM
      "formulahendry.auto-rename-tag" # Auto rename HTML tags
      "yoavbls.pretty-ts-errors"      # Better TypeScript errors
    ];
    
    # Workspace lifecycle hooks
    workspace = {
      # Chạy KHI TẠO workspace lần đầu
      onCreate = {
        npm-install = "npm install";
        
        # Database migrations
        prisma-generate = "npx prisma generate";
        prisma-migrate = "npx prisma migrate dev --name init";
        
        # Seed initial data (optional)
        prisma-seed = "npx prisma db seed";
      };
      
      # Chạy MỖI LẦN mở workspace
      onStart = {
        # Start development server
        dev-server = "npm run dev";
      };
    };
    
    # Preview configuration (live preview)
    previews = {
      enable = true;
      previews = {
        # Web preview cho Next.js
        web = {
          command = [
            "npm"
            "run"
            "dev"
            "--"
            "--port"
            "$PORT"
            "--hostname"
            "0.0.0.0"
          ];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };
  };
}
```

**Giải thích từng phần:**

```yaml
Channel (stable-23.11):
  - "stable": Phiên bản ổn định, test kỹ
  - "23.11": NixOS release 23.11 (November 2023)
  - Alternative: "unstable" (có packages mới hơn nhưng ít stable hơn)

Packages:
  - nodejs_20: Node.js version 20 (LTS - Long Term Support)
  - corepack: Cho phép dùng pnpm hoặc yarn thay vì npm
  - postgresql_15: PostgreSQL client tools (không phải server!)
  - git, curl, jq: Development utilities

Services.postgres:
  - enable: true → Khởi động PostgreSQL server trong container
  - package: pkgs.postgresql_15 → Version 15
  - initialScript: SQL chạy lần đầu tiên khởi tạo DB

Env variables:
  - DATABASE_URL: Connection string cho Prisma ORM
  - NODE_ENV: Môi trường (development/production)
  - NEXT_PUBLIC_*: Biến exposed ra client-side trong Next.js
  - Các API keys: Lưu ý KHÔNG commit sensitive data!

Idx.workspace.onCreate:
  - Chỉ chạy 1 LẦN khi workspace được tạo
  - Install dependencies
  - Setup database schema
  - Seed initial data

Idx.workspace.onStart:
  - Chạy MỖI LẦN mở workspace
  - Start dev server
  - Background processes

Idx.previews:
  - Tự động tạo preview URL
  - Port forwarding
  - Live reload
```

---

**Ví dụ 2: Python Flask + PostgreSQL API Backend**

```nix
# .idx/dev.nix - REST API Backend
{ pkgs, ... }: {
  channel = "stable-23.11";
  
  packages = [
    # Python 3.11
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.virtualenv
    
    # PostgreSQL
    pkgs.postgresql_15
    
    # Development tools
    pkgs.git
    pkgs.curl
    pkgs.httpie  # CLI HTTP client (thay thế curl, user-friendly hơn)
  ];
  
  services = {
    postgres = {
      enable = true;
      package = pkgs.postgresql_15;
      
      initialScript = ''
        CREATE DATABASE api_dev;
        CREATE USER apiuser WITH PASSWORD 'apipassword';
        GRANT ALL PRIVILEGES ON DATABASE api_dev TO apiuser;
      '';
    };
  };
  
  env = {
    # Database
    DATABASE_URL = "postgresql://apiuser:apipassword@localhost:5432/api_dev";
    
    # Flask settings
    FLASK_APP = "app.py";
    FLASK_ENV = "development";
    FLASK_DEBUG = "1";
    
    # Python path
    PYTHONPATH = ".";
    
    # Secret key (đổi trong production!)
    SECRET_KEY = "dev-secret-key-change-in-production";
  };
  
  idx = {
    extensions = [
      "ms-python.python"              # Python extension
      "ms-python.vscode-pylance"      # Python language server
      "ms-python.debugpy"             # Python debugger
      "tamasfe.even-better-toml"      # TOML support
    ];
    
    workspace = {
      onCreate = {
        # Tạo virtual environment
        create-venv = "python -m venv venv";
        
        # Activate và install dependencies
        install-deps = ''
          source venv/bin/activate
          pip install --upgrade pip
          pip install -r requirements.txt
        '';
        
        # Database migrations (nếu dùng Alembic)
        # db-migrate = ''
        #   source venv/bin/activate
        #   alembic upgrade head
        # '';
      };
      
      onStart = {
        # Start Flask development server
        flask-run = ''
          source venv/bin/activate
          flask run --host=0.0.0.0 --port=$PORT
        '';
      };
    };
    
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["bash" "-c" "source venv/bin/activate && flask run --host=0.0.0.0 --port=$PORT"];
          manager = "web";
          env = {
            PORT = "$PORT";
            FLASK_ENV = "development";
          };
        };
      };
    };
  };
}
```

---

**Ví dụ 3: Go API + PostgreSQL**

```nix
# .idx/dev.nix - Go Microservice
{ pkgs, ... }: {
  channel = "stable-23.11";
  
  packages = [
    # Go toolchain
    pkgs.go_1_21        # Go version 1.21
    pkgs.gopls          # Go language server
    pkgs.gotools        # goimports, etc.
    pkgs.delve          # Go debugger
    
    # Database
    pkgs.postgresql_15
    
    # Tools
    pkgs.git
    pkgs.curl
    pkgs.air            # Live reload cho Go (như nodemon)
  ];
  
  services = {
    postgres = {
      enable = true;
      package = pkgs.postgresql_15;
      
      initialScript = ''
        CREATE DATABASE goapp_dev;
        CREATE USER gouser WITH PASSWORD 'gopassword';
        GRANT ALL PRIVILEGES ON DATABASE goapp_dev TO gouser;
      '';
    };
  };
  
  env = {
    # Database
    DATABASE_URL = "postgres://gouser:gopassword@localhost:5432/goapp_dev?sslmode=disable";
    
    # Go environment
    GO111MODULE = "on";
    GOPATH = "/home/user/go";
    
    # Application
    APP_ENV = "development";
    PORT = "8080";
  };
  
  idx = {
    extensions = [
      "golang.go"           # Go extension chính thức
    ];
    
    workspace = {
      onCreate = {
        # Download dependencies
        go-mod-download = "go mod download";
        
        # Install development tools
        install-air = "go install github.com/cosmtrek/air@latest";
      };
      
      onStart = {
        # Start với live reload
        air-dev = "air";  # Hoặc: go run main.go
      };
    };
    
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["air" "-port" "$PORT"];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };
  };
}
```

---

#### D. Troubleshooting Nix Configuration

**Lỗi thường gặp và cách fix:**

**1. Package không tồn tại**

```nix
# ❌ LỖI:
packages = [
  pkgs.nodejs_22  # Chưa có trong stable-23.11
];

# ✅ FIX:
# Option 1: Dùng version có sẵn
packages = [
  pkgs.nodejs_20  # Version gần nhất có sẵn
];

# Option 2: Chuyển sang unstable channel
channel = "unstable";
packages = [
  pkgs.nodejs_22  # Có trong unstable
];
```

**Cách tìm package có sẵn:**
```bash
# Search trong Nix package repository
https://search.nixos.org/packages

# Hoặc trong terminal (nếu có Nix installed local):
nix search nixpkgs nodejs
```

**2. Service không start**

```nix
# ❌ LỖI: PostgreSQL không khởi động
services = {
  postgres = {
    enable = true;
    # Thiếu package specification
  };
};

# ✅ FIX: Chỉ định rõ package
services = {
  postgres = {
    enable = true;
    package = pkgs.postgresql_15;  # Phải chỉ rõ version
  };
};
```

**Check service logs:**
```bash
# Trong IDX terminal
journalctl -u postgresql -f  # Xem logs của PostgreSQL
```

**3. Environment variables không load**

```nix
# ❌ LỖI: Quotes sai
env = {
  DATABASE_URL = 'postgresql://localhost:5432/db';  # Single quotes
};

# ✅ FIX: Dùng double quotes
env = {
  DATABASE_URL = "postgresql://localhost:5432/db";  # Double quotes
};
```

**4. onCreate scripts fail**

```nix
# ❌ LỖI: Script phức tạp không chạy
workspace = {
  onCreate = {
    setup = "npm install && npm run build && npm run migrate";  # Lỗi nếu 1 command fail
  };
};

# ✅ FIX: Tách ra từng command riêng
workspace = {
  onCreate = {
    npm-install = "npm install";
    npm-build = "npm run build";
    db-migrate = "npm run migrate";
  };
};

# Hoặc: Dùng script với error handling
workspace = {
  onCreate = {
    setup = ''
      set -e  # Exit on error
      npm install
      npm run build
      npm run migrate
    '';
  };
};
```

---

#### E. Best Practices cho Nix Configuration

```yaml
1. Version Pinning (Cố định phiên bản):
   ✅ DO: pkgs.nodejs_20      # Rõ ràng
   ❌ DON'T: pkgs.nodejs      # Không biết version nào

2. Organize Packages by Category:
   packages = [
     # Language runtimes
     pkgs.nodejs_20
     pkgs.python311
     
     # Database clients
     pkgs.postgresql_15
     
     # Dev tools
     pkgs.git
     pkgs.curl
   ];

3. Document ENV Variables:
   env = {
     # Database connection for Prisma ORM
     DATABASE_URL = "postgresql://...";
     
     # Next.js public variables (exposed to browser)
     NEXT_PUBLIC_API_URL = "http://localhost:3000";
     
     # Secret keys (CHANGE IN PRODUCTION!)
     SECRET_KEY = "dev-only-secret";
   };

4. Separate onCreate vs onStart:
   onCreate: Heavy setup (chỉ chạy 1 lần)
     - Install dependencies
     - Database migrations
     - Build initial assets
   
   onStart: Quick startup (mỗi lần mở workspace)
     - Start dev server
     - Background watch processes

5. Use Comments (Nix hỗ trợ comments!):
   # Single line comment
   /*
     Multi-line
     comment
   */
```

---

#### F. Advanced: Custom Scripts và Aliases

```nix
{ pkgs, ... }: {
  # ... packages, services, etc.
  
  idx = {
    # Custom shell aliases
    shellAliases = {
      # Git shortcuts
      gs = "git status";
      ga = "git add";
      gc = "git commit -m";
      gp = "git push";
      
      # NPM shortcuts
      nr = "npm run";
      nrd = "npm run dev";
      nrb = "npm run build";
      
      # Database shortcuts
      db-reset = "npx prisma migrate reset --force";
      db-push = "npx prisma db push";
      db-studio = "npx prisma studio";
      
      # Custom commands
      test-all = "npm run test && npm run lint && npm run type-check";
    };
    
    # Startup message
    startupMessage = ''
      🚀 Workspace ready!
      
      Available commands:
        npm run dev     - Start development server
        npm run build   - Build for production
        npm run test    - Run tests
        db-studio       - Open Prisma Studio
      
      Database: PostgreSQL running on localhost:5432
      API: http://localhost:3000
    '';
  };
}
```

---

## 2.3. Kiểm tra Môi trường

### 2.3.1. Checklist sau khi setup

- [ ] Trình duyệt được cập nhật version mới nhất
- [ ] Kết nối Internet ổn định
- [ ] Đã đăng nhập tài khoản Google
- [ ] Workspace đã được tạo
- [ ] Editor settings đã cấu hình
- [ ] Git đã được setup
- [ ] Extensions cần thiết đã cài đặt
- [ ] Firebase/GCP đã cấu hình (nếu cần)

### 2.3.2. Test Connection và Performance

#### Test 1: Network Latency
```bash
ping idx.google.com
```

#### Test 2: Run Simple Code
```javascript
console.log("Hello, Project IDX!");
```

#### Test 3: Terminal Access
```bash
echo "Terminal is working"
node --version
npm --version
```

#### Test 4: Git Connectivity
```bash
git --version
git remote -v
```

## 2.4. Troubleshooting - Xử lý Sự cố Chi tiết

### 2.4.1. Nix Build Failures (Lỗi khi build môi trường)

#### **Scenario A: Package không tìm thấy**

**Triệu chứng:**
```bash
error: attribute 'nodejs_22' missing
building '/nix/store/...'
```

**Nguyên nhân:**
- Package chưa có trong channel hiện tại (stable-23.11)
- Tên package sai chính tả
- Package đã bị deprecated

**Giải pháp bước-by-bước:**

```yaml
Bước 1: Search package trên NixOS Search
  - Truy cập: https://search.nixos.org/packages
  - Search: "nodejs"
  - Filter by channel: "23.11"
  - Kết quả: nodejs_18, nodejs_20 (KHÔNG có nodejs_22)

Bước 2: Fix trong dev.nix
  # Option 1: Dùng version có sẵn
  packages = [
    pkgs.nodejs_20  # Thay vì nodejs_22
  ];
  
  # Option 2: Upgrade channel
  channel = "unstable";  # Có nodejs_22
  packages = [
    pkgs.nodejs_22
  ];

Bước 3: Rebuild workspace
  - Click "Rebuild Environment" trong Command Palette (Ctrl+Shift+P)
  - Hoặc: Reload window (Ctrl+R)

Bước 4: Verify
  node --version  # Kiểm tra version đã đúng
```

**Prevention (Phòng tránh):**
```nix
# Luôn kiểm tra package availability trước khi add
# Best practice: Pin version rõ ràng
packages = [
  pkgs.nodejs_20        # ✅ GOOD: Version cụ thể
  # pkgs.nodejs         # ❌ BAD: Không biết version nào
];
```

---

#### **Scenario B: Service không start**

**Triệu chứng:**
```bash
# Terminal output
● postgresql.service - PostgreSQL Server
   Loaded: loaded
   Active: failed (Result: exit-code)
   
# App error
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Nguyên nhân:**
- Cấu hình Nix service sai
- Port conflict (đã có service khác dùng port 5432)
- Database initialization script lỗi

**Giải pháp bước-by-bước:**

```yaml
Bước 1: Check service status
  # Trong IDX terminal
  systemctl status postgresql
  
  # Xem logs
  journalctl -u postgresql -n 50 --no-pager

Bước 2: Check port conflicts
  # List processes listening on port 5432
  lsof -i :5432
  
  # Nếu có process khác → kill hoặc đổi port
  kill -9 <PID>

Bước 3: Fix configuration trong dev.nix
  services = {
    postgres = {
      enable = true;
      package = pkgs.postgresql_15;  # ⚠️ MUST specify package!
      
      # Check initialScript syntax
      initialScript = ''
        CREATE DATABASE mydb;
        -- Phải có semicolon (;) cuối mỗi câu lệnh!
      '';
    };
  };

Bước 4: Rebuild và restart
  # Rebuild environment
  # Sau đó restart terminal
  exit
  # Open new terminal

Bước 5: Manual start (nếu cần)
  # Start PostgreSQL manually
  pg_ctl -D $PGDATA -l logfile start
  
  # Hoặc
  systemctl restart postgresql

Bước 6: Verify connection
  # Test với psql
  psql -h localhost -p 5432 -U postgres
  
  # Trong app
  npm run db:test  # Hoặc script test connection của bạn
```

**Advanced debugging:**
```bash
# Check PostgreSQL data directory
echo $PGDATA
ls -la $PGDATA

# Check PostgreSQL logs
cat $PGDATA/log/postgresql-*.log

# Test connection với telnet
telnet localhost 5432

# Check environment variables
env | grep -i postgres
```

---

#### **Scenario C: Dependency installation lỗi (npm/pip)**

**Triệu chứng:**
```bash
# NPM error
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! Failed at the node-sass@4.14.1 postinstall script

# Pip error
ERROR: Could not find a version that satisfies the requirement package==1.2.3
```

**Nguyên nhân:**
- Native dependencies không tương thích
- Version conflict
- Network timeout
- Missing system libraries

**Giải pháp:**

**NPM Issues:**
```yaml
Bước 1: Clear caches
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install

Bước 2: Native dependencies (node-sass, bcrypt, etc.)
  # Add required system packages trong dev.nix
  packages = [
    pkgs.nodejs_20
    
    # Native build tools
    pkgs.python311       # node-gyp cần Python
    pkgs.gcc             # C++ compiler
    pkgs.gnumake         # Make
    pkgs.pkg-config      # Package config
    
    # Libraries
    pkgs.libsass         # Cho node-sass
    pkgs.vips            # Cho sharp (image processing)
  ];

Bước 3: Alternative packages
  # Thay vì node-sass → dùng sass (Dart Sass)
  npm uninstall node-sass
  npm install sass

Bước 4: Legacy peer deps (nếu version conflict)
  npm install --legacy-peer-deps
```

**Python Issues:**
```yaml
Bước 1: Virtual environment
  # Ensure venv được tạo đúng
  python -m venv venv
  source venv/bin/activate
  python --version  # Verify version

Bước 2: Upgrade pip
  pip install --upgrade pip setuptools wheel

Bước 3: Install với verbose để debug
  pip install -v package-name

Bước 4: System dependencies
  # Add vào dev.nix
  packages = [
    pkgs.python311
    pkgs.python311Packages.pip
    
    # Build dependencies
    pkgs.gcc
    pkgs.postgresql_15  # Cho psycopg2
    pkgs.libffi         # Cho cryptography
    pkgs.openssl        # Cho SSL packages
  ];

Bước 5: Precompiled wheels (nếu có)
  # Tìm wheel phù hợp với platform
  pip install --only-binary :all: package-name
```

---

### 2.4.2. Vấn đề Performance (Hiệu năng)

#### **Scenario A: IDE load chậm (>30 giây)**

**Triệu chứng:**
- Spinning loader kéo dài
- "Preparing workspace..." không kết thúc
- CPU usage cao

**Nguyên nhân:**
- Workspace quá lớn (nhiều files, node_modules)
- Extensions chạy background tasks
- Initial builds quá nặng

**Giải pháp:**

```yaml
Bước 1: Exclude large directories
  # Tạo file .idx/settings.json
  {
    "files.exclude": {
      "**/node_modules": true,
      "**/.git": true,
      "**/dist": true,
      "**/build": true,
      "**/.next": true,
      "**/coverage": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true
    },
    "files.watcherExclude": {
      "**/.git/objects/**": true,
      "**/node_modules/**": true
    }
  }

Bước 2: Optimize onCreate scripts
  # dev.nix - Chỉ chạy essential tasks
  workspace = {
    onCreate = {
      # ❌ BAD: Quá nhiều tasks
      # build = "npm run build";  # Có thể bỏ qua lúc setup
      
      # ✅ GOOD: Chỉ install dependencies
      npm-install = "npm ci";  # Faster than npm install
    };
    
    onStart = {
      # Start server only (không build)
      dev = "npm run dev";
    };
  };

Bước 3: Disable unused extensions
  # dev.nix
  idx = {
    extensions = [
      # Chỉ giữ extensions thực sự cần
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode"
      # Remove: "ms-azuretools.vscode-docker" (nếu không dùng Docker)
    ];
  };

Bước 4: Use .gitignore properly
  # .gitignore
  node_modules/
  .next/
  dist/
  build/
  coverage/
  *.log

Bước 5: Monitor resource usage
  # Trong IDX terminal
  htop  # Check CPU/memory usage
  du -sh * | sort -h  # Check folder sizes
```

**Metrics to monitor:**
```yaml
Acceptable performance:
  - Workspace open: < 10 seconds
  - File search: < 2 seconds
  - IntelliSense: < 500ms
  - Save file: < 1 second

Red flags:
  - Workspace open: > 30 seconds → Quá nhiều onCreate tasks
  - File search: > 5 seconds → Quá nhiều files, cần exclude folders
  - IntelliSense: > 2 seconds → Extension issue, try disable/reload
```

---

#### **Scenario B: Application chạy chậm trong preview**

**Triệu chứng:**
- API response > 5 seconds
- Page load chậm
- Hot reload delay

**Nguyên nhân:**
- Development build không được optimize
- Database queries chậm
- Network latency đến external APIs

**Giải pháp:**

```yaml
Bước 1: Profile application
  # Next.js
  npm run dev -- --profile
  
  # React DevTools Profiler
  # Record interactions và check render times

Bước 2: Optimize database queries
  # Check query execution time
  # PostgreSQL
  \timing on  # Enable timing trong psql
  EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@test.com';
  
  # Add indexes nếu cần
  CREATE INDEX idx_users_email ON users(email);

Bước 3: Cache external API calls
  # Example: Redis cache trong dev.nix
  services = {
    redis = {
      enable = true;
      port = 6379;
    };
  };
  
  # Trong code: Cache API responses
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFromAPI();
  await redis.setex(key, 3600, JSON.stringify(data));  # Cache 1 hour

Bước 4: Use production build locally (test performance)
  npm run build
  npm run start  # Production mode
```

---

### 2.4.3. Git Issues (Vấn đề Git)

#### **Scenario: Cannot push to GitHub**

**Triệu chứng:**
```bash
git push origin main
fatal: Authentication failed for 'https://github.com/user/repo.git/'
```

**Giải pháp chi tiết:**

```yaml
Option 1: HTTPS với Personal Access Token (Recommended)
  
  Bước 1: Tạo GitHub PAT
    - GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
    - Generate new token (classic)
    - Scopes: ✅ repo, ✅ workflow
    - Expiration: 90 days (or custom)
    - Copy token: ghp_xxxxxxxxxxxx

  Bước 2: Configure Git trong IDX
    # Set remote URL với token
    git remote set-url origin https://ghp_YOUR_TOKEN@github.com/username/repo.git
    
    # Test
    git push origin main

  Bước 3: Store credentials (optional - để không nhập lại)
    git config --global credential.helper store
    git push  # Lần đầu tiên nhập username + PAT

Option 2: SSH Keys
  
  Bước 1: Generate SSH key trong IDX
    ssh-keygen -t ed25519 -C "your_email@example.com"
    # Press Enter 3 times (default location, no passphrase for convenience)
    
  Bước 2: Copy public key
    cat ~/.ssh/id_ed25519.pub
    # Copy toàn bộ output (bắt đầu với ssh-ed25519...)
    
  Bước 3: Add to GitHub
    - GitHub Settings → SSH and GPG keys → New SSH key
    - Paste public key
    
  Bước 4: Change remote to SSH
    git remote set-url origin git@github.com:username/repo.git
    
  Bước 5: Test connection
    ssh -T git@github.com
    # Should see: "Hi username! You've successfully authenticated..."
    
    git push origin main

Option 3: GitHub CLI (gh)
  
  # Add gh CLI trong dev.nix
  packages = [
    pkgs.gh  # GitHub CLI
  ];
  
  # Authenticate
  gh auth login
  # Follow prompts (browser-based auth)
  
  # Push như bình thường
  git push origin main
```

---

### 2.4.4. Environment Variables không load

**Triệu chứng:**
```javascript
// App code
console.log(process.env.DATABASE_URL);  // undefined
console.log(process.env.API_KEY);       // undefined
```

**Nguyên nhân:**
- ENV vars chỉ định trong `dev.nix` nhưng app không access được
- Next.js: NEXT_PUBLIC_ prefix bị thiếu
- Process restart chưa pick up ENV changes

**Giải pháp:**

```yaml
Bước 1: Check ENV trong terminal
  # List all environment variables
  env | grep DATABASE
  
  # Nếu KHÔNG thấy → dev.nix chưa apply

Bước 2: Rebuild environment
  # Command Palette (Ctrl+Shift+P)
  > IDX: Rebuild Environment
  
  # Hoặc reload window
  # Ctrl+R (Cmd+R trên Mac)

Bước 3: Verify trong new terminal
  # Open new terminal tab
  echo $DATABASE_URL  # Should print value

Bước 4: Framework-specific fixes

  # Next.js: Public variables
  # dev.nix
  env = {
    # ❌ Backend only
    API_KEY = "secret";
    
    # ✅ Accessible in browser
    NEXT_PUBLIC_API_KEY = "public_key";
  };
  
  # React (Vite): VITE_ prefix
  env = {
    VITE_API_URL = "http://localhost:3000";
  };
  
  # Create React App: REACT_APP_ prefix
  env = {
    REACT_APP_API_URL = "http://localhost:3000";
  };

Bước 5: Manual .env file (fallback)
  # Nếu dev.nix không work, create .env file
  # .env
  DATABASE_URL=postgresql://...
  API_KEY=xxx
  
  # Load trong app (Node.js)
  # npm install dotenv
  require('dotenv').config();
  
  # .gitignore
  .env
```

---

### 2.4.5. Preview URL không hoạt động

**Triệu chứng:**
- Preview pane shows "Cannot connect"
- URL https://<hash>.idx.dev không load
- "Preview is not running"

**Giải pháp:**

```yaml
Bước 1: Check dev server đang chạy
  # Terminal should show
  > Local: http://localhost:3000
  > Ready in 2.3s
  
  # Nếu KHÔNG thấy → server chưa start

Bước 2: Fix preview configuration trong dev.nix
  idx = {
    previews = {
      enable = true;  # ⚠️ Must be true
      previews = {
        web = {
          command = [
            "npm"
            "run"
            "dev"
            "--"
            "--port"
            "$PORT"           # ⚠️ Must use $PORT variable
            "--hostname"
            "0.0.0.0"         # ⚠️ Must bind to 0.0.0.0 (not localhost)
          ];
          manager = "web";    # ⚠️ Must be "web"
          env = {
            PORT = "$PORT";   # ⚠️ Pass PORT to app
          };
        };
      };
    };
  };

Bước 3: App must listen on correct port and host
  # Next.js: package.json
  {
    "scripts": {
      "dev": "next dev --port $PORT --hostname 0.0.0.0"
    }
  }
  
  # Express.js
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server on ${PORT}`);
  });
  
  # Flask
  if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.getenv('PORT', 5000))

Bước 4: Restart preview
  # Click "Restart Preview" trong Preview pane
  # Hoặc stop dev server và start lại
  Ctrl+C  # Stop
  npm run dev  # Start again

Bước 5: Check firewall/security groups
  # Ensure port được expose
  # IDX tự động handle này, nhưng kiểm tra trong settings
```

---

## 2.5. Automation Scripts - Tự động hóa Workflow

### 2.5.1. Workspace Setup Automation

**Script 1: Full Stack Setup (Next.js + PostgreSQL)**

```bash
#!/bin/bash
# setup.sh - Complete workspace initialization

set -e  # Exit on error

echo "🚀 Starting workspace setup..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function: Print colored output
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 1: Check prerequisites
print_step "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Check your dev.nix configuration."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client not found. Check your dev.nix configuration."
    exit 1
fi

print_success "Prerequisites OK"

# Step 2: Install dependencies
print_step "Installing dependencies..."
npm ci  # Faster than npm install
print_success "Dependencies installed"

# Step 3: Wait for PostgreSQL to be ready
print_step "Waiting for PostgreSQL..."
timeout=30
while ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL not ready after 30s"
        exit 1
    fi
    sleep 1
done
print_success "PostgreSQL is ready"

# Step 4: Database migrations
print_step "Running database migrations..."
npx prisma migrate dev --name init
print_success "Migrations completed"

# Step 5: Generate Prisma Client
print_step "Generating Prisma Client..."
npx prisma generate
print_success "Prisma Client generated"

# Step 6: Seed database (optional)
if [ -f "prisma/seed.ts" ]; then
    print_step "Seeding database..."
    npx prisma db seed
    print_success "Database seeded"
fi

# Step 7: Build (optional - comment out for faster setup)
# print_step "Building application..."
# npm run build
# print_success "Build completed"

# Step 8: Setup Git hooks (if using Husky)
if [ -d ".husky" ]; then
    print_step "Setting up Git hooks..."
    npm run prepare  # Husky setup
    print_success "Git hooks configured"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Start development server: npm run dev"
echo "  2. Open Prisma Studio: npx prisma studio"
echo "  3. Run tests: npm test"
echo ""
```

**Thêm vào dev.nix:**
```nix
workspace = {
  onCreate = {
    setup-all = "bash setup.sh";  # Chạy script trên
  };
};
```

---

### 2.5.2. Database Management Scripts

**Script 2: Database Reset & Seed**

```bash
#!/bin/bash
# db-reset.sh - Reset database to clean state

echo "⚠️  WARNING: This will DELETE all data!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo "🗑️  Resetting database..."

# Reset database (drop all tables, re-run migrations)
npx prisma migrate reset --force --skip-seed

echo "✅ Database reset complete"

# Ask if want to seed
read -p "Seed with sample data? (yes/no): " seed_confirm

if [ "$seed_confirm" = "yes" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
    echo "✅ Seeding complete"
fi

echo ""
echo "Database is ready for development!"
```

**Script 3: Database Backup**

```bash
#!/bin/bash
# db-backup.sh - Backup PostgreSQL database

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
DB_NAME="myapp_dev"  # Your database name

mkdir -p $BACKUP_DIR

echo "📦 Creating backup..."

# Dump database
pg_dump -h localhost -U postgres -d $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "✅ Backup created: $BACKUP_DIR/backup_$TIMESTAMP.sql"

# Keep only last 5 backups
cd $BACKUP_DIR
ls -t backup_*.sql | tail -n +6 | xargs -r rm

echo "🧹 Cleaned old backups (kept last 5)"
```

---

### 2.5.3. Environment Management

**Script 4: Environment Variables Setup**

```bash
#!/bin/bash
# setup-env.sh - Interactive environment setup

echo "🔧 Environment Setup"
echo "===================="
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists"
    read -p "Overwrite? (yes/no): " overwrite
    if [ "$overwrite" != "yes" ]; then
        echo "Keeping existing .env"
        exit 0
    fi
fi

# Copy template
if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Copied .env.example to .env"
else
    touch .env
    echo "✅ Created new .env file"
fi

# Prompt for values
echo ""
echo "Enter values (press Enter to skip):"
echo ""

# Database URL
read -p "DATABASE_URL [postgresql://user:pass@localhost:5432/db]: " db_url
if [ -n "$db_url" ]; then
    echo "DATABASE_URL=$db_url" >> .env
fi

# API Keys
read -p "API_KEY (for your backend API): " api_key
if [ -n "$api_key" ]; then
    echo "API_KEY=$api_key" >> .env
fi

# Next.js public variables
read -p "NEXT_PUBLIC_API_URL [http://localhost:3000]: " api_url
api_url=${api_url:-http://localhost:3000}
echo "NEXT_PUBLIC_API_URL=$api_url" >> .env

echo ""
echo "✅ .env file configured"
echo ""
echo "⚠️  Remember: .env should be in .gitignore"

# Check gitignore
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
    echo "✅ Added .env to .gitignore"
fi
```

---

### 2.5.4. Health Check Script

**Script 5: Complete System Health Check**

```bash
#!/bin/bash
# health-check.sh - Verify all services are running

echo "🏥 System Health Check"
echo "====================="
echo ""

EXIT_CODE=0

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo "✅ $VERSION"
else
    echo "❌ Not found"
    EXIT_CODE=1
fi

# Check npm
echo -n "npm: "
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    echo "✅ v$VERSION"
else
    echo "❌ Not found"
    EXIT_CODE=1
fi

# Check PostgreSQL
echo -n "PostgreSQL: "
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    VERSION=$(psql -h localhost -U postgres -t -c "SELECT version();" | head -n 1)
    echo "✅ Ready"
else
    echo "❌ Not responding"
    EXIT_CODE=1
fi

# Check if dev server is running
echo -n "Dev Server (port 3000): "
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running"
    EXIT_CODE=1
fi

# Check database connection from app
echo -n "Database Connection: "
if command -v npx &> /dev/null && [ -f "prisma/schema.prisma" ]; then
    if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Connected"
    else
        echo "❌ Cannot connect"
        EXIT_CODE=1
    fi
else
    echo "⏭️  Skipped (no Prisma)"
fi

# Check disk space
echo -n "Disk Space: "
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo "✅ ${DISK_USAGE}% used"
else
    echo "⚠️  ${DISK_USAGE}% used (running low!)"
fi

# Check memory
echo -n "Memory: "
if command -v free &> /dev/null; then
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
    echo "✅ ${MEM_USAGE}% used"
else
    echo "⏭️  Cannot check"
fi

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All systems operational"
else
    echo "❌ Some issues detected"
fi

exit $EXIT_CODE
```

**Thêm vào package.json:**
```json
{
  "scripts": {
    "setup": "bash setup.sh",
    "db:reset": "bash db-reset.sh",
    "db:backup": "bash db-backup.sh",
    "env:setup": "bash setup-env.sh",
    "health": "bash health-check.sh"
  }
}
```

---

### 2.5.5. Git Workflow Automation

**Script 6: Feature Branch Workflow**

```bash
#!/bin/bash
# git-feature.sh - Create and setup feature branch

if [ -z "$1" ]; then
    echo "Usage: ./git-feature.sh <feature-name>"
    echo "Example: ./git-feature.sh add-user-auth"
    exit 1
fi

FEATURE_NAME=$1
BRANCH_NAME="feature/$FEATURE_NAME"

echo "🌿 Creating feature branch: $BRANCH_NAME"

# Ensure on main/master
git checkout main 2>/dev/null || git checkout master

# Pull latest changes
echo "⬇️  Pulling latest changes..."
git pull origin main 2>/dev/null || git pull origin master

# Create and checkout new branch
git checkout -b "$BRANCH_NAME"

echo "✅ Feature branch created and checked out"
echo ""
echo "Next steps:"
echo "  1. Make your changes"
echo "  2. Commit: git add . && git commit -m 'feat: $FEATURE_NAME'"
echo "  3. Push: git push origin $BRANCH_NAME"
echo "  4. Create Pull Request on GitHub"
```

---

## 2.6. Best Practices - Thực hành Tốt nhất

## 2.5. Best Practices

### 2.5.1. Workspace Organization
- Tạo workspace riêng cho mỗi project
- Đặt tên workspace rõ ràng
- Organize files theo convention

### 2.5.2. Performance Optimization
- Đóng workspaces không dùng
- Limit số lượng files mở cùng lúc
- Use .gitignore cho large files
- Disable unused extensions

### 2.5.3. Security
- Enable 2FA cho Google account
- Không share sensitive credentials
- Use environment variables
- Regular backup important work

## 2.6. Kết luận

Việc chuẩn bị môi trường đúng cách là bước quan trọng để đảm bảo trải nghiệm phát triển mượt mà trên Project IDX. Với các hướng dẫn trên, bạn đã sẵn sàng để bắt đầu phát triển ứng dụng.

---

**Ngày cập nhật**: 05/11/2025  
**Phiên bản**: 1.0
