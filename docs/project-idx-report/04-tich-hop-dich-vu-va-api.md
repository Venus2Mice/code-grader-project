# Phần 4: Tích hợp Dịch vụ và API

> **📌 Tài liệu Tham khảo Chính thức:**
> 
> Tất cả thông tin về Firebase services trong phần này được xác minh với tài liệu chính thức:
> - **Firebase Documentation**: https://firebase.google.com/docs
> - **Firebase Authentication**: https://firebase.google.com/docs/auth
> - **Cloud Firestore**: https://firebase.google.com/docs/firestore
> - **Cloud Storage for Firebase**: https://firebase.google.com/docs/storage
> - **Firebase Hosting**: https://firebase.google.com/docs/hosting
> 
> *Cập nhật lần cuối: November 2025*

## 📋 Tổng quan Tích hợp Dịch vụ

Phần này hướng dẫn chi tiết cách tích hợp các dịch vụ bên ngoài vào ứng dụng Project IDX, bao gồm:

```
┌─────────────────────────────────────────────────────────────────┐
│              SERVICE INTEGRATION ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Frontend App (Next.js/React)]                                  │
│           │                                                       │
│           ├──→ Firebase Services                                 │
│           │    ├─ Authentication (Auth)                          │
│           │    ├─ Firestore (NoSQL Database)                     │
│           │    ├─ Storage (File Upload)                          │
│           │    └─ Functions (Serverless)                         │
│           │                                                       │
│           ├──→ Google Cloud Platform                             │
│           │    ├─ Cloud Run (Container Hosting)                  │
│           │    ├─ Cloud SQL (PostgreSQL)                         │
│           │    └─ Cloud Build (CI/CD)                            │
│           │                                                       │
│           ├──→ External APIs                                     │
│           │    ├─ REST APIs (fetch/axios)                        │
│           │    ├─ GraphQL (Apollo Client)                        │
│           │    └─ WebSocket (Real-time)                          │
│           │                                                       │
│           └──→ Third-party Services                              │
│                ├─ Stripe (Payment)                               │
│                ├─ SendGrid (Email)                               │
│                └─ Cloudinary (Media)                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Mục tiêu của phần này:**
- ✅ Hiểu rõ cách Firebase hoạt động và integrate vào app
- ✅ Setup GCP services cho production deployment
- ✅ Implement REST API calls với error handling đúng cách
- ✅ Tích hợp GraphQL cho data fetching hiệu quả
- ✅ Xây dựng real-time features với WebSocket
- ✅ Xử lý lỗi và retry logic professional

---

## 4.1. Tích hợp Firebase - Backend-as-a-Service

### 🔍 Firebase là gì?

Firebase là **Backend-as-a-Service (BaaS)** platform của Google, cung cấp:

> **Theo Firebase Official Documentation:**
> "Firebase là nền tảng phát triển ứng dụng của Google giúp bạn xây dựng và phát triển ứng dụng và trò chơi mà người dùng yêu thích. Được hơn 3 triệu ứng dụng tin cậy, Firebase được hỗ trợ bởi Google và được các tổ chức khởi nghiệp cũng như doanh nghiệp toàn cầu tin tưởng."
> 
> *Nguồn: https://firebase.google.com/docs*

```yaml
Firebase Services:
  Authentication:
    - Quản lý user accounts (email/password, social login)
    - Session management tự động
    - Multi-factor authentication (MFA)
    - Token-based security
    - Hỗ trợ: Email/Password, Google, Facebook, Twitter, GitHub, Apple, Phone
    - FirebaseUI: Drop-in authentication solution
    
  Firestore:
    - NoSQL cloud database
    - Real-time synchronization
    - Offline support với cache
    - Automatic scaling (lên đến exabyte)
    - Hierarchical data structure (documents & collections)
    - Expressive queries with filtering and sorting
    - MongoDB API compatibility (Enterprise edition)
    
  Storage:
    - File/image upload to cloud (Google Cloud Storage)
    - CDN delivery tự động
    - Access control với Security Rules  
    - Image resizing (với Extensions)
    - Robust uploads/downloads (resume from network interruptions)
    - Scales to exabytes
    
  Functions:
    - Serverless backend code
    - Event-driven (triggered by Firestore changes, Auth events, HTTP requests)
    - Auto-scaling
    - Pay per execution

Tại sao dùng Firebase?
  ✅ No backend code needed → Focus vào frontend
  ✅ Real-time capabilities → Instant updates
  ✅ Free tier hào phóng → Good cho development/small apps
  ✅ Scales tự động → No infrastructure management
  ✅ Tight integration với Google Cloud → Easy to upgrade
  ✅ Firebase Studio integration → AI-powered development workflow
```

---

### 4.1.1. Firebase Authentication - Quản lý Đăng nhập

#### A. Setup Firebase Project (Chi tiết từng bước)

**Bước 1: Tạo Firebase Project**

```yaml
Hướng dẫn:
  1. Truy cập Firebase Console:
     URL: https://console.firebase.google.com
     
  2. Click "Add project" (hoặc "Create a project"):
     - Hiển thị form tạo project mới
     
  3. Nhập thông tin project:
     Project name: "my-ecommerce-app" (ví dụ)
     → Firebase tự generate Project ID: "my-ecommerce-app-abc123"
     
  4. Google Analytics (Optional):
     ☑️ Enable Google Analytics for this project
     → Chọn: Create a new account hoặc Use existing account
     → Analytics location: Vietnam
     
  5. Accept terms và click "Create project":
     → Quá trình tạo: ~30 giây
     → Redirect đến Project Dashboard

Lưu ý:
  - Project ID không thể đổi sau khi tạo
  - Free plan: Spark (không cần credit card)
  - Có thể upgrade lên Blaze plan (pay-as-you-go) sau
```

**Bước 2: Đăng ký App với Firebase**

```yaml
Trong Firebase Console Dashboard:

1. Click icon "Web" (</>) để add web app:
   Location: Dashboard → Project Overview → Add app → Web
   
2. Điền thông tin app:
   App nickname: "E-commerce Web App"
   ☑️ Also set up Firebase Hosting (optional - nếu muốn host trên Firebase)
   
3. Click "Register app":
   → Firebase generate configuration object
   
4. Copy Firebase Config:
   Hiển thị config object như sau:
```

```javascript
// Firebase sẽ cung cấp config này
const firebaseConfig = {
  apiKey: "AIzaSyDOCAbC123dEf456GhI789jKl012-MnO3P",
  authDomain: "my-ecommerce-app.firebaseapp.com",
  projectId: "my-ecommerce-app",
  storageBucket: "my-ecommerce-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl",
  measurementId: "G-ABCD123456"
};
```

```yaml
5. Lưu config này vào .env.local (Next.js):
```

```bash
# .env.local - Local development environment
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDOCAbC123dEf456GhI789jKl012-MnO3P
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-ecommerce-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-ecommerce-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-ecommerce-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789jkl
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCD123456
```

```yaml
Lưu ý quan trọng:
  - Prefix NEXT_PUBLIC_ → Exposed ra browser (frontend có thể access)
  - apiKey KHÔNG phải secret → OK để public (Firebase có Security Rules protect data)
  - Nên gitignore .env.local → Không commit secrets lên GitHub
```

**Bước 3: Install Firebase SDK**

```bash
# Install Firebase SDK
npm install firebase

# Hoặc với yarn
yarn add firebase

# Hoặc với pnpm (recommended cho monorepos)
pnpm add firebase
```

```yaml
Package information:
  - firebase: ^10.7.0 (latest stable tại thời điểm này)
  - Size: ~500KB (tree-shakeable - chỉ bundle services bạn dùng)
  - Hỗ trợ: CommonJS, ESM, TypeScript
```

---

#### B. Initialize Firebase trong App

**Bước 4: Tạo Firebase initialization file**

**Bước 4: Tạo Firebase initialization file**

```typescript
// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration từ environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;

if (!getApps().length) {
  // Chỉ initialize một lần
  app = initializeApp(firebaseConfig);
} else {
  // Reuse existing app instance
  app = getApps()[0];
}

// Initialize các services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Analytics chỉ chạy client-side (browser only)
export const analytics: Analytics | null = 
  typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
```

**Giải thích code trên:**

```yaml
initializeApp():
  - Khởi tạo Firebase app với config
  - Phải gọi TRƯỚC khi dùng bất kỳ Firebase service nào
  - Singleton pattern: Chỉ init 1 lần

getApps():
  - Check xem đã có Firebase app nào được init chưa
  - Tránh "Firebase app already exists" error
  - Quan trọng với Hot Module Replacement (HMR) trong development

getAuth(app):
  - Service quản lý authentication
  - Handle login, logout, user state
  - Return Auth instance

getFirestore(app):
  - NoSQL database service
  - Real-time data sync
  - Return Firestore instance

getStorage(app):
  - File storage service (images, videos, documents)
  - CDN-backed
  - Return Storage instance

getAnalytics(app):
  - User analytics và tracking
  - CHỈ chạy trên browser (typeof window check)
  - Server-side rendering (SSR) không có window object
  
Environment variables:
  - process.env.NEXT_PUBLIC_* → Accessible cả client và server
  - Không có NEXT_PUBLIC_ prefix → Chỉ server-side
```

**Bước 5: Enable Authentication Methods trong Firebase Console**

```yaml
Trong Firebase Console:

1. Sidebar → Build → Authentication:
   Click "Get started"
   
2. Tab "Sign-in method":
   Hiển thị list các authentication providers
   
3. Enable Email/Password:
   - Click "Email/Password"
   - Toggle "Enable" → ON
   - Toggle "Email link (passwordless sign-in)" → OFF (tùy chọn)
   - Save
   
4. Enable Google Sign-in:
   - Click "Google"
   - Toggle "Enable" → ON
   - Project support email: your-email@gmail.com
   - Save
   
5. Enable Facebook (optional):
   - Click "Facebook"
   - Cần: App ID và App Secret từ Facebook Developers
   - Setup OAuth redirect URL trong Facebook app settings
   - Save

⚠️ Lưu ý:
  - Mỗi method cần enable riêng
  - Social login cần setup OAuth credentials
  - Production: Cần verify domain trong Console
```

---

#### C. Implement Authentication Logic

**1. Email/Password Authentication - Chi tiết**

```typescript
// services/authService.ts
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const authService = {
  /**
   * SIGN UP - Đăng ký user mới
   * 
   * Flow:
   * 1. Validate email format và password strength
   * 2. Create user trong Firebase Auth
   * 3. Update display name
   * 4. Send verification email
   * 5. Return user object
   */
  signUp: async (
    email: string, 
    password: string, 
    displayName: string
  ): Promise<User> => {
    try {
      // Create user account
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      const user = userCredential.user;
      
      // Update profile với display name
      await updateProfile(user, {
        displayName: displayName,
        // photoURL: 'https://example.com/avatar.jpg' (optional)
      });
      
      // Send email verification
      await sendEmailVerification(user);
      
      console.log('✅ User created:', user.uid);
      return user;
      
    } catch (error: any) {
      console.error('❌ Sign up error:', error.code, error.message);
      
      // Handle specific errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email đã được sử dụng');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email không hợp lệ');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Mật khẩu quá yếu (tối thiểu 6 ký tự)');
      }
      
      throw error;
    }
  },

  /**
   * SIGN IN - Đăng nhập
   * 
   * Flow:
   * 1. Validate credentials
   * 2. Sign in với Firebase
   * 3. Firebase tự động lưu session (persistent)
   * 4. Return user object
   */
  signIn: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      console.log('✅ Sign in successful:', userCredential.user.email);
      return userCredential.user;
      
    } catch (error: any) {
      console.error('❌ Sign in error:', error.code);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('Tài khoản không tồn tại');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Mật khẩu không đúng');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Quá nhiều lần thử. Vui lòng thử lại sau');
      }
      
      throw error;
    }
  },

  /**
   * SIGN OUT - Đăng xuất
   * 
   * Flow:
   * 1. Clear Firebase session
   * 2. Clear local auth state
   * 3. Redirect to login page (optional - handle ở component)
   */
  signOut: async (): Promise<void> => {
    try {
      await signOut(auth);
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  },

  /**
   * RESET PASSWORD - Quên mật khẩu
   * 
   * Flow:
   * 1. Send email với reset link
   * 2. User click link → redirect to Firebase-hosted page
   * 3. User nhập password mới
   * 4. Redirect về app
   */
  resetPassword: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent to:', email);
    } catch (error: any) {
      console.error('❌ Reset password error:', error.code);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('Email không tồn tại trong hệ thống');
      }
      
      throw error;
    }
  },

  /**
   * GET CURRENT USER - Lấy thông tin user hiện tại
   * 
   * Returns:
   * - User object nếu đã đăng nhập
   * - null nếu chưa đăng nhập
   */
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },
  
  /**
   * OBSERVE AUTH STATE - Lắng nghe thay đổi trạng thái đăng nhập
   * 
   * Use case: Tự động redirect khi user login/logout
   */
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return auth.onAuthStateChanged(callback);
  }
};
```

**Giải thích Error Codes:**

```yaml
Common Firebase Auth Error Codes:

auth/email-already-in-use:
  - Email đã được đăng ký
  - Solution: Suggest "Forgot password?" hoặc "Sign in instead"

auth/invalid-email:
  - Email format không hợp lệ
  - Solution: Validate email với regex trước khi gửi

auth/weak-password:
  - Password < 6 characters
  - Solution: Enforce password rules (8+ chars, uppercase, number, special)

auth/user-not-found:
  - Không tìm thấy account với email này
  - Solution: Suggest "Sign up"

auth/wrong-password:
  - Password không đúng
  - Security: Không nên nói rõ "email exists but password wrong"
  - Better: "Email hoặc password không đúng"

auth/too-many-requests:
  - Quá nhiều failed attempts
  - Firebase tự block temporarily để prevent brute force
  - Solution: Show CAPTCHA hoặc ask user đợi

auth/network-request-failed:
  - Lỗi network (offline, timeout)
  - Solution: Retry logic hoặc show "Check your connection"
```

---

**2. Social Authentication (Google, Facebook) - Chi tiết**

```typescript
// services/authService.ts (tiếp)
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  OAuthProvider
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const socialAuth = {
  /**
   * GOOGLE SIGN IN - Đăng nhập bằng Google
   * 
   * Flow:
   * 1. Create GoogleAuthProvider instance
   * 2. Open Google login popup
   * 3. User chọn account và authorize
   * 4. Firebase nhận OAuth token từ Google
   * 5. Tạo/login user trong Firebase Auth
   * 6. Return user object với Google profile info
   */
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Optional: Request additional scopes
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      
      // Optional: Custom parameters
      provider.setCustomParameters({
        prompt: 'select_account' // Force account selection mỗi lần
      });
      
      // Sign in với popup (recommended cho desktop)
      const result = await signInWithPopup(auth, provider);
      
      // Access token từ Google (có thể dùng để call Google APIs)
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      console.log('✅ Google sign in successful:', result.user.email);
      console.log('   Display name:', result.user.displayName);
      console.log('   Photo URL:', result.user.photoURL);
      
      return result.user;
      
    } catch (error: any) {
      console.error('❌ Google sign in error:', error.code);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Đăng nhập bị hủy');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bị chặn. Vui lòng cho phép popup');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('Email đã được dùng với phương thức đăng nhập khác');
      }
      
      throw error;
    }
  },

  /**
   * FACEBOOK SIGN IN - Đăng nhập bằng Facebook
   * 
   * Requirements:
   * - Setup Facebook App tại https://developers.facebook.com
   * - Add Facebook App ID và App Secret vào Firebase Console
   * - Configure OAuth redirect URIs
   */
  signInWithFacebook: async () => {
    try {
      const provider = new FacebookAuthProvider();
      
      // Optional: Request additional permissions
      provider.addScope('email');
      provider.addScope('public_profile');
      
      const result = await signInWithPopup(auth, provider);
      
      // Access token từ Facebook
      const credential = FacebookAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      console.log('✅ Facebook sign in successful:', result.user.email);
      return result.user;
      
    } catch (error: any) {
      console.error('❌ Facebook sign in error:', error.code);
      throw error;
    }
  },
  
  /**
   * REDIRECT-BASED LOGIN - Alternative cho mobile hoặc khi popup bị block
   * 
   * Use case:
   * - Mobile browsers thường block popups
   * - Một số security policies không allow popups
   * 
   * Flow:
   * 1. Redirect user sang Google/Facebook login page
   * 2. User login
   * 3. Redirect về app với auth credentials
   * 4. App call getRedirectResult() để complete login
   */
  signInWithGoogleRedirect: async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // Sau khi redirect về, gọi handleRedirectResult()
  },
  
  handleRedirectResult: async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('✅ Redirect sign in successful:', result.user.email);
        return result.user;
      }
      return null;
    } catch (error) {
      console.error('❌ Redirect result error:', error);
      throw error;
    }
  }
};
```

**Giải thích Social Login:**

```yaml
Popup vs Redirect:

Popup (signInWithPopup):
  Ưu điểm:
    ✅ User không rời khỏi app
    ✅ Trải nghiệm mượt hơn (single page)
    ✅ Dễ handle callbacks
  Nhược điểm:
    ❌ Có thể bị popup blocker chặn
    ❌ Không work tốt trên mobile
    ❌ Một số browsers không support
  Best for: Desktop web apps

Redirect (signInWithRedirect):
  Ưu điểm:
    ✅ Reliable trên mọi platform
    ✅ Work tốt trên mobile
    ✅ Không bị popup blocker
  Nhược điểm:
    ❌ User rời khỏi app (full redirect)
    ❌ Phức tạp hơn để handle state
    ❌ Page reload → mất state nếu không persist
  Best for: Mobile apps hoặc progressive enhancement

Account Linking:
  Problem: User signup với Email, sau đó login bằng Google với cùng email
  Firebase behavior: Báo lỗi "account-exists-with-different-credential"
  Solution: 
    1. Detect error
    2. Fetch sign-in methods cho email đó
    3. Ask user sign in với method gốc
    4. Link Google credential vào account hiện tại
```

---

#### D. Firestore Database - NoSQL Cloud Database

### 🔍 Firestore là gì?

```yaml
Firestore (Cloud Firestore):
  - NoSQL document database
  - Real-time synchronization
  - Offline support tự động
  - Scalable (millions of concurrent connections)
  - Strong consistency (reads always return latest data)

Data Structure:
  Collection → Document → Subcollection → Document
  
  Example:
    users (collection)
      ├─ user1 (document)
      │   ├─ name: "John Doe"
      │   ├─ email: "john@example.com"
      │   └─ orders (subcollection)
      │       ├─ order1 (document)
      │       └─ order2 (document)
      └─ user2 (document)

Document:
  - JSON-like object
  - Max size: 1MB
  - Fields: string, number, boolean, array, map, geopoint, timestamp, reference
  - Document ID: Tự generate hoặc custom

Query capabilities:
  ✅ Filter: where()
  ✅ Sort: orderBy()
  ✅ Limit: limit()
  ✅ Pagination: startAfter()
  ❌ Complex joins (not supported - denormalize data instead)
  ❌ OR queries (workaround: multiple queries + merge results)
```

**1. CRUD Operations - Chi tiết**

```typescript
// services/firestoreService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const firestoreService = {
  /**
   * CREATE - Tạo document mới
   * 
   * addDoc(): Firebase tự generate document ID
   * setDoc(): Bạn chỉ định document ID
   */
  
  // Option 1: Auto-generate ID
  create: async <T extends DocumentData>(
    collectionName: string, 
    data: T
  ): Promise<string> => {
    try {
      // Add timestamp fields
      const docData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      console.log('✅ Document created with ID:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Create error:', error);
      throw error;
    }
  },
  
  // Option 2: Custom ID
  createWithId: async <T extends DocumentData>(
    collectionName: string,
    documentId: string,
    data: T
  ): Promise<void> => {
    try {
      const docData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await setDoc(doc(db, collectionName, documentId), docData);
      console.log('✅ Document created with custom ID:', documentId);
      
    } catch (error) {
      console.error('❌ Create with ID error:', error);
      throw error;
    }
  },

  /**
   * READ ONE - Đọc 1 document theo ID
   * 
   * Returns: Document data + ID hoặc null nếu không tồn tại
   */
  getOne: async <T extends DocumentData>(
    collectionName: string, 
    id: string
  ): Promise<(T & { id: string }) | null> => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T & { id: string };
      }
      
      console.log('⚠️ Document not found:', id);
      return null;
      
    } catch (error) {
      console.error('❌ Get one error:', error);
      throw error;
    }
  },

  /**
   * READ ALL - Đọc tất cả documents trong collection
   * 
   * ⚠️ Warning: Expensive nếu collection lớn
   * Best practice: Dùng pagination (limitTo + startAfter)
   */
  getAll: async <T extends DocumentData>(
    collectionName: string
  ): Promise<(T & { id: string })[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (T & { id: string })[];
      
      console.log(`✅ Fetched ${results.length} documents from ${collectionName}`);
      return results;
      
    } catch (error) {
      console.error('❌ Get all error:', error);
      throw error;
    }
  },

  /**
   * UPDATE - Cập nhật document (merge mode)
   * 
   * updateDoc(): Chỉ update các fields được specify
   * setDoc(merge: true): Tương tự updateDoc
   * setDoc(merge: false): OVERWRITE toàn bộ document
   */
  update: async <T extends Partial<DocumentData>>(
    collectionName: string, 
    id: string, 
    data: T
  ): Promise<void> => {
    try {
      const docRef = doc(db, collectionName, id);
      
      const updateData = {
        ...data,
        updatedAt: Timestamp.now() // Always update timestamp
      };
      
      await updateDoc(docRef, updateData);
      console.log('✅ Document updated:', id);
      
    } catch (error: any) {
      console.error('❌ Update error:', error);
      
      if (error.code === 'not-found') {
        throw new Error('Document không tồn tại');
      }
      
      throw error;
    }
  },

  /**
   * DELETE - Xóa document
   * 
   * ⚠️ Lưu ý: Không tự động xóa subcollections!
   * Best practice: Soft delete (thêm field deletedAt thay vì xóa thật)
   */
  delete: async (collectionName: string, id: string): Promise<void> => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      console.log('✅ Document deleted:', id);
      
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  },
  
  /**
   * SOFT DELETE - Xóa mềm (recommended)
   * 
   * Advantages:
   * - Có thể restore
   * - Audit trail
   * - Compliance (GDPR right to be forgotten - có thể implement later)
   */
  softDelete: async (collectionName: string, id: string): Promise<void> => {
    try {
      await firestoreService.update(collectionName, id, {
        deletedAt: Timestamp.now(),
        isDeleted: true
      });
      console.log('✅ Document soft deleted:', id);
    } catch (error) {
      console.error('❌ Soft delete error:', error);
      throw error;
    }
  },

  /**
   * QUERY WITH FILTERS - Truy vấn có điều kiện
   * 
   * Firestore query limitations:
   * - Chỉ 1 field có range filter (>, <, >=, <=)
   * - orderBy() phải match với where() field nếu có range
   * - Cần composite indexes cho complex queries
   */
  queryWithFilters: async <T extends DocumentData>(
    collectionName: string,
    filters: { field: string; operator: any; value: any }[],
    options?: {
      orderByField?: string;
      orderDirection?: 'asc' | 'desc';
      limitCount?: number;
      startAfterDoc?: QueryDocumentSnapshot;
    }
  ): Promise<(T & { id: string })[]> => {
    try {
      // Start với collection reference
      let q = query(collection(db, collectionName));

      // Apply WHERE filters
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      // Apply ORDER BY
      if (options?.orderByField) {
        q = query(
          q, 
          orderBy(options.orderByField, options.orderDirection || 'asc')
        );
      }

      // Apply LIMIT
      if (options?.limitCount) {
        q = query(q, limit(options.limitCount));
      }

      // Apply PAGINATION (startAfter)
      if (options?.startAfterDoc) {
        q = query(q, startAfter(options.startAfterDoc));
      }

      const querySnapshot = await getDocs(q);
      
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (T & { id: string })[];
      
      console.log(`✅ Query returned ${results.length} documents`);
      return results;
      
    } catch (error: any) {
      console.error('❌ Query error:', error);
      
      if (error.code === 'failed-precondition') {
        console.error('⚠️ Missing index! Check Firebase Console for index creation link');
      }
      
      throw error;
    }
  }
};
```

**Ví dụ sử dụng Firestore queries:**

```typescript
// Example: Get active products, sorted by price, limit 10
interface Product {
  name: string;
  price: number;
  category: string;
  isActive: boolean;
  createdAt: Timestamp;
}

// Query 1: Simple filter
const activeProducts = await firestoreService.queryWithFilters<Product>(
  'products',
  [
    { field: 'isActive', operator: '==', value: true }
  ],
  {
    orderByField: 'price',
    orderDirection: 'asc',
    limitCount: 10
  }
);

// Query 2: Multiple filters
const electronicsUnder1000 = await firestoreService.queryWithFilters<Product>(
  'products',
  [
    { field: 'category', operator: '==', value: 'electronics' },
    { field: 'price', operator: '<=', value: 1000 }
  ],
  {
    orderByField: 'price', // ⚠️ Must order by same field as range filter!
    limitCount: 20
  }
);

// Query 3: Pagination
let lastDoc: QueryDocumentSnapshot | undefined;

// First page
const page1 = await firestoreService.queryWithFilters<Product>(
  'products',
  [{ field: 'isActive', operator: '==', value: true }],
  { limitCount: 10, orderByField: 'createdAt' }
);

if (page1.length > 0) {
  // Get last document for pagination
  const querySnapshot = await getDocs(
    query(
      collection(db, 'products'),
      where('isActive', '==', true),
      orderBy('createdAt'),
      limit(10)
    )
  );
  lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
  
  // Second page
  const page2 = await firestoreService.queryWithFilters<Product>(
    'products',
    [{ field: 'isActive', operator: '==', value: true }],
    {
      limitCount: 10,
      orderByField: 'createdAt',
      startAfterDoc: lastDoc
    }
  );
}
```

**Giải thích Query Limitations:**

```yaml
Firestore Query Rules:

1. Range filters (>, <, >=, <=):
   ❌ BAD: Không thể có 2 fields với range filters
   await query(
     collection(db, 'products'),
     where('price', '>', 100),
     where('stock', '<', 50)  // ❌ ERROR!
   );
   
   ✅ GOOD: Chỉ 1 field có range filter
   await query(
     collection(db, 'products'),
     where('category', '==', 'electronics'),  // Equality OK
     where('price', '>', 100)                 // Range OK
   );

2. orderBy() matching:
   ❌ BAD: orderBy field khác với range filter field
   await query(
     collection(db, 'products'),
     where('price', '>', 100),
     orderBy('createdAt')  // ❌ ERROR!
   );
   
   ✅ GOOD: orderBy same field as range filter
   await query(
     collection(db, 'products'),
     where('price', '>', 100),
     orderBy('price')  // ✅ Must be 'price' first
     orderBy('createdAt')  // ✅ Additional orderBy OK
   );

3. Composite indexes:
   Complex queries cần create indexes trong Firebase Console
   
   Example query cần index:
   await query(
     collection(db, 'products'),
     where('category', '==', 'electronics'),
     where('isActive', '==', true),
     orderBy('price')
   );
   
   → Firebase sẽ báo lỗi với link tạo index tự động
   → Click link → Index được tạo sau ~2 phút
   → Query sẽ work sau khi index ready

4. Array queries:
   array-contains: Check nếu array có chứa value
   array-contains-any: Check nếu array có chứa bất kỳ value nào trong list
   in: Check nếu field value nằm trong list (max 10 values)
   not-in: Check nếu field value KHÔNG nằm trong list (max 10 values)
```

---

**2. Real-time Updates - Lắng nghe Thay đổi Data**

```typescript
// services/firestoreService.ts (tiếp)
import { onSnapshot, Unsubscribe } from 'firebase/firestore';

export const realtimeService = {
  /**
   * SUBSCRIBE TO DOCUMENT - Lắng nghe 1 document
   * 
   * Use case: Real-time dashboard, chat message, live data
   * 
   * Flow:
   * 1. Setup listener
   * 2. Mỗi khi document thay đổi → callback được gọi
   * 3. Remember unsubscribe khi component unmount!
   */
  subscribeToDocument: <T extends DocumentData>(
    collectionName: string,
    documentId: string,
    callback: (data: (T & { id: string }) | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe => {
    const docRef = doc(db, collectionName, documentId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback({
            id: docSnap.id,
            ...docSnap.data()
          } as T & { id: string });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('❌ Real-time listener error:', error);
        onError?.(error);
      }
    );
    
    return unsubscribe;
  },

  /**
   * SUBSCRIBE TO COLLECTION - Lắng nghe collection
   * 
   * Use case: Live product list, user list, notifications
   */
  subscribeToCollection: <T extends DocumentData>(
    collectionName: string,
    callback: (data: (T & { id: string })[]) => void,
    options?: {
      filters?: { field: string; operator: any; value: any }[];
      orderByField?: string;
      limitCount?: number;
    }
  ): Unsubscribe => {
    let q = query(collection(db, collectionName));
    
    // Apply filters if provided
    if (options?.filters) {
      options.filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }
    
    if (options?.orderByField) {
      q = query(q, orderBy(options.orderByField));
    }
    
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as (T & { id: string })[];
        
        callback(data);
      },
      (error) => {
        console.error('❌ Collection listener error:', error);
      }
    );
    
    return unsubscribe;
  },
  
  /**
   * SUBSCRIBE WITH CHANGE DETECTION - Track thêm loại thay đổi
   * 
   * Change types: 'added', 'modified', 'removed'
   * Use case: Khi cần biết exactly document nào thay đổi
   */
  subscribeWithChanges: <T extends DocumentData>(
    collectionName: string,
    callback: (changes: {
      type: 'added' | 'modified' | 'removed';
      doc: T & { id: string };
    }[]) => void
  ): Unsubscribe => {
    const collectionRef = collection(db, collectionName);
    
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const changes = snapshot.docChanges().map(change => ({
        type: change.type,
        doc: {
          id: change.doc.id,
          ...change.doc.data()
        } as T & { id: string }
      }));
      
      callback(changes);
    });
    
    return unsubscribe;
  }
};
```

**Ví dụ sử dụng Real-time trong React:**

```typescript
// Example: Real-time product list in React component
import { useEffect, useState } from 'react';

interface Product {
  name: string;
  price: number;
  stock: number;
}

function ProductList() {
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to products collection
    const unsubscribe = realtimeService.subscribeToCollection<Product>(
      'products',
      (data) => {
        setProducts(data);
        setLoading(false);
      },
      {
        filters: [{ field: 'isActive', operator: '==', value: true }],
        orderByField: 'name',
        limitCount: 50
      }
    );

    // ⚠️ IMPORTANT: Cleanup khi component unmount
    return () => {
      unsubscribe();
      console.log('🔌 Unsubscribed from products');
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products (Live Updates)</h1>
      {products.map(product => (
        <div key={product.id}>
          {product.name} - ${product.price} - Stock: {product.stock}
        </div>
      ))}
    </div>
  );
}

// Example: Track changes specifically
function ProductChangeTracker() {
  useEffect(() => {
    const unsubscribe = realtimeService.subscribeWithChanges<Product>(
      'products',
      (changes) => {
        changes.forEach(change => {
          if (change.type === 'added') {
            console.log('➕ New product:', change.doc.name);
          } else if (change.type === 'modified') {
            console.log('✏️ Product updated:', change.doc.name);
          } else if (change.type === 'removed') {
            console.log('🗑️ Product deleted:', change.doc.id);
          }
        });
      }
    );

    return () => unsubscribe();
  }, []);

  return <div>Check console for real-time changes</div>;
}
```

**Performance considerations cho Real-time:**

```yaml
Real-time Billing & Performance:

Costs:
  - Mỗi document read = 1 read operation (billed)
  - Initial snapshot: Reads tất cả matching documents
  - Subsequent updates: Chỉ reads documents thay đổi
  - Example: 100 docs ban đầu → 100 reads
             → 1 doc updated → 1 read
             → 1 doc added → 1 read

Best Practices:
  ✅ Unsubscribe khi không cần (component unmount)
  ✅ Limit số lượng documents (dùng limit())
  ✅ Filter cụ thể (where()) thay vì lấy all
  ❌ Avoid subscribe to entire large collections
  ❌ Avoid multiple overlapping subscriptions

When to use Real-time:
  ✅ Chat messages
  ✅ Live dashboards
  ✅ Collaborative editing
  ✅ Notifications
  ❌ Static data (blog posts, product catalog)
  ❌ Historical data (archives, reports)
```

---

#### E. Firebase Storage - File Upload Service

### 🔍 Firebase Storage là gì?

```yaml
Firebase Storage:
  - Cloud file storage (images, videos, documents, etc.)
  - CDN-backed → Fast global delivery
  - Scalable → No size limits (pay-as-you-go)
  - Secure → Firebase Security Rules control access
  - Resumable uploads → Network interruptions handled
  - Integrated với Firebase Auth → Easy user-specific storage

Use cases:
  ✅ User profile pictures
  ✅ Product images
  ✅ Document uploads (PDF, DOCX)
  ✅ Video/audio files
  ✅ User-generated content (UGC)
```

**1. Upload Files - Chi tiết**

```typescript
// services/storageService.ts
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export const storageService = {
  /**
   * SIMPLE UPLOAD - Upload file cơ bản
   * 
   * Use case: Small files, không cần track progress
   * Flow:
   * 1. Create storage reference (path/to/file.jpg)
   * 2. Upload bytes
   * 3. Get download URL
   * 4. Return URL để save vào Firestore
   */
  uploadFile: async (
    path: string, 
    file: File
  ): Promise<string> => {
    try {
      const storageRef = ref(storage, path);
      
      // Upload file
      const snapshot: UploadTaskSnapshot = await uploadBytes(storageRef, file);
      
      // Get public URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ File uploaded:', downloadURL);
      return downloadURL;
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  },

  /**
   * UPLOAD WITH PROGRESS - Upload với progress bar
   * 
   * Use case: Large files (images, videos), cần show progress
   * Benefits: Resumable uploads (auto-retry on network errors)
   */
  uploadFileWithProgress: (
    path: string,
    file: File,
    onProgress: (progress: number) => void,
    onError?: (error: Error) => void,
    onComplete?: (downloadURL: string) => void
  ): UploadTask => {
    const storageRef = ref(storage, path);
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      // Progress callback
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(progress));
        
        console.log(`Upload is ${progress}% done`);
        
        switch (snapshot.state) {
          case 'paused':
            console.log('⏸️ Upload is paused');
            break;
          case 'running':
            console.log('🏃 Upload is running');
            break;
        }
      },
      // Error callback
      (error) => {
        console.error('❌ Upload failed:', error.code);
        onError?.(error);
      },
      // Complete callback
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log('✅ File uploaded successfully');
        onComplete?.(downloadURL);
      }
    );

    return uploadTask; // Return để có thể pause/resume/cancel
  },

  /**
   * GET DOWNLOAD URL - Lấy public URL của file
   * 
   * Use case: Display image/file đã upload trước đó
   */
  getDownloadURL: async (path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        throw new Error('File không tồn tại');
      }
      throw error;
    }
  },

  /**
   * DELETE FILE - Xóa file
   * 
   * ⚠️ Lưu ý: Xóa file trong Storage KHÔNG tự động xóa URL trong Firestore!
   * Best practice: Xóa reference trong Firestore trước, sau đó xóa file
   */
  deleteFile: async (path: string): Promise<void> => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      console.log('✅ File deleted:', path);
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        console.warn('⚠️ File already deleted or not found');
        return;
      }
      throw error;
    }
  },

  /**
   * LIST FILES - List files trong folder
   * 
   * Use case: Gallery, file browser
   */
  listFiles: async (folderPath: string): Promise<{
    name: string;
    fullPath: string;
    url: string;
  }[]> => {
    try {
      const storageRef = ref(storage, folderPath);
      const result = await listAll(storageRef);
      
      // Get URLs for all files
      const filesWithUrls = await Promise.all(
        result.items.map(async (item) => ({
          name: item.name,
          fullPath: item.fullPath,
          url: await getDownloadURL(item)
        }))
      );
      
      console.log(`✅ Listed ${filesWithUrls.length} files in ${folderPath}`);
      return filesWithUrls;
      
    } catch (error) {
      console.error('❌ List files error:', error);
      throw error;
    }
  },

  /**
   * GET FILE METADATA - Lấy thông tin file (size, content type, etc.)
   */
  getFileMetadata: async (path: string) => {
    const storageRef = ref(storage, path);
    const metadata = await getMetadata(storageRef);
    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated
    };
  }
};
```

**Ví dụ Upload Image với React:**

```typescript
// Example: Image upload component
import { useState } from 'react';

function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('File quá lớn (tối đa 5MB)');
      return;
    }

    setUploading(true);

    // Generate unique filename
    const timestamp = Date.now();
    const userId = 'user123'; // From auth
    const fileName = `${timestamp}_${file.name}`;
    const path = `users/${userId}/images/${fileName}`;

    // Upload với progress
    const uploadTask = storageService.uploadFileWithProgress(
      path,
      file,
      (progress) => {
        setProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        alert('Upload thất bại');
        setUploading(false);
      },
      async (downloadURL) => {
        setImageUrl(downloadURL);
        
        // Save URL to Firestore
        await firestoreService.create('user_images', {
          userId,
          imageUrl: downloadURL,
          fileName: file.name,
          size: file.size,
          path: path
        });
        
        setUploading(false);
        alert('Upload thành công!');
      }
    );

    // Có thể cancel upload nếu cần
    // uploadTask.cancel();
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {uploading && (
        <div>
          <progress value={progress} max="100" />
          <span>{progress}%</span>
        </div>
      )}
      
      {imageUrl && (
        <img src={imageUrl} alt="Uploaded" style={{ maxWidth: '300px' }} />
      )}
    </div>
  );
}
```

**Storage Security Rules:**

```javascript
// storage.rules - Configure trong Firebase Console
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read, authenticated write
    match /public/{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
    
    // User-specific files (chỉ owner mới access được)
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Validate file size và type
    match /images/{imageId} {
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024  // 5MB max
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 4.2. Tích hợp REST API - External Services

### 🔍 REST API là gì?

```yaml
REST (Representational State Transfer):
  - Architecture style cho web services
  - Uses HTTP methods: GET, POST, PUT, DELETE, PATCH
  - Stateless: Mỗi request độc lập
  - Resources identified by URLs
  - Response format: Usually JSON

HTTP Methods:
  GET: Retrieve data (read-only, idempotent)
  POST: Create new resource
  PUT: Update/replace entire resource
  PATCH: Partial update
  DELETE: Remove resource

Status Codes:
  2xx Success: 200 OK, 201 Created, 204 No Content
  3xx Redirect: 301 Moved, 304 Not Modified
  4xx Client Error: 400 Bad Request, 401 Unauthorized, 404 Not Found
  5xx Server Error: 500 Internal Server Error, 503 Service Unavailable
```

### 4.2.1. Fetch API - Built-in Browser API

**Basic Usage:**

```typescript
// services/apiService.ts

/**
 * API Service với error handling đúng cách
 */
export class ApiService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * GET REQUEST - Lấy data
   */
  async get<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        ...options
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      const data: T = await response.json();
      return data;

    } catch (error) {
      console.error('GET error:', error);
      throw error;
    }
  }

  /**
   * POST REQUEST - Tạo mới
   */
  async post<T, R = any>(
    endpoint: string,
    body: T,
    options?: RequestInit
  ): Promise<R> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(body),
        ...options
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      // Some POST requests return 204 No Content
      if (response.status === 204) {
        return {} as R;
      }

      const data: R = await response.json();
      return data;

    } catch (error) {
      console.error('POST error:', error);
      throw error;
    }
  }

  /**
   * PUT REQUEST - Update toàn bộ
   */
  async put<T, R = any>(
    endpoint: string,
    body: T,
    options?: RequestInit
  ): Promise<R> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.defaultHeaders,
        body: JSON.stringify(body),
        ...options
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      const data: R = await response.json();
      return data;

    } catch (error) {
      console.error('PUT error:', error);
      throw error;
    }
  }

  /**
   * PATCH REQUEST - Partial update
   */
  async patch<T, R = any>(
    endpoint: string,
    body: Partial<T>,
    options?: RequestInit
  ): Promise<R> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.defaultHeaders,
        body: JSON.stringify(body),
        ...options
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      const data: R = await response.json();
      return data;

    } catch (error) {
      console.error('PATCH error:', error);
      throw error;
    }
  }

  /**
   * DELETE REQUEST - Xóa
   */
  async delete(
    endpoint: string,
    options?: RequestInit
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.defaultHeaders,
        ...options
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      console.log('✅ DELETE successful');

    } catch (error) {
      console.error('DELETE error:', error);
      throw error;
    }
  }

  /**
   * ERROR HANDLING - Parse error responses
   */
  private async handleError(response: Response): Promise<Error> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Response không phải JSON, dùng statusText
    }

    return new Error(errorMessage);
  }

  /**
   * SET AUTHORIZATION HEADER - Thêm auth token
   */
  setAuthToken(token: string) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * REMOVE AUTHORIZATION
   */
  clearAuthToken() {
    const { Authorization, ...rest } = this.defaultHeaders as any;
    this.defaultHeaders = rest;
  }
}

// Export instance
export const apiService = new ApiService(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
);
```

**Ví dụ sử dụng:**

```typescript
// Example: Product API calls
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export const productService = {
  // GET all products
  getAll: async (): Promise<Product[]> => {
    return await apiService.get<Product[]>('/products');
  },

  // GET one product
  getById: async (id: string): Promise<Product> => {
    return await apiService.get<Product>(`/products/${id}`);
  },

  // CREATE product
  create: async (product: Omit<Product, 'id'>): Promise<Product> => {
    return await apiService.post<Omit<Product, 'id'>, Product>(
      '/products',
      product
    );
  },

  // UPDATE product
  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    return await apiService.patch<Product, Product>(
      `/products/${id}`,
      product
    );
  },

  // DELETE product
  delete: async (id: string): Promise<void> => {
    await apiService.delete(`/products/${id}`);
  }
};

// Usage in component
async function loadProducts() {
  try {
    const products = await productService.getAll();
    console.log('Products:', products);
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}
```

---

### 4.2.2. Axios - HTTP Client Library (Advanced)

**Why Axios over Fetch?**

```yaml
Axios advantages:
  ✅ Automatic JSON parsing (no need .json())
  ✅ Request/response interceptors
  ✅ Timeout support
  ✅ Cancel requests
  ✅ Progress events (upload/download)
  ✅ Better error handling
  ✅ Automatic CSRF protection

Fetch advantages:
  ✅ Native (no install needed)
  ✅ Lighter weight
  ✅ Streaming support

Recommendation: Axios cho production apps
```

**Setup Axios:**

```bash
npm install axios
```

**Axios Service with Interceptors:**

```typescript
// lib/database.ts
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dialectOptions: {
    socketPath: process.env.DB_SOCKET_PATH, // For Cloud SQL
  },
  logging: false,
});

export default sequelize;
```

#### BigQuery Integration

```typescript
import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
});

export const queryBigQuery = async (sqlQuery: string) => {
  const options = {
    query: sqlQuery,
    location: 'US',
  };

  const [job] = await bigquery.createQueryJob(options);
  const [rows] = await job.getQueryResults();
  
  return rows;
};
```

### 4.1.3. Google Analytics

```typescript
// lib/analytics.ts
import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';

export const analyticsService = {
  logPageView: (page: string) => {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: page,
      });
    }
  },

  logEvent: (eventName: string, params?: any) => {
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  },

  logPurchase: (value: number, currency: string, items: any[]) => {
    if (analytics) {
      logEvent(analytics, 'purchase', {
        value,
        currency,
        items,
      });
    }
  },
};
```

## 4.2. Kết nối API

### 4.2.1. RESTful API Integration

#### API Client Setup:

```typescript
// lib/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const originalRequest = error.config;

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await axios.post('/auth/refresh', {
              refreshToken,
            });

            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(url, data, config);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);
```

#### API Service Layer:

```typescript
// services/api/userApi.ts
import { apiClient } from '@/lib/apiClient';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export const userApi = {
  getProfile: () => apiClient.get<User>('/users/profile'),
  
  updateProfile: (data: Partial<User>) =>
    apiClient.put<User>('/users/profile', data),
  
  getUsers: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ users: User[]; total: number }>('/users', { params }),
  
  getUserById: (id: string) => apiClient.get<User>(`/users/${id}`),
  
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
};
```

### 4.2.2. GraphQL Integration

#### Apollo Client Setup:

```typescript
// lib/apolloClient.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

#### GraphQL Queries:

```typescript
// graphql/queries.ts
import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers($page: Int, $limit: Int) {
    users(page: $page, limit: $limit) {
      id
      email
      name
      avatar
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      name
      avatar
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      name
    }
  }
`;
```

#### Usage in Components:

```typescript
import { useQuery, useMutation } from '@apollo/client';
import { GET_USERS, CREATE_USER } from '@/graphql/queries';

export const UserList: React.FC = () => {
  const { data, loading, error } = useQuery(GET_USERS, {
    variables: { page: 1, limit: 10 },
  });

  const [createUser] = useMutation(CREATE_USER);

  const handleCreateUser = async () => {
    try {
      await createUser({
        variables: {
          input: {
            email: 'user@example.com',
            name: 'John Doe',
          },
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.users.map((user: any) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
};
```

### 4.2.3. WebSocket Integration

```typescript
// lib/websocket.ts
import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;

  connect(url: string) {
    this.socket = io(url, {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const wsClient = new WebSocketClient();
```

## 4.3. Best Practices - Thực hành Tốt nhất

### 4.3.1. Error Handling Strategy

```yaml
Error Handling Principles:

1. Always handle errors:
   ✅ try-catch cho async operations
   ✅ .catch() cho Promises
   ✅ Error boundaries cho React components

2. Provide context:
   ✅ Log error với context (user ID, action, timestamp)
   ✅ User-friendly error messages
   ✅ Technical details cho debugging

3. Retry logic:
   ✅ Network errors → Retry với exponential backoff
   ✅ Rate limit errors → Retry after specified time
   ✅ Max retry attempts (3-5 times)

4. Fallback mechanisms:
   ✅ Cached data khi offline
   ✅ Default values
   ✅ Graceful degradation
```

### 4.3.2. Performance Optimization

```yaml
API Performance Tips:

Caching:
  ✅ Cache GET requests (React Query, SWR)
  ✅ Set appropriate cache TTL
  ✅ Invalidate cache sau mutations
  ✅ Use CDN cho static assets

Request Optimization:
  ✅ Batch requests khi có thể
  ✅ Debounce search inputs (300-500ms)
  ✅ Pagination thay vì load all
  ✅ GraphQL field selection (chỉ query fields cần)

Connection Pooling:
  ✅ Reuse connections (HTTP keep-alive)
  ✅ Limit concurrent requests
  ✅ Use connection pools cho database

Compression:
  ✅ Enable gzip/brotli compression
  ✅ Compress images (WebP, AVIF)
  ✅ Minify JSON responses
```

### 4.3.3. Security Best Practices

```yaml
API Security:

Authentication:
  ✅ Always use HTTPS (no HTTP)
  ✅ Store tokens securely (httpOnly cookies preferred)
  ✅ Implement token refresh
  ✅ Short-lived access tokens (15-30 min)

Authorization:
  ✅ Validate permissions server-side
  ✅ Never trust client-side data
  ✅ Implement rate limiting
  ✅ Log access attempts

Data Protection:
  ✅ Validate input (XSS, SQL injection)
  ✅ Sanitize output
  ✅ Use parameterized queries
  ✅ Never expose API keys client-side

CORS:
  ✅ Whitelist specific origins
  ✅ Don't use wildcard (*) in production
  ✅ Validate Origin header
```

### 4.3.4. Monitoring và Logging

```yaml
Production Monitoring:

Metrics to track:
  📊 API response times (p50, p95, p99)
  📊 Error rates (4xx, 5xx)
  📊 Request volume
  📊 Cache hit rates
  📊 Database query times

Logging best practices:
  ✅ Structured logging (JSON format)
  ✅ Log levels: DEBUG, INFO, WARN, ERROR
  ✅ Include request ID để trace requests
  ✅ Never log sensitive data (passwords, tokens)

Alerting:
  🚨 Error rate > 5%
  🚨 Response time > 3 seconds
  🚨 Service unavailable
  🚨 Quota/rate limit approaching
```

---

## 4.4. Kết luận

Việc tích hợp dịch vụ và API là nền tảng của ứng dụng modern. Phần này đã trình bày chi tiết:

**✅ Đã học được:**
- Firebase Integration (Auth, Firestore, Storage) với ví dụ thực tế
- REST API patterns với Fetch và Axios
- Error handling và retry logic
- Real-time updates với Firestore và WebSocket
- Security best practices
- Performance optimization strategies

**🎯 Key Takeaways:**
1. **Firebase** cho rapid development - No backend needed cho MVP
2. **REST APIs** với proper error handling và retry logic
3. **TypeScript** cho type safety - Giảm bugs
4. **Security** luôn ưu tiên hàng đầu - HTTPS, auth tokens, validation
5. **Performance** quan trọng - Caching, pagination, compression

**📚 Tiếp theo:**
Part 5 sẽ cover **Testing và Quality Assurance** - Unit tests, Integration tests, E2E tests với Jest và Playwright.

---

**Ngày cập nhật**: 05/11/2025  
**Phiên bản**: 2.0  
**Tác giả**: Code Grader Project Team
