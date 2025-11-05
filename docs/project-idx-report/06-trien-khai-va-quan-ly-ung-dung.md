# Phần 6: Triển khai và Quản lý Ứng dụng

> **📌 Tài liệu Tham khảo Chính thức:**
> 
> Thông tin về Firebase Hosting và deployment strategies trong phần này được xác minh với:
> - **Firebase Hosting Documentation**: https://firebase.google.com/docs/hosting
> - **Firebase CLI Reference**: https://firebase.google.com/docs/cli
> - **Next.js Deployment**: https://nextjs.org/docs/deployment
> - **Vercel Platform**: https://vercel.com/docs
> - **Google Cloud Run**: https://cloud.google.com/run/docs
> 
> *Cập nhật lần cuối: November 2025*

## 📊 Tổng quan

**Triển khai (Deployment)** và **Quản lý (Management)** là giai đoạn đưa ứng dụng từ development lên production, và duy trì hoạt động ổn định. Phần này sẽ cover:

### 🎯 Mục tiêu

1. **Deploy safely** → Zero-downtime deployment strategies
2. **Monitor actively** → Track performance, errors, uptime
3. **Scale efficiently** → Auto-scaling based on traffic
4. **Rollback quickly** → Minimize impact when issues occur
5. **Maintain continuously** → Updates, patches, optimizations

### 🚀 Deployment Strategies So sánh

| Strategy | Downtime | Risk | Rollback Speed | Cost |
|----------|----------|------|----------------|------|
| **Blue-Green** | None | Low | Instant | High (2x resources) |
| **Canary** | None | Very Low | Fast | Medium |
| **Rolling** | None | Medium | Slow | Low |
| **Recreate** | Yes | High | Slow | Low |

---

## 6.1. Triển khai Ứng dụng - Deployment

### 6.1.1. Chuẩn bị Triển khai - Pre-deployment Preparation

#### 🔨 Build Optimization - Tối ưu hóa Build

**Next.js Production Build:**

```bash
# Build for production
npm run build

# Output sẽ show build stats:
# Route (pages)                                Size     First Load JS
# ┌ ○ /                                        5.2 kB        85.3 kB
# ├ ○ /about                                   2.1 kB        82.2 kB
# └ ● /products/[id] (SSG)                     3.5 kB        83.6 kB

# Analyze bundle size (cần cài @next/bundle-analyzer)
npm run analyze
```

**Package.json script cho bundle analysis:**

```json
{
  "scripts": {
    "build": "next build",
    "analyze": "ANALYZE=true next build",
    "start": "next start -p 3000"
  }
}
```

**Optimization tips:**

- ✅ **Dynamic imports**: Lazy load components không cần thiết ngay
  ```tsx
  const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <Spinner />,
  });
  ```
- ✅ **Image optimization**: Dùng `next/image` với WebP format
- ✅ **Code splitting**: Next.js tự động split theo routes
- ✅ **Tree shaking**: Remove unused code (automatic với ES modules)
- ✅ **Minification**: Automatic trong production build

---

#### 🔐 Environment Variables - Biến Môi trường

**Best practices cho environment variables:**

```env
# .env.production - KHÔNG commit file này vào Git!

# Public variables (exposed to browser) - prefix với NEXT_PUBLIC_
NEXT_PUBLIC_API_URL=https://api.production.com
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_APP_VERSION=1.2.0

# Server-only variables (không expose ra browser)
DATABASE_URL=postgresql://user:password@host:5432/production_db
REDIS_URL=redis://redis.production.com:6379
SECRET_KEY=super-secret-key-do-not-expose
STRIPE_SECRET_KEY=sk_live_...

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NEW_FEATURE=false
```

**Validate environment variables at build time:**

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Public
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  
  // Server-only
  DATABASE_URL: z.string().url(),
  SECRET_KEY: z.string().min(32),
});

// Validate và export
export const env = envSchema.parse(process.env);

// Usage: import { env } from '@/lib/env';
// env.DATABASE_URL → type-safe, validated
```

---

#### ✅ Pre-deployment Checklist - Danh sách Kiểm tra

**Checklist này PHẢI hoàn thành trước khi deploy production:**

- [ ] **All tests passing** ✅
  ```bash
  npm test -- --coverage --watchAll=false
  # Coverage >= 80%, no failing tests
  ```

- [ ] **Performance benchmarks met** 🚀
  ```bash
  npx lhci autorun
  # Lighthouse scores: Performance >= 90, A11y >= 90
  ```

- [ ] **Security audit completed** 🔒
  ```bash
  npm audit --production
  # No high/critical vulnerabilities
  
  npx snyk test
  # Snyk scan passed
  ```

- [ ] **Environment variables configured** ⚙️
  - Production API endpoints updated
  - Database connection strings correct
  - API keys/secrets rotated (không dùng dev keys!)
  - Feature flags set appropriately

- [ ] **Database migrations ready** 🗄️
  ```bash
  # Test migrations on staging first
  npm run migrate:up -- --env=staging
  
  # Prepare rollback migrations
  npm run migrate:create rollback_v1.2.0
  ```

- [ ] **Backup strategy in place** 💾
  - Database backup scheduled (automatic daily)
  - Files/assets backed up to cloud storage
  - Backup restoration tested recently

- [ ] **Rollback plan prepared** ⏪
  - Document rollback steps
  - Previous version tagged in Git
  - Database rollback scripts ready

- [ ] **Monitoring tools configured** 📊
  - Sentry error tracking enabled
  - Uptime monitoring (UptimeRobot, Pingdom)
  - Performance monitoring (New Relic, DataDog)
  - Log aggregation (Logtail, CloudWatch)

- [ ] **Documentation updated** 📝
  - CHANGELOG.md updated với release notes
  - API documentation current
  - Deployment runbook updated

---

### 6.1.2. Deployment Strategies - Chiến lược Triển khai

#### 🔵🟢 Blue-Green Deployment - Triển khai Xanh-Lục

**Blue-Green** là strategy chạy 2 environments giống hệt nhau (Blue = current, Green = new). Traffic switch instant từ Blue → Green.

**Ưu điểm:**
- ✅ Zero downtime
- ✅ Instant rollback (switch back Blue)
- ✅ Full testing trên Green trước khi switch traffic

**Nhược điểm:**
- ❌ Tốn 2x resources (phải maintain 2 environments)
- ❌ Database migrations phức tạp (phải backward compatible)

**Implementation với Docker Compose:**

```yaml
# deploy.yml - Blue-Green setup
version: '3.8'

services:
  # Blue environment - Current production (v1.0.0)
  app-blue:
    image: myapp:v1.0.0
    container_name: app-blue
    environment:
      - NODE_ENV=production
      - DEPLOYMENT_SLOT=blue
      - PORT=3000
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Green environment - New version (v1.1.0)
  app-green:
    image: myapp:v1.1.0
    container_name: app-green
    environment:
      - NODE_ENV=production
      - DEPLOYMENT_SLOT=green
      - PORT=3000
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Nginx load balancer - Switch traffic giữa Blue/Green
  nginx:
    image: nginx:alpine
    container_name: nginx-lb
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app-blue
      - app-green
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

**Nginx config cho traffic switching:**

```nginx
# nginx.conf
upstream backend {
    # Bước 1: Traffic 100% to Blue (current)
    server app-blue:3000 weight=100;
    server app-green:3000 weight=0;
    
    # Bước 2: Switch to Green (new)
    # Comment out Blue, uncomment Green:
    # server app-blue:3000 weight=0;
    # server app-green:3000 weight=100;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
```

**Deployment workflow:**

```bash
# Step 1: Deploy Green (new version)
docker-compose -f deploy.yml up -d app-green

# Step 2: Wait for Green health check
while ! curl -f http://localhost:3001/api/health; do
    echo "Waiting for Green to be healthy..."
    sleep 5
done

# Step 3: Test Green manually
curl http://app-green:3000/api/test

# Step 4: Switch traffic to Green (update nginx.conf)
# Change weight: Blue=0, Green=100
docker-compose -f deploy.yml restart nginx

# Step 5: Monitor for 10 minutes
# If OK → stop Blue
# If issues → rollback (switch back to Blue)

# Step 6a: Success - Stop Blue
docker-compose -f deploy.yml stop app-blue

# Step 6b: Rollback - Switch back to Blue
# Change weight: Blue=100, Green=0
docker-compose -f deploy.yml restart nginx
docker-compose -f deploy.yml stop app-green
```

---

#### 🐤 Canary Deployment - Triển khai Từng phần

**Canary** là strategy deploy version mới cho % nhỏ users (5-10%) trước, sau đó tăng dần nếu stable.

**Ưu điểm:**
- ✅ Giảm risk (chỉ ảnh hưởng ít users nếu có bug)
- ✅ Real-world testing với production traffic
- ✅ Gradual rollout (5% → 25% → 50% → 100%)

**Nhược điểm:**
- ❌ Phức tạp hơn setup
- ❌ Cần monitoring tốt để detect issues
- ❌ Rollout chậm hơn Blue-Green

**Implementation với Kubernetes:**

```yaml
# canary-deployment.yml

# Service - Load balancer giữa stable và canary
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp  # Match cả stable VÀ canary (dựa vào replicas để phân traffic)
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer

---
# Stable deployment - 90% traffic (9 replicas)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-stable
  labels:
    app: myapp
    version: stable
spec:
  replicas: 9  # 90% of total 10 replicas
  selector:
    matchLabels:
      app: myapp
      version: stable
  template:
    metadata:
      labels:
        app: myapp
        version: stable
    spec:
      containers:
      - name: app
        image: myapp:v1.0.0  # Current stable version
        ports:
        - containerPort: 3000
        env:
        - name: VERSION
          value: "1.0.0"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# Canary deployment - 10% traffic (1 replica)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-canary
  labels:
    app: myapp
    version: canary
spec:
  replicas: 1  # 10% of total 10 replicas
  selector:
    matchLabels:
      app: myapp
      version: canary
  template:
    metadata:
      labels:
        app: myapp
        version: canary
    spec:
      containers:
      - name: app
        image: myapp:v1.1.0  # New canary version
        ports:
        - containerPort: 3000
        env:
        - name: VERSION
          value: "1.1.0-canary"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Canary deployment workflow:**

```bash
# Step 1: Deploy canary với 10% traffic (1/10 replicas)
kubectl apply -f canary-deployment.yml

# Step 2: Monitor canary metrics trong 30 phút
# Watch error rates, response times, resource usage
kubectl logs -f -l version=canary

# Check metrics
kubectl top pods -l version=canary

# Step 3a: Success - Increase canary traffic gradually
# 10% → 25% (scale stable=7, canary=3)
kubectl scale deployment app-stable --replicas=7
kubectl scale deployment app-canary --replicas=3

# Wait 30 min, monitor

# 25% → 50% (scale stable=5, canary=5)
kubectl scale deployment app-stable --replicas=5
kubectl scale deployment app-canary --replicas=5

# Wait 30 min, monitor

# 50% → 100% (scale stable=0, canary=10)
kubectl scale deployment app-stable --replicas=0
kubectl scale deployment app-canary --replicas=10

# Step 3b: Rollback nếu có issues
kubectl scale deployment app-canary --replicas=0
kubectl scale deployment app-stable --replicas=10

# Step 4: Promote canary to stable
kubectl set image deployment/app-stable app=myapp:v1.1.0
kubectl delete deployment app-canary
```

**Monitoring canary vs stable:**

```bash
# Compare error rates
kubectl logs -l version=stable | grep ERROR | wc -l
kubectl logs -l version=canary | grep ERROR | wc -l

# Compare response times (if có metrics endpoint)
curl http://stable-pod-ip:3000/metrics | grep http_request_duration_p95
curl http://canary-pod-ip:3000/metrics | grep http_request_duration_p95

# If canary error rate > stable + 5% → ROLLBACK
```

---

### 6.1.3. Platform-Specific Deployment - Deploy theo Nền tảng

#### ▲ Vercel Deployment - Deploy lên Vercel

**Vercel** là platform deploy Next.js apps với zero-config, CI/CD tự động, global CDN.

**Bước 1: Cấu hình Vercel**

```json
// vercel.json
{
  // Build settings
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  
  // Region: sin1 (Singapore) gần Vietnam
  "regions": ["sin1"],
  
  // Environment variables (set trong Vercel Dashboard hoặc CLI)
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",  // @ = reference to secret
    "DATABASE_URL": "@database_url"
  },
  
  // Security headers
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ],
  
  // Rewrites - Proxy API requests
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://backend-api.com/:path*"
    }
  ],
  
  // Redirects
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    }
  ]
}
```

**Bước 2: Deploy commands**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod

# Deploy với specific env file
vercel --prod --env-file=.env.production

# Set environment variables via CLI
vercel env add NEXT_PUBLIC_API_URL production
# Paste value when prompted

# Pull environment variables
vercel env pull .env.local
```

**Bước 3: GitHub integration (CI/CD tự động)**

1. Connect GitHub repo trong Vercel Dashboard
2. Mỗi PR → tạo preview deployment
3. Merge to `main` → auto deploy to production
4. Deployment URL: `https://your-app.vercel.app`

**Vercel features:**

- ✅ **Automatic HTTPS**: SSL certificates tự động
- ✅ **Global CDN**: Edge functions worldwide
- ✅ **Preview deployments**: Mỗi branch/PR có URL riêng
- ✅ **Instant rollback**: 1-click rollback trong Dashboard
- ✅ **Analytics**: Web Vitals tracking built-in

---

#### 🔥 Firebase Hosting - Deploy lên Firebase

**Firebase Hosting** phù hợp cho static sites, SPAs, và Next.js exported apps.

**Bước 1: Setup Firebase**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init hosting
# Select: Use existing project → Choose your Firebase project
# Public directory: out (for Next.js static export)
# Single-page app: Yes
# GitHub Actions CI/CD: Yes (optional)
```

**Bước 2: Cấu hình Firebase**

```json
// firebase.json
{
  "hosting": {
    // Public directory (Next.js static export output)
    "public": "out",
    
    // Ignore files
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    
    // SPA routing - All routes → index.html
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    
    // Cache headers cho static assets
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|avif)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          }
        ]
      }
    ],
    
    // Redirects
    "redirects": [
      {
        "source": "/old-path",
        "destination": "/new-path",
        "type": 301
      }
    ],
    
    // Clean URLs (remove .html extension)
    "cleanUrls": true,
    
    // Trailing slash behavior
    "trailingSlash": false
  }
}
```

**Bước 3: Build và Deploy**

```bash
# Next.js: Export static site
# Update next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true, // Firebase không support next/image optimization
  },
};

# Build static export
npm run build
# Output: out/ directory

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy to specific site (nếu có multiple sites)
firebase deploy --only hosting:my-site

# Preview before deploy
firebase hosting:channel:deploy preview-branch
```

**Firebase Hosting features:**

- ✅ **Free SSL**: HTTPS automatic
- ✅ **Global CDN**: Fast worldwide
- ✅ **Version history**: Rollback previous deployments
- ✅ **Custom domains**: Add your domain easily
- ✅ **Preview channels**: Test before production

**Lưu ý:** Firebase Hosting chỉ support static sites. Nếu cần SSR/API routes → dùng Vercel hoặc Cloud Run.

---

#### 🐳 Docker + Cloud Run - Deploy lên Google Cloud Run

**Cloud Run** là serverless container platform, auto-scale từ 0 → ∞, chỉ pay khi có traffic.

**Bước 1: Create production Dockerfile**

```dockerfile
# Dockerfile.production - Multi-stage build để optimize image size

# ========== STAGE 1: Dependencies ==========
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
# --only=production: Không install devDependencies
# --frozen-lockfile: Đảm bảo exact versions từ package-lock.json
RUN npm ci --only=production --frozen-lockfile

# ========== STAGE 2: Builder ==========
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies từ stage trước
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Next.js app
# Output mode: standalone (tự động bundle all dependencies)
RUN npm run build

# ========== STAGE 3: Runner (Production) ==========
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built app từ builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "server.js"]
```

**next.config.js cho standalone output:**

```javascript
// next.config.js
module.exports = {
  output: 'standalone', // Bundle all dependencies
  compress: true,       // Gzip compression
  poweredByHeader: false, // Remove X-Powered-By header
};
```

**Bước 2: Build và Push Docker image**

```bash
# Set project ID
export PROJECT_ID=your-gcp-project-id

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Configure Docker to use gcloud credentials
gcloud auth configure-docker

# Build Docker image
docker build -f Dockerfile.production \
  -t gcr.io/$PROJECT_ID/myapp:latest \
  -t gcr.io/$PROJECT_ID/myapp:v1.2.0 \
  .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/myapp:latest
docker push gcr.io/$PROJECT_ID/myapp:v1.2.0
```

**Bước 3: Deploy to Cloud Run**

```bash
# Deploy với đầy đủ options
gcloud run deploy myapp \
  --image gcr.io/$PROJECT_ID/myapp:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --timeout 60s \
  --concurrency 80 \
  --set-env-vars "NODE_ENV=production,API_URL=https://api.example.com" \
  --set-secrets "DATABASE_URL=db-url:latest,SECRET_KEY=secret-key:latest"

# Explanation:
# --platform managed: Fully managed (không cần cluster)
# --region: Singapore region (gần Vietnam)
# --allow-unauthenticated: Public access (remove nếu cần auth)
# --memory: 512MB RAM per instance
# --cpu: 1 vCPU
# --min-instances: Always 1 instance running (no cold start)
# --max-instances: Scale up to 10 instances max
# --timeout: 60s request timeout
# --concurrency: 80 requests per instance
# --set-env-vars: Environment variables
# --set-secrets: Pull secrets từ Secret Manager
```

**Bước 4: Traffic Management (Blue-Green on Cloud Run)**

```bash
# Deploy new version WITHOUT traffic
gcloud run deploy myapp \
  --image gcr.io/$PROJECT_ID/myapp:v2.0.0 \
  --no-traffic  # Không route traffic đến version mới

# Get revision name
REVISION_NEW=$(gcloud run services describe myapp --format='value(status.latestCreatedRevisionName)')

# Test new revision via URL
# URL format: https://REVISION_NAME---SERVICE-NAME-HASH.run.app
curl https://$REVISION_NEW---myapp-abc123.a.run.app/api/health

# Gradually migrate traffic (10% to new)
gcloud run services update-traffic myapp \
  --to-revisions=$REVISION_NEW=10

# Wait 30 min, monitor metrics

# Increase to 50%
gcloud run services update-traffic myapp \
  --to-revisions=$REVISION_NEW=50

# Full cutover (100% to new)
gcloud run services update-traffic myapp \
  --to-latest

# Rollback if needed (back to previous revision)
REVISION_OLD=$(gcloud run revisions list --service=myapp --format='value(name)' --sort-by=~creationTimestamp --limit=2 | tail -1)
gcloud run services update-traffic myapp \
  --to-revisions=$REVISION_OLD=100
```

**Cloud Run Benefits:**

- ✅ **Serverless**: Không cần manage servers
- ✅ **Auto-scaling**: 0 → 1000 instances automatic
- ✅ **Pay-per-use**: Chỉ pay khi có requests
- ✅ **HTTPS automatic**: Free SSL certs
- ✅ **Global load balancing**: Multi-region deployment
- ✅ **Blue-green deployment**: Built-in traffic splitting

---

### 6.1.4. CI/CD Pipeline - Tự động hóa Deployment

#### 🚀 GitHub Actions - CI/CD tự động với GitHub

**Complete CI/CD workflow: Lint → Test → Build → Deploy**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main  # Trigger khi push to main branch
  pull_request:
    branches:
      - main  # Run tests on PRs

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE_NAME: myapp
  REGION: asia-southeast1

jobs:
  # ========== JOB 1: Lint & Test ==========
  test:
    name: Lint and Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'  # Cache npm dependencies
      
      - name: Install dependencies
        run: npm ci  # Clean install từ lock file
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run TypeScript check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm test -- --coverage --watchAll=false
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
      
      - name: Build application
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun

  # ========== JOB 2: Build & Push Docker Image ==========
  build:
    name: Build Docker Image
    needs: test  # Wait for test job to pass
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          export_default_credentials: true
      
      - name: Configure Docker to use gcloud
        run: gcloud auth configure-docker
      
      - name: Build Docker image
        run: |
          docker build -f Dockerfile.production \
            -t gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }} \
            -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
            .
      
      - name: Push Docker image
        run: |
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }}
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

  # ========== JOB 3: Deploy to Cloud Run ==========
  deploy:
    name: Deploy to Production
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }} \
            --platform managed \
            --region $REGION \
            --allow-unauthenticated \
            --memory 512Mi \
            --cpu 1 \
            --min-instances 1 \
            --max-instances 10 \
            --set-env-vars "NODE_ENV=production" \
            --set-secrets "DATABASE_URL=db-url:latest"
      
      - name: Get service URL
        id: get-url
        run: |
          URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
          echo "url=$URL" >> $GITHUB_OUTPUT
      
      - name: Smoke test deployed service
        run: |
          URL=${{ steps.get-url.outputs.url }}
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL/api/health)
          if [ $STATUS -ne 200 ]; then
            echo "Health check failed with status $STATUS"
            exit 1
          fi
      
      - name: Notify Slack on success
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              text: "🚀 Deployment successful!",
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: "*Deployment to Production*\n✅ Success\n*Service:* ${{ env.SERVICE_NAME }}\n*Version:* ${{ github.sha }}\n*URL:* ${{ steps.get-url.outputs.url }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
      
      - name: Notify Slack on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: "❌ Deployment failed for commit ${{ github.sha }}"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

**Setup GitHub Secrets:**

```bash
# GCP Service Account Key (JSON)
# Tạo service account với roles:
# - Cloud Run Admin
# - Service Account User
# - Storage Admin (for Container Registry)
GCP_SA_KEY=<service-account-key-json>

# GCP Project ID
GCP_PROJECT_ID=your-project-id

# Slack Webhook (optional, for notifications)
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx

# Codecov Token (optional, for coverage)
CODECOV_TOKEN=xxx
```

---

## 6.2. Quản lý và Bảo trì - Management & Maintenance

### 6.2.1. Monitoring và Observability - Giám sát và Quan sát

**Monitoring** là việc thu thập metrics, logs, traces để hiểu health và performance của ứng dụng.

#### 📊 Application Performance Monitoring (APM)

**Setup Sentry Performance Monitoring:**

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

export class Monitoring {
  static captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  static captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
  }

  static async trackPerformance<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      // Log performance metrics
      console.log(`[Performance] ${operationName}: ${duration}ms`);
      
      return result;
    } catch (error) {
      this.captureException(error as Error, { operationName });
      throw error;
    }
  }

  static setUser(user: { id: string; email: string; username: string }) {
    Sentry.setUser(user);
  }

  static clearUser() {
    Sentry.setUser(null);
  }
}
```

#### Health Checks

```typescript
// pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { redis } from '@/lib/redis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      api: 'unknown',
    },
  };

  // Check database
  try {
    await db.raw('SELECT 1');
    checks.services.database = 'healthy';
  } catch (error) {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check Redis
  try {
    await redis.ping();
    checks.services.redis = 'healthy';
  } catch (error) {
    checks.services.redis = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check external API
  try {
    const response = await fetch(process.env.EXTERNAL_API_URL!);
    checks.services.api = response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.services.api = 'unhealthy';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
}
```

### 6.2.2. Logging và Analytics

```typescript
// lib/analytics.ts
import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';

export class Analytics {
  static trackPageView(page: string) {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: page,
        page_title: document.title,
      });
    }
  }

  static trackEvent(eventName: string, params?: Record<string, any>) {
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  }

  static trackUserAction(action: string, category: string, label?: string) {
    this.trackEvent('user_action', {
      action,
      category,
      label,
    });
  }

  static trackError(error: Error, context?: Record<string, any>) {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }
}
```

### 6.2.3. Database Management

#### Migration System

```typescript
// migrations/001_create_users_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.string('avatar_url');
    table.boolean('email_verified').defaultTo(false);
    table.timestamps(true, true);
    table.timestamp('deleted_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
```

```bash
# Run migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:make create_products_table
```

#### Backup Strategy

```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="production_db"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/${DB_NAME}_${DATE}.sql

# Compress backup
gzip $BACKUP_DIR/${DB_NAME}_${DATE}.sql

# Upload to cloud storage
gsutil cp $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz gs://my-backups/database/

# Delete old backups (keep last 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${DB_NAME}_${DATE}.sql.gz"
```

### 6.2.4. Scaling Strategy

#### Horizontal Scaling

```yaml
# kubernetes/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Caching Strategy

```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  static async delete(key: string): Promise<void> {
    await redis.del(key);
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

---

#### 📊 Application Performance Monitoring (APM)

**Setup Sentry Performance Monitoring:**

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

export class Monitoring {
  // Capture exceptions với full context
  static captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
      level: 'error',
    });
  }

  // Capture messages (non-errors)
  static captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
  }

  // Track performance của async operations
  static async trackPerformance<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const transaction = Sentry.startTransaction({
      name: operationName,
      op: 'function',
    });

    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      const duration = Date.now() - startTime;
      transaction.setStatus('ok');
      transaction.setData('duration_ms', duration);
      
      return result;
    } catch (error) {
      transaction.setStatus('error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  // Track custom metrics
  static trackMetric(name: string, value: number, tags?: Record<string, string>) {
    Sentry.metrics.distribution(name, value, {
      tags,
      unit: 'millisecond',
    });
  }
}

// Usage examples:
// await Monitoring.trackPerformance('fetchUserData', () => fetchUser(userId));
// Monitoring.trackMetric('api_response_time', 250, { endpoint: '/api/users' });
```

**Cloud Monitoring với Google Cloud:**

```typescript
// lib/cloudMonitoring.ts
import { MetricServiceClient } from '@google-cloud/monitoring';

const client = new MetricServiceClient();
const projectId = process.env.GCP_PROJECT_ID;

export async function writeMetric(
  metricType: string,
  value: number,
  labels?: Record<string, string>
) {
  const dataPoint = {
    interval: {
      endTime: {
        seconds: Date.now() / 1000,
      },
    },
    value: {
      doubleValue: value,
    },
  };

  const timeSeriesData = {
    metric: {
      type: `custom.googleapis.com/${metricType}`,
      labels,
    },
    resource: {
      type: 'cloud_run_revision',
      labels: {
        project_id: projectId,
        service_name: process.env.K_SERVICE || 'myapp',
        revision_name: process.env.K_REVISION || 'unknown',
      },
    },
    points: [dataPoint],
  };

  const request = {
    name: client.projectPath(projectId),
    timeSeries: [timeSeriesData],
  };

  await client.createTimeSeries(request);
}
```

**Key Metrics to Monitor:**

| Category | Metric | Target | Action if Exceeded |
|----------|--------|--------|-------------------|
| **Performance** | Response time p95 | < 500ms | Optimize queries, add caching |
| | Response time p99 | < 1s | Investigate slow endpoints |
| **Availability** | Uptime | > 99.9% | Check infrastructure |
| | Error rate | < 1% | Debug and fix errors |
| **Traffic** | Requests/sec | Monitor baseline | Scale if high |
| | Concurrent users | Monitor baseline | Auto-scale |
| **Resources** | CPU usage | < 70% | Scale up instances |
| | Memory usage | < 80% | Optimize or add RAM |
| | Disk I/O | < 80% | Optimize queries |

---

#### 🚨 Alerting - Cảnh báo tự động

**Setup alerts trong Cloud Monitoring:**

```yaml
# alert-policies.yaml
displayName: "High Error Rate Alert"
conditions:
  - displayName: "Error rate > 5%"
    conditionThreshold:
      filter: |
        metric.type="run.googleapis.com/request_count"
        resource.type="cloud_run_revision"
        metric.label.response_code_class="5xx"
      comparison: COMPARISON_GT
      thresholdValue: 0.05
      duration: 300s  # 5 minutes
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE

notificationChannels:
  - projects/PROJECT_ID/notificationChannels/SLACK_CHANNEL_ID
  - projects/PROJECT_ID/notificationChannels/EMAIL_CHANNEL_ID

alertStrategy:
  autoClose: 1800s  # Auto-close after 30 min if resolved
```

**Create alert notification channels:**

```bash
# Slack channel
gcloud alpha monitoring channels create \
  --display-name="Slack Alerts" \
  --type=slack \
  --channel-labels=url=https://hooks.slack.com/services/xxx

# Email channel
gcloud alpha monitoring channels create \
  --display-name="Team Email" \
  --type=email \
  --channel-labels=email_address=team@example.com

# PagerDuty
gcloud alpha monitoring channels create \
  --display-name="PagerDuty Oncall" \
  --type=pagerduty \
  --channel-labels=service_key=xxx
```

---

### 6.2.2. Logging Strategy - Chiến lược Logging

**Structured logging cho production:**

```typescript
// lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  // Cloud Logging format (for GCP)
  formatters: {
    level: (label) => {
      return { severity: label.toUpperCase() };
    },
  },
  
  // Add context
  base: {
    environment: process.env.NODE_ENV,
    service: process.env.SERVICE_NAME || 'myapp',
    version: process.env.APP_VERSION,
  },
});

export default logger;

// Usage:
// logger.info({ userId: '123' }, 'User logged in');
// logger.error({ error, userId }, 'Payment failed');
// logger.warn({ responseTime: 2000 }, 'Slow API response');
```

**Query logs trong Cloud Logging:**

```bash
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=myapp" \
  --limit 50 \
  --format json

# Filter by severity
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 20

# Search for specific text
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'user login failed'" \
  --limit 10

# Export logs to BigQuery (for analysis)
gcloud logging sinks create my-sink \
  bigquery.googleapis.com/projects/PROJECT_ID/datasets/logs_dataset \
  --log-filter='resource.type="cloud_run_revision"'
```

---

### 6.2.3. Incident Response - Xử lý Sự cố

**Incident Response Workflow:**

```yaml
Incident Response Process:

1. Detection (Phát hiện):
   - Alert triggered (via monitoring)
   - User report
   - Health check failure
   
2. Assessment (Đánh giá):
   - Severity level (P0/P1/P2/P3)
   - Impact scope (% users affected)
   - Root cause hypothesis
   
3. Response (Phản ứng):
   - Assign incident commander
   - Create war room (Slack channel)
   - Communicate status
   - Implement fix OR rollback
   
4. Resolution (Giải quyết):
   - Verify fix deployed
   - Monitor for 30 min
   - Update stakeholders
   - Close incident
   
5. Post-mortem (Phân tích sau):
   - Write incident report (within 48h)
   - Analyze root cause
   - Document lessons learned
   - Create action items (preventive measures)
   - Schedule follow-up review
```

**Severity Levels:**

| Level | Name | Response Time | Example |
|-------|------|---------------|---------|
| **P0** | Critical | < 15 min | Site down, data loss |
| **P1** | High | < 1 hour | Major feature broken, high error rate |
| **P2** | Medium | < 4 hours | Minor feature broken, degraded performance |
| **P3** | Low | < 1 day | UI bugs, non-critical issues |

---

#### ⏪ Rollback Procedures - Quy trình Rollback

**1. Application Rollback (Cloud Run):**

```bash
# List revisions
gcloud run revisions list --service=myapp --region=asia-southeast1

# Get previous revision
PREV_REVISION=$(gcloud run revisions list \
  --service=myapp \
  --region=asia-southeast1 \
  --format='value(name)' \
  --sort-by=~creationTimestamp \
  --limit=2 | tail -1)

# Rollback to previous revision (100% traffic)
gcloud run services update-traffic myapp \
  --region=asia-southeast1 \
  --to-revisions=$PREV_REVISION=100

# Verify rollback
curl https://myapp-xyz.a.run.app/api/health
```

**2. Database Rollback:**

```bash
# Create rollback migration BEFORE deploying
# migrations/20250105120000_add_user_fields.sql (UP)
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

# migrations/20250105120000_add_user_fields_down.sql (DOWN)
ALTER TABLE users DROP COLUMN phone;

# Rollback database
npm run migrate:rollback

# Or manual rollback
psql $DATABASE_URL < migrations/20250105120000_add_user_fields_down.sql
```

**3. Feature Flag Rollback (instant):**

```typescript
// lib/featureFlags.ts
export const featureFlags = {
  NEW_CHECKOUT: process.env.FEATURE_NEW_CHECKOUT === 'true',
  AI_RECOMMENDATIONS: process.env.FEATURE_AI_RECOMMENDATIONS === 'true',
};

// Usage in component
if (featureFlags.NEW_CHECKOUT) {
  return <NewCheckoutFlow />;
} else {
  return <OldCheckoutFlow />;
}

// Rollback: Just set env var to false
// gcloud run services update myapp --set-env-vars FEATURE_NEW_CHECKOUT=false
```

**4. Restore from Backup:**

```bash
# Database backup (scheduled daily)
pg_dump $DATABASE_URL > backups/db_$(date +%Y%m%d).sql

# Restore from backup
pg_restore -d $DATABASE_URL backups/db_20250105.sql

# Files backup (Cloud Storage)
gsutil -m rsync -r gs://my-bucket/backups/20250105/ ./restore/

# Restore Redis cache
redis-cli --rdb /backups/dump_20250105.rdb
```

---

## 6.3. Update và Maintenance - Cập nhật và Bảo trì

### 6.3.1. Dependency Updates - Cập nhật Dependencies

**Regular dependency maintenance:**

```bash
# Step 1: Check outdated packages
npm outdated

# Output example:
# Package          Current  Wanted   Latest  Location
# next             13.4.0   13.5.6   14.0.0  myapp
# react            18.2.0   18.2.0   18.3.0  myapp

# Step 2: Update patch & minor versions (safe)
npm update

# Step 3: Update major versions (breaking changes)
npx npm-check-updates -u
npm install

# Step 4: Test after updates
npm test
npm run build

# Step 5: Security updates (automatic fixes)
npm audit fix

# Step 6: Manual security fixes (for breaking changes)
npm audit
# Review each vulnerability và update manually
```

**Automated dependency updates với Dependabot:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    reviewers:
      - "engineering-team"
    labels:
      - "dependencies"
    # Auto-merge minor và patch updates
    pull-request-branch-name:
      separator: "-"
    commit-message:
      prefix: "chore"
      include: "scope"
```

---

### 6.3.2. Release Management - Quản lý Releases

**Semantic Versioning (SemVer):**

```
MAJOR.MINOR.PATCH
  1  .  2  .  3

MAJOR: Breaking changes (incompatible API changes)
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)
```

**Release workflow:**

```bash
# Step 1: Create release branch
git checkout -b release/v1.2.0
git push -u origin release/v1.2.0

# Step 2: Update version
npm version minor  # or major/patch
# This updates package.json và creates git commit

# Step 3: Update CHANGELOG.md
cat >> CHANGELOG.md << EOF
## [1.2.0] - 2025-01-05

### Added
- New checkout flow with Apple Pay
- AI-powered product recommendations

### Changed
- Improved search performance by 40%
- Updated UI components to match new design system

### Fixed
- Fixed cart total calculation bug
- Fixed mobile navigation issue on iOS
EOF

# Step 4: Commit changes
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v1.2.0"

# Step 5: Create Git tag
git tag -a v1.2.0 -m "Release version 1.2.0"

# Step 6: Push tag
git push origin v1.2.0

# Step 7: Merge to main
git checkout main
git merge --no-ff release/v1.2.0
git push origin main

# Step 8: GitHub Actions auto-deploys from main

# Step 9: Create GitHub Release (with notes)
gh release create v1.2.0 \
  --title "Version 1.2.0" \
  --notes-file CHANGELOG.md
```

**Hotfix workflow (urgent fixes):**

```bash
# Hotfix from production tag
git checkout -b hotfix/v1.2.1 v1.2.0

# Make fix
# ... edit files ...

# Commit fix
git commit -am "fix: critical payment gateway bug"

# Version bump (patch)
npm version patch

# Tag hotfix
git tag -a v1.2.1 -m "Hotfix v1.2.1: payment gateway"

# Merge to main AND develop
git checkout main
git merge --no-ff hotfix/v1.2.1
git push origin main

git checkout develop
git merge --no-ff hotfix/v1.2.1
git push origin develop

# Push tag
git push origin v1.2.1

# Deploy hotfix immediately
gcloud run deploy myapp --image=gcr.io/PROJECT_ID/myapp:v1.2.1
```

---

### 6.3.3. Documentation Maintenance - Duy trì Tài liệu

**Essential documentation to maintain:**

- [ ] **README.md**: Keep up-to-date với setup instructions, env vars, commands
- [ ] **CHANGELOG.md**: Document all notable changes per release
- [ ] **API Documentation**: Update OpenAPI/Swagger specs khi API changes
- [ ] **Architecture Diagrams**: Update system architecture docs
- [ ] **Deployment Runbook**: Step-by-step deployment procedures
- [ ] **Troubleshooting Guide**: Common issues và solutions
- [ ] **Monitoring Playbook**: How to respond to alerts
- [ ] **Incident Post-mortems**: Document incidents và lessons learned

---

## 6.4. Kết luận - Conclusion

**Triển khai và Quản lý Ứng dụng** là quá trình liên tục đòi hỏi sự chuẩn bị kỹ lưỡng, automation, và monitoring chặt chẽ.

### 🎯 Key Takeaways

1. **Pre-deployment Checklist**: ✅ Tests, security, env vars, backups, rollback plan
2. **Deployment Strategies**: Blue-Green (zero downtime), Canary (gradual rollout)
3. **Platform Options**: Vercel (Next.js optimized), Firebase (static sites), Cloud Run (containers)
4. **CI/CD Pipeline**: Automate lint → test → build → deploy với GitHub Actions
5. **Monitoring**: Track performance (APM), errors (Sentry), logs (Cloud Logging)
6. **Alerting**: Set up alerts cho critical metrics (error rate, response time)
7. **Incident Response**: P0-P3 severity levels, clear response workflow
8. **Rollback**: Have rollback procedures cho app, database, feature flags
9. **Maintenance**: Regular dependency updates, release management, documentation

### 📊 Deployment Checklist Summary

**Before Deploy:**
- ✅ All tests passing (unit, integration, E2E)
- ✅ Performance benchmarks met (Lighthouse >= 90)
- ✅ Security audit clean (npm audit, Snyk)
- ✅ Env vars configured correctly
- ✅ Database migrations tested
- ✅ Backups verified
- ✅ Rollback plan documented
- ✅ Monitoring/alerts configured

**During Deploy:**
- ✅ Use Blue-Green or Canary strategy
- ✅ Monitor metrics actively
- ✅ Run smoke tests post-deploy
- ✅ Gradual traffic ramp-up
- ✅ Have team on standby

**After Deploy:**
- ✅ Monitor for 30+ minutes
- ✅ Check error rates, response times
- ✅ Verify all features working
- ✅ Update documentation
- ✅ Notify stakeholders
- ✅ Schedule post-deploy review

---

**Tiếp theo**: [Phần 7: Bảo mật và Quyền riêng tư →](./07-bao-mat-va-quyen-rieng-tu.md)

**Ngày cập nhật**: 05/11/2025  
**Phiên bản**: 2.0
