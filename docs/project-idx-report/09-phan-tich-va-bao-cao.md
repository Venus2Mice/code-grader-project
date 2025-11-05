# Phần 9: Phân tích và Báo cáo

## Tổng quan

Analytics và reporting là foundation của **data-driven decision making**. Theo nghiên cứu, companies sử dụng data analytics có **23% higher profitability** so với competitors.

### Tại sao Analytics quan trọng?

1. **Hiểu User Behavior** 🎯
   - Tracking user journey từ landing → conversion
   - Identify pain points và drop-off areas
   - Personalize trải nghiệm dựa trên behavior

2. **Optimize Performance** ⚡
   - Monitor real-time application health
   - Detect bottlenecks và slow queries
   - Improve Core Web Vitals (LCP, FID, CLS)

3. **Measure Business Impact** 💰
   - Track conversion rates và revenue
   - Calculate ROI của features
   - A/B testing để optimize UX

4. **Improve Decision Making** 📊
   - Data-backed product decisions
   - Prioritize features based on usage
   - Identify growth opportunities

### Analytics Stack trong Project

| Category | Tools | Purpose |
|----------|-------|---------|
| **Web Analytics** | Google Analytics 4, Mixpanel | User behavior, page views, events |
| **Performance** | Lighthouse, web-vitals, Sentry APM | Core Web Vitals, page load, API latency |
| **Error Tracking** | Sentry, LogRocket | Error monitoring, session replay |
| **Database** | PostgreSQL pg_stat_statements | Query performance, slow queries |
| **Real-time** | Firebase Analytics, Amplitude | Live user tracking, real-time events |
| **Business** | Looker Studio, Tableau | Dashboards, reports, visualizations |
| **A/B Testing** | Optimizely, VWO, Custom | Experiments, feature flags |

---

## 9.1. Google Analytics 4 (GA4) Setup

### 9.1.1. GA4 Installation

```bash
# Install GA4 dependencies
npm install @next/third-parties
```

```typescript
// lib/analytics/ga4.ts
import { GoogleAnalytics } from '@next/third-parties/google';

/**
 * Google Analytics 4 Configuration
 * 
 * GA4 uses event-based model (different from Universal Analytics)
 * Key concepts:
 * - Events: User interactions (page_view, click, purchase)
 * - Parameters: Additional data for events (page_title, value, currency)
 * - User properties: Attributes of users (plan_type, signup_date)
 * - Conversions: Key events that matter to business
 */

// Initialize GA4
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!;

// Custom event types
export interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// GA4 wrapper class
export class GA4 {
  /**
   * Check if GA4 is loaded
   */
  private static isLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.gtag !== 'undefined';
  }

  /**
   * Send event to GA4
   * 
   * @example
   * GA4.event('purchase', {
   *   transaction_id: 'T12345',
   *   value: 99.99,
   *   currency: 'USD'
   * });
   */
  static event(eventName: string, params?: Record<string, any>) {
    if (!this.isLoaded()) {
      console.warn('GA4 not loaded yet');
      return;
    }

    window.gtag('event', eventName, {
      ...params,
      send_to: GA_MEASUREMENT_ID,
    });
  }

  /**
   * Track page view
   * 
   * @example
   * GA4.pageView('/dashboard', 'Dashboard Page');
   */
  static pageView(url: string, title?: string) {
    this.event('page_view', {
      page_path: url,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }

  /**
   * Set user properties
   * 
   * @example
   * GA4.setUserProperties({
   *   user_id: 'usr_123',
   *   plan_type: 'premium',
   *   signup_date: '2025-01-01'
   * });
   */
  static setUserProperties(properties: Record<string, any>) {
    if (!this.isLoaded()) return;

    window.gtag('set', 'user_properties', properties);
  }

  /**
   * Identify user
   * 
   * @example
   * GA4.identify('usr_123');
   */
  static identify(userId: string) {
    if (!this.isLoaded()) return;

    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
    });
  }
}

// Extend Window type for gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}
```

```typescript
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
      </body>
    </html>
  );
}
```

---

### 9.1.2. Custom Event Tracking

#### E-commerce Events

```typescript
// lib/analytics/ecommerce.ts
import { GA4 } from './ga4';

export class EcommerceTracking {
  /**
   * Track product view
   * 
   * @example
   * EcommerceTracking.viewItem({
   *   id: 'prod_123',
   *   name: 'Wireless Mouse',
   *   price: 29.99,
   *   category: 'Electronics'
   * });
   */
  static viewItem(product: {
    id: string;
    name: string;
    price: number;
    category?: string;
    brand?: string;
  }) {
    GA4.event('view_item', {
      currency: 'USD',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand,
          price: product.price,
        },
      ],
    });
  }

  /**
   * Track add to cart
   * 
   * @example
   * EcommerceTracking.addToCart({
   *   id: 'prod_123',
   *   name: 'Wireless Mouse',
   *   price: 29.99,
   *   quantity: 1
   * });
   */
  static addToCart(product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }) {
    GA4.event('add_to_cart', {
      currency: 'USD',
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
  }

  /**
   * Track remove from cart
   */
  static removeFromCart(product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }) {
    GA4.event('remove_from_cart', {
      currency: 'USD',
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
  }

  /**
   * Track begin checkout
   * 
   * @example
   * EcommerceTracking.beginCheckout([
   *   { id: 'prod_123', name: 'Mouse', price: 29.99, quantity: 1 },
   *   { id: 'prod_456', name: 'Keyboard', price: 79.99, quantity: 1 }
   * ], 109.98);
   */
  static beginCheckout(items: any[], totalValue: number) {
    GA4.event('begin_checkout', {
      currency: 'USD',
      value: totalValue,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  /**
   * Track purchase completion
   * 
   * @example
   * EcommerceTracking.purchase({
   *   transactionId: 'T12345',
   *   value: 109.98,
   *   tax: 10.00,
   *   shipping: 5.99,
   *   items: [...]
   * });
   */
  static purchase(transaction: {
    transactionId: string;
    value: number;
    tax?: number;
    shipping?: number;
    coupon?: string;
    items: any[];
  }) {
    GA4.event('purchase', {
      transaction_id: transaction.transactionId,
      value: transaction.value,
      tax: transaction.tax || 0,
      shipping: transaction.shipping || 0,
      currency: 'USD',
      coupon: transaction.coupon,
      items: transaction.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  /**
   * Track refund
   */
  static refund(transactionId: string, value: number) {
    GA4.event('refund', {
      transaction_id: transactionId,
      value,
      currency: 'USD',
    });
  }
}
```

#### Engagement Events

```typescript
// lib/analytics/engagement.ts
import { GA4 } from './ga4';

export class EngagementTracking {
  /**
   * Track search
   * 
   * @example
   * EngagementTracking.search('wireless mouse', 42);
   */
  static search(searchTerm: string, resultCount: number) {
    GA4.event('search', {
      search_term: searchTerm,
      results_count: resultCount,
    });
  }

  /**
   * Track content share
   * 
   * @example
   * EngagementTracking.share('facebook', 'article', 'art_123');
   */
  static share(method: string, contentType: string, itemId: string) {
    GA4.event('share', {
      method, // 'facebook', 'twitter', 'email', 'copy_link'
      content_type: contentType,
      item_id: itemId,
    });
  }

  /**
   * Track video play
   * 
   * @example
   * EngagementTracking.videoPlay('intro_video', 120);
   */
  static videoPlay(videoId: string, videoDuration: number) {
    GA4.event('video_start', {
      video_id: videoId,
      video_duration: videoDuration,
    });
  }

  /**
   * Track video progress
   * 
   * @example
   * EngagementTracking.videoProgress('intro_video', 25); // 25% watched
   */
  static videoProgress(videoId: string, percentWatched: number) {
    GA4.event('video_progress', {
      video_id: videoId,
      video_percent: percentWatched,
    });
  }

  /**
   * Track file download
   * 
   * @example
   * EngagementTracking.fileDownload('product_catalog.pdf', 'pdf');
   */
  static fileDownload(fileName: string, fileType: string) {
    GA4.event('file_download', {
      file_name: fileName,
      file_extension: fileType,
      link_url: window.location.href,
    });
  }

  /**
   * Track scroll depth
   * 
   * @example
   * EngagementTracking.scrollDepth(90); // Scrolled 90%
   */
  static scrollDepth(percent: number) {
    GA4.event('scroll', {
      percent_scrolled: percent,
      page_path: window.location.pathname,
    });
  }

  /**
   * Track form submission
   * 
   * @example
   * EngagementTracking.formSubmit('contact_form', true);
   */
  static formSubmit(formName: string, success: boolean) {
    GA4.event('form_submit', {
      form_name: formName,
      form_success: success,
    });
  }

  /**
   * Track button click
   * 
   * @example
   * EngagementTracking.buttonClick('cta_signup', 'primary');
   */
  static buttonClick(buttonId: string, buttonType: string) {
    GA4.event('button_click', {
      button_id: buttonId,
      button_type: buttonType,
      page_path: window.location.pathname,
    });
  }
}
```

#### User Authentication Events

```typescript
// lib/analytics/auth.ts
import { GA4 } from './ga4';

export class AuthTracking {
  /**
   * Track user signup
   * 
   * @example
   * AuthTracking.signUp('email', 'free');
   */
  static signUp(method: 'email' | 'google' | 'github', planType?: string) {
    GA4.event('sign_up', {
      method,
      plan_type: planType,
    });
  }

  /**
   * Track user login
   * 
   * @example
   * AuthTracking.login('google');
   */
  static login(method: 'email' | 'google' | 'github') {
    GA4.event('login', {
      method,
    });
  }

  /**
   * Track subscription start
   * 
   * @example
   * AuthTracking.subscribe('premium', 29.99, 'monthly');
   */
  static subscribe(plan: string, value: number, billingPeriod: string) {
    GA4.event('subscribe', {
      plan_name: plan,
      value,
      currency: 'USD',
      billing_period: billingPeriod,
    });
  }

  /**
   * Track subscription cancellation
   */
  static cancelSubscription(plan: string, reason?: string) {
    GA4.event('cancel_subscription', {
      plan_name: plan,
      cancellation_reason: reason,
    });
  }
}
```

---

### 9.1.3. React Hook for Tracking

```typescript
// hooks/useAnalytics.ts
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA4 } from '@/lib/analytics/ga4';

/**
 * Hook to automatically track page views
 * 
 * @example
 * function MyPage() {
 *   useAnalytics('Dashboard');
 *   return <div>Content</div>;
 * }
 */
export function useAnalytics(pageTitle?: string) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
    GA4.pageView(url, pageTitle);
  }, [pathname, searchParams, pageTitle]);
}

/**
 * Hook to track component visibility (impression tracking)
 * 
 * @example
 * function ProductCard({ product }) {
 *   const ref = useImpressionTracking('product_view', {
 *     product_id: product.id,
 *     product_name: product.name
 *   });
 *   return <div ref={ref}>...</div>;
 * }
 */
export function useImpressionTracking(
  eventName: string,
  eventParams: Record<string, any>
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            GA4.event(eventName, eventParams);
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.5 } // 50% visible
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [eventName, eventParams]);

  return ref;
}
```

---

## 9.2. Phân tích Hiệu suất (Performance Analytics)

---

## 9.2. Phân tích Hiệu suất (Performance Analytics)

### 9.2.1. Performance Monitoring

#### Real User Monitoring (RUM)

```typescript
// lib/rum.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export class PerformanceMonitoring {
  static initWebVitals() {
    onCLS(this.sendToAnalytics);
    onFID(this.sendToAnalytics);
    onFCP(this.sendToAnalytics);
    onLCP(this.sendToAnalytics);
    onTTFB(this.sendToAnalytics);
  }

  private static sendToAnalytics(metric: Metric) {
    const body = JSON.stringify({
      name: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // Send to analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/web-vitals', body);
    } else {
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  }

  static trackPageLoad() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;

      console.log('Performance Metrics:', {
        pageLoadTime,
        connectTime,
        renderTime,
      });

      // Send to analytics
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageLoadTime,
          connectTime,
          renderTime,
          url: window.location.href,
          timestamp: Date.now(),
        }),
      });
    });
  }

  static trackApiCall(endpoint: string, duration: number, status: number) {
    fetch('/api/analytics/api-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        duration,
        status,
        timestamp: Date.now(),
      }),
    });
  }
}
```

#### Application Performance Monitoring (APM)

```typescript
// lib/apm.ts
import * as Sentry from '@sentry/nextjs';

export class APM {
  static startTransaction(name: string, operation: string) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  static async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(name, 'async-operation');
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      transaction.setStatus('ok');
      transaction.setData('duration', duration);

      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  }

  static measureSync<T>(name: string, operation: () => T): T {
    const transaction = this.startTransaction(name, 'sync-operation');
    const startTime = performance.now();

    try {
      const result = operation();
      const duration = performance.now() - startTime;

      transaction.setStatus('ok');
      transaction.setData('duration', duration);

      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  }
}
```

---

### 9.2.2. Database Performance

```typescript
// lib/dbMonitoring.ts
import { db } from './database';

export class DatabaseMonitoring {
  static async trackQuery(query: string, params: any[]) {
    const startTime = Date.now();
    
    try {
      const result = await db.raw(query, params);
      const duration = Date.now() - startTime;

      // Log slow queries (> 1000ms)
      if (duration > 1000) {
        console.warn('Slow Query Detected:', {
          query,
          duration,
          params: JSON.stringify(params),
        });

        // Send alert
        await this.sendSlowQueryAlert(query, duration);
      }

      // Track metrics
      await this.recordQueryMetrics(query, duration);

      return result;
    } catch (error) {
      console.error('Query Error:', {
        query,
        params,
        error: error.message,
      });
      throw error;
    }
  }

  private static async sendSlowQueryAlert(query: string, duration: number) {
    // Send to monitoring service
    await fetch('/api/monitoring/slow-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        duration,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  private static async recordQueryMetrics(query: string, duration: number) {
    // Record in time-series database
    await fetch('/api/metrics/query-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.substring(0, 100), // Truncate
        duration,
        timestamp: Date.now(),
      }),
    });
  }

  static async getSlowQueries(limit: number = 10) {
    return db('query_logs')
      .where('duration', '>', 1000)
      .orderBy('duration', 'desc')
      .limit(limit)
      .select('*');
  }

  static async getDatabaseStats() {
    const [tableSize] = await db.raw(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC;
    `);

    const [connectionCount] = await db.raw(
      'SELECT count(*) FROM pg_stat_activity;'
    );

    return {
      tableSize,
      connectionCount: connectionCount.count,
    };
  }
}
```

---

### 9.2.3. Frontend Performance

```typescript
// hooks/usePerformance.ts
import { useEffect } from 'react';
import { PerformanceMonitoring } from '@/lib/rum';

export function usePerformance(pageName: string) {
  useEffect(() => {
    // Track component mount time
    const startTime = performance.now();

    return () => {
      const mountDuration = performance.now() - startTime;
      
      console.log(`${pageName} mount time:`, mountDuration);

      // Track if component took too long to mount
      if (mountDuration > 1000) {
        console.warn(`Slow component: ${pageName} took ${mountDuration}ms`);
      }
    };
  }, [pageName]);

  useEffect(() => {
    // Track page view
    PerformanceMonitoring.trackPageLoad();
  }, []);
}

// Usage in component
export default function Dashboard() {
  usePerformance('Dashboard');

  return <div>Dashboard Content</div>;
}
```

---

## 9.3. Conversion Funnels & User Segmentation

### 9.3.1. Conversion Funnel Tracking

**Conversion funnel** là journey mà users đi qua từ awareness → purchase. Tracking funnels giúp identify drop-off points.

#### Funnel Configuration

```typescript
// lib/analytics/funnels.ts
import { GA4 } from './ga4';
import { db } from '@/lib/database';

/**
 * Funnel configuration
 * 
 * Example funnel: Homepage → Product Page → Add to Cart → Checkout → Purchase
 */
export interface FunnelStep {
  id: string;
  name: string;
  event: string;
  requiredParams?: string[];
}

export const CHECKOUT_FUNNEL: FunnelStep[] = [
  {
    id: 'step_1',
    name: 'View Homepage',
    event: 'page_view',
  },
  {
    id: 'step_2',
    name: 'View Product',
    event: 'view_item',
    requiredParams: ['item_id'],
  },
  {
    id: 'step_3',
    name: 'Add to Cart',
    event: 'add_to_cart',
    requiredParams: ['item_id', 'value'],
  },
  {
    id: 'step_4',
    name: 'Begin Checkout',
    event: 'begin_checkout',
    requiredParams: ['value'],
  },
  {
    id: 'step_5',
    name: 'Complete Purchase',
    event: 'purchase',
    requiredParams: ['transaction_id', 'value'],
  },
];

export class FunnelTracking {
  /**
   * Track funnel step completion
   * 
   * @example
   * FunnelTracking.trackStep('checkout_funnel', 'step_3', {
   *   item_id: 'prod_123',
   *   value: 29.99
   * });
   */
  static async trackStep(
    funnelId: string,
    stepId: string,
    params: Record<string, any>
  ) {
    const sessionId = this.getSessionId();
    const userId = this.getUserId();

    // Save to database
    await db('funnel_events').insert({
      funnel_id: funnelId,
      step_id: stepId,
      session_id: sessionId,
      user_id: userId,
      params: JSON.stringify(params),
      created_at: new Date(),
    });

    // Send to GA4
    GA4.event('funnel_step', {
      funnel_id: funnelId,
      step_id: stepId,
      ...params,
    });
  }

  /**
   * Get funnel analysis
   * 
   * @example
   * const analysis = await FunnelTracking.analyze('checkout_funnel', 30);
   * // Returns:
   * // [
   * //   { step: 'View Homepage', users: 10000, conversion: 100%, dropoff: 0 },
   * //   { step: 'View Product', users: 8000, conversion: 80%, dropoff: 2000 },
   * //   { step: 'Add to Cart', users: 3000, conversion: 30%, dropoff: 5000 },
   * //   ...
   * // ]
   */
  static async analyze(funnelId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const steps = await db('funnel_events')
      .select('step_id')
      .countDistinct('session_id as sessions')
      .where('funnel_id', funnelId)
      .where('created_at', '>=', startDate)
      .groupBy('step_id')
      .orderBy('step_id');

    const totalSessions = steps[0]?.sessions || 0;

    return steps.map((step, index) => {
      const previousSessions = index > 0 ? steps[index - 1].sessions : totalSessions;
      const dropoff = previousSessions - step.sessions;
      const conversionRate = totalSessions > 0 ? (step.sessions / totalSessions) * 100 : 0;

      return {
        stepId: step.step_id,
        sessions: step.sessions,
        conversionRate: conversionRate.toFixed(2) + '%',
        dropoff,
        dropoffRate: previousSessions > 0 ? ((dropoff / previousSessions) * 100).toFixed(2) + '%' : '0%',
      };
    });
  }

  /**
   * Get average time between funnel steps
   */
  static async getStepDurations(funnelId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await db('funnel_events')
      .where('funnel_id', funnelId)
      .where('created_at', '>=', startDate)
      .orderBy(['session_id', 'created_at'])
      .select('*');

    // Group by session
    const sessions = new Map<string, any[]>();
    events.forEach(event => {
      if (!sessions.has(event.session_id)) {
        sessions.set(event.session_id, []);
      }
      sessions.get(event.session_id)!.push(event);
    });

    // Calculate durations
    const durations: Record<string, number[]> = {};

    sessions.forEach(sessionEvents => {
      for (let i = 1; i < sessionEvents.length; i++) {
        const current = sessionEvents[i];
        const previous = sessionEvents[i - 1];
        const duration = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();

        const key = `${previous.step_id}_to_${current.step_id}`;
        if (!durations[key]) durations[key] = [];
        durations[key].push(duration / 1000); // Convert to seconds
      }
    });

    // Calculate averages
    return Object.entries(durations).map(([transition, times]) => ({
      transition,
      avgDuration: times.reduce((a, b) => a + b, 0) / times.length,
      medianDuration: this.median(times),
      minDuration: Math.min(...times),
      maxDuration: Math.max(...times),
    }));
  }

  private static median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private static getSessionId(): string {
    if (typeof window === 'undefined') return '';
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  private static getUserId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('user_id');
  }
}
```

#### React Component Example

```typescript
// components/Product/ProductPage.tsx
import { useEffect } from 'react';
import { FunnelTracking } from '@/lib/analytics/funnels';
import { EcommerceTracking } from '@/lib/analytics/ecommerce';

export function ProductPage({ product }) {
  useEffect(() => {
    // Track funnel step 2: View Product
    FunnelTracking.trackStep('checkout_funnel', 'step_2', {
      item_id: product.id,
      item_name: product.name,
      price: product.price,
    });

    // Track GA4 event
    EcommerceTracking.viewItem(product);
  }, [product]);

  const handleAddToCart = () => {
    // Track funnel step 3: Add to Cart
    FunnelTracking.trackStep('checkout_funnel', 'step_3', {
      item_id: product.id,
      value: product.price,
    });

    // Track GA4 event
    EcommerceTracking.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });

    // Add to cart logic...
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

---

### 9.3.2. User Segmentation

**User segmentation** chia users thành groups dựa trên characteristics hoặc behaviors để personalize experience.

#### Segmentation Types

```typescript
// lib/analytics/segmentation.ts
import { db } from '@/lib/database';

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  conditions: SegmentCondition[];
}

export interface SegmentCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export class UserSegmentation {
  /**
   * Define segments
   */
  static readonly SEGMENTS: UserSegment[] = [
    // Demographic segments
    {
      id: 'high_value_customers',
      name: 'High Value Customers',
      description: 'Users with total purchases > $1000',
      conditions: [
        { field: 'total_purchase_value', operator: 'greater_than', value: 1000 },
      ],
    },
    {
      id: 'new_users',
      name: 'New Users',
      description: 'Signed up in last 7 days',
      conditions: [
        { field: 'days_since_signup', operator: 'less_than', value: 7 },
      ],
    },
    {
      id: 'premium_users',
      name: 'Premium Users',
      description: 'Users on premium plan',
      conditions: [
        { field: 'plan_type', operator: 'equals', value: 'premium' },
      ],
    },

    // Behavioral segments
    {
      id: 'frequent_buyers',
      name: 'Frequent Buyers',
      description: 'Made 5+ purchases in last 30 days',
      conditions: [
        { field: 'purchases_last_30_days', operator: 'greater_than', value: 5 },
      ],
    },
    {
      id: 'cart_abandoners',
      name: 'Cart Abandoners',
      description: 'Added to cart but did not purchase',
      conditions: [
        { field: 'has_items_in_cart', operator: 'equals', value: true },
        { field: 'last_purchase_days_ago', operator: 'greater_than', value: 7 },
      ],
    },
    {
      id: 'at_risk',
      name: 'At Risk Users',
      description: 'No activity in 30 days',
      conditions: [
        { field: 'days_since_last_activity', operator: 'greater_than', value: 30 },
        { field: 'total_purchases', operator: 'greater_than', value: 0 },
      ],
    },

    // Engagement segments
    {
      id: 'power_users',
      name: 'Power Users',
      description: 'Login daily, high engagement',
      conditions: [
        { field: 'avg_daily_sessions', operator: 'greater_than', value: 5 },
        { field: 'days_active_last_week', operator: 'greater_than', value: 5 },
      ],
    },
  ];

  /**
   * Get users in segment
   * 
   * @example
   * const highValueUsers = await UserSegmentation.getUsersInSegment('high_value_customers');
   */
  static async getUsersInSegment(segmentId: string): Promise<any[]> {
    const segment = this.SEGMENTS.find(s => s.id === segmentId);
    if (!segment) throw new Error(`Segment ${segmentId} not found`);

    let query = db('users');

    segment.conditions.forEach(condition => {
      switch (condition.operator) {
        case 'equals':
          query = query.where(condition.field, condition.value);
          break;
        case 'not_equals':
          query = query.whereNot(condition.field, condition.value);
          break;
        case 'greater_than':
          query = query.where(condition.field, '>', condition.value);
          break;
        case 'less_than':
          query = query.where(condition.field, '<', condition.value);
          break;
        case 'contains':
          query = query.where(condition.field, 'like', `%${condition.value}%`);
          break;
      }
    });

    return query.select('*');
  }

  /**
   * Get segment sizes
   * 
   * @example
   * const sizes = await UserSegmentation.getSegmentSizes();
   * // Returns: { high_value_customers: 127, new_users: 543, ... }
   */
  static async getSegmentSizes(): Promise<Record<string, number>> {
    const sizes: Record<string, number> = {};

    for (const segment of this.SEGMENTS) {
      const users = await this.getUsersInSegment(segment.id);
      sizes[segment.id] = users.length;
    }

    return sizes;
  }

  /**
   * Get user's segments
   * 
   * @example
   * const segments = await UserSegmentation.getUserSegments('usr_123');
   * // Returns: ['premium_users', 'power_users']
   */
  static async getUserSegments(userId: string): Promise<string[]> {
    const user = await db('users').where('id', userId).first();
    if (!user) return [];

    const userSegments: string[] = [];

    for (const segment of this.SEGMENTS) {
      const matchesAll = segment.conditions.every(condition => {
        const userValue = user[condition.field];
        
        switch (condition.operator) {
          case 'equals':
            return userValue === condition.value;
          case 'not_equals':
            return userValue !== condition.value;
          case 'greater_than':
            return userValue > condition.value;
          case 'less_than':
            return userValue < condition.value;
          case 'contains':
            return String(userValue).includes(String(condition.value));
          default:
            return false;
        }
      });

      if (matchesAll) {
        userSegments.push(segment.id);
      }
    }

    return userSegments;
  }

  /**
   * Track segment changes
   */
  static async trackSegmentChanges(userId: string) {
    const currentSegments = await this.getUserSegments(userId);
    const previousSegments = await db('user_segments')
      .where('user_id', userId)
      .pluck('segment_id');

    const entered = currentSegments.filter(s => !previousSegments.includes(s));
    const exited = previousSegments.filter(s => !currentSegments.includes(s));

    // Update database
    if (exited.length > 0) {
      await db('user_segments')
        .where('user_id', userId)
        .whereIn('segment_id', exited)
        .update({ exited_at: new Date() });
    }

    if (entered.length > 0) {
      await db('user_segments').insert(
        entered.map(segmentId => ({
          user_id: userId,
          segment_id: segmentId,
          entered_at: new Date(),
        }))
      );
    }

    return { entered, exited };
  }
}
```

---

---

## 9.4. User Behavior Analytics

### 9.4.1. Event Tracking

```typescript
// lib/analytics.ts
import { analytics } from './firebase';
import { logEvent, setUserProperties } from 'firebase/analytics';

export class Analytics {
  // User identification
  static identifyUser(userId: string, properties: Record<string, any>) {
    if (analytics) {
      setUserProperties(analytics, {
        user_id: userId,
        ...properties,
      });
    }
  }

  // Page tracking
  static trackPageView(page: string, properties?: Record<string, any>) {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: page,
        page_title: document.title,
        ...properties,
      });
    }
  }

  // Event tracking
  static trackEvent(
    eventName: string,
    category: string,
    properties?: Record<string, any>
  ) {
    if (analytics) {
      logEvent(analytics, eventName, {
        event_category: category,
        ...properties,
      });
    }
  }

  // E-commerce tracking
  static trackPurchase(transactionId: string, value: number, items: any[]) {
    if (analytics) {
      logEvent(analytics, 'purchase', {
        transaction_id: transactionId,
        value,
        currency: 'USD',
        items,
      });
    }
  }

  static trackAddToCart(item: any) {
    if (analytics) {
      logEvent(analytics, 'add_to_cart', {
        items: [item],
      });
    }
  }

  static trackCheckoutBegin(items: any[], value: number) {
    if (analytics) {
      logEvent(analytics, 'begin_checkout', {
        items,
        value,
        currency: 'USD',
      });
    }
  }

  // User behavior tracking
  static trackSearch(searchTerm: string, results: number) {
    if (analytics) {
      logEvent(analytics, 'search', {
        search_term: searchTerm,
        results_count: results,
      });
    }
  }

  static trackShare(method: string, contentType: string, itemId: string) {
    if (analytics) {
      logEvent(analytics, 'share', {
        method,
        content_type: contentType,
        item_id: itemId,
      });
    }
  }

  static trackSignUp(method: string) {
    if (analytics) {
      logEvent(analytics, 'sign_up', {
        method,
      });
    }
  }

  static trackLogin(method: string) {
    if (analytics) {
      logEvent(analytics, 'login', {
        method,
      });
    }
  }

  // Custom events
  static trackFeatureUsage(featureName: string, properties?: Record<string, any>) {
    this.trackEvent('feature_used', 'engagement', {
      feature_name: featureName,
      ...properties,
    });
  }

  static trackError(errorType: string, errorMessage: string) {
    this.trackEvent('error_occurred', 'error', {
      error_type: errorType,
      error_message: errorMessage,
    });
  }
}
```

---

### 9.4.2. User Journey Analytics

```typescript
// services/behaviorAnalytics.ts
import { db } from '@/lib/database';

interface UserSession {
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  pageViews: number;
  events: number;
}

export class BehaviorAnalytics {
  static async trackSession(session: UserSession) {
    await db('user_sessions').insert({
      user_id: session.userId,
      session_id: session.sessionId,
      start_time: session.startTime,
      end_time: session.endTime,
      page_views: session.pageViews,
      events: session.events,
      created_at: new Date(),
    });
  }

  static async getUserJourney(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db('user_events')
      .where('user_id', userId)
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'asc')
      .select('*');
  }

  static async getFunnelAnalysis(funnelSteps: string[]) {
    const results = [];

    for (let i = 0; i < funnelSteps.length; i++) {
      const step = funnelSteps[i];
      const count = await db('user_events')
        .where('event_name', step)
        .countDistinct('user_id as count')
        .first();

      results.push({
        step,
        users: count?.count || 0,
        dropoff: i > 0 ? results[i - 1].users - (count?.count || 0) : 0,
      });
    }

    return results;
  }

  static async getCohortAnalysis(startDate: Date, endDate: Date) {
    return db.raw(`
      WITH cohorts AS (
        SELECT 
          user_id,
          DATE_TRUNC('month', created_at) as cohort_month
        FROM users
        WHERE created_at BETWEEN ? AND ?
      ),
      user_activities AS (
        SELECT 
          c.user_id,
          c.cohort_month,
          DATE_TRUNC('month', e.created_at) as activity_month,
          COUNT(*) as activity_count
        FROM cohorts c
        LEFT JOIN user_events e ON c.user_id = e.user_id
        GROUP BY c.user_id, c.cohort_month, activity_month
      )
      SELECT 
        cohort_month,
        activity_month,
        COUNT(DISTINCT user_id) as active_users
      FROM user_activities
      GROUP BY cohort_month, activity_month
      ORDER BY cohort_month, activity_month
    `, [startDate, endDate]);
  }

  static async getRetentionRate(cohortDate: Date) {
    const cohortUsers = await db('users')
      .where('created_at', '>=', cohortDate)
      .where('created_at', '<', new Date(cohortDate.getTime() + 86400000))
      .count('id as count')
      .first();

    const activeUsers = await db('user_events')
      .whereIn('user_id', function() {
        this.select('id')
          .from('users')
          .where('created_at', '>=', cohortDate)
          .where('created_at', '<', new Date(cohortDate.getTime() + 86400000));
      })
      .where('created_at', '>=', new Date(cohortDate.getTime() + 2592000000)) // 30 days
      .countDistinct('user_id as count')
      .first();

    const total = cohortUsers?.count || 0;
    const retained = activeUsers?.count || 0;

    return {
      cohortDate,
      totalUsers: total,
      retainedUsers: retained,
      retentionRate: total > 0 ? (retained / total) * 100 : 0,
    };
  }
}
```

---

## 9.5. Dashboard & Reporting

### 9.5.1. Dashboard Creation với Looker Studio

**Google Looker Studio** (formerly Data Studio) là free tool để tạo interactive dashboards.

#### Setup Process

1. **Connect Data Source**
   - Go to [Looker Studio](https://lookerstudio.google.com/)
   - Click "Create" → "Data Source"
   - Select "Google Analytics 4"
   - Authorize and select your GA4 property

2. **Create Dashboard**
   - Click "Create" → "Report"
   - Add your GA4 data source
   - Start building visualizations

#### Dashboard Components

```yaml
# Executive Dashboard Structure

Top Row - Key Metrics (Scorecard):
  - Total Users (last 30 days)
  - Active Users (last 7 days)
  - Conversion Rate
  - Revenue (if e-commerce)

Second Row - Trends (Line Charts):
  - Daily Active Users (last 30 days)
  - Daily Sessions
  - Daily Page Views

Third Row - Traffic Sources (Pie Chart + Table):
  - Traffic by Source/Medium
    * Organic Search: 40%
    * Direct: 25%
    * Social: 20%
    * Referral: 10%
    * Paid: 5%

Fourth Row - User Behavior (Bar Chart):
  - Top Pages by Views
  - Top Events by Count
  - Average Session Duration by Page

Fifth Row - Conversions (Funnel Chart):
  - Checkout Funnel Visualization
  - Conversion by Device Type
  - Conversion by Location

Bottom Row - Real-time (Geo Map + Table):
  - Users by Country
  - Active Users Right Now
  - Latest Events
```

#### Custom Dashboard Example

```typescript
// pages/api/dashboard/custom.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

/**
 * Custom dashboard API
 * Returns all metrics needed for admin dashboard
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { period = '30d' } = req.query;
    const daysAgo = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // 1. Key Metrics
    const [totalUsers] = await db('users').count('* as count');
    
    const [activeUsers] = await db('user_sessions')
      .where('start_time', '>=', new Date(Date.now() - 7 * 86400000))
      .countDistinct('user_id as count');

    const [revenue] = await db('orders')
      .where('created_at', '>=', startDate)
      .where('status', 'completed')
      .sum('total as total');

    const [orders] = await db('orders')
      .where('created_at', '>=', startDate)
      .count('* as count');

    const avgOrderValue = orders.count > 0 ? (revenue.total || 0) / orders.count : 0;

    // 2. Time Series - Daily metrics
    const dailyMetrics = await db.raw(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as sessions
      FROM user_sessions
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startDate]);

    // 3. Traffic Sources
    const trafficSources = await db('user_sessions')
      .select('source', 'medium')
      .count('* as sessions')
      .where('start_time', '>=', startDate)
      .groupBy('source', 'medium')
      .orderBy('sessions', 'desc')
      .limit(10);

    // 4. Top Pages
    const topPages = await db('page_views')
      .select('page')
      .count('* as views')
      .countDistinct('user_id as unique_visitors')
      .avg('time_on_page as avg_time')
      .where('created_at', '>=', startDate)
      .groupBy('page')
      .orderBy('views', 'desc')
      .limit(10);

    // 5. Top Events
    const topEvents = await db('user_events')
      .select('event_name')
      .count('* as count')
      .countDistinct('user_id as unique_users')
      .where('created_at', '>=', startDate)
      .groupBy('event_name')
      .orderBy('count', 'desc')
      .limit(10);

    // 6. Device Breakdown
    const deviceStats = await db('user_sessions')
      .select('device_type')
      .count('* as sessions')
      .countDistinct('user_id as users')
      .where('start_time', '>=', startDate)
      .groupBy('device_type');

    // 7. Geographic Data
    const geoData = await db('user_sessions')
      .select('country')
      .count('* as sessions')
      .countDistinct('user_id as users')
      .where('start_time', '>=', startDate)
      .groupBy('country')
      .orderBy('sessions', 'desc')
      .limit(10);

    // 8. Conversion Funnel
    const funnelData = await db.raw(`
      WITH funnel_steps AS (
        SELECT 
          user_id,
          MAX(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as step1,
          MAX(CASE WHEN event_name = 'view_item' THEN 1 ELSE 0 END) as step2,
          MAX(CASE WHEN event_name = 'add_to_cart' THEN 1 ELSE 0 END) as step3,
          MAX(CASE WHEN event_name = 'begin_checkout' THEN 1 ELSE 0 END) as step4,
          MAX(CASE WHEN event_name = 'purchase' THEN 1 ELSE 0 END) as step5
        FROM user_events
        WHERE created_at >= ?
        GROUP BY user_id
      )
      SELECT 
        SUM(step1) as homepage,
        SUM(step2) as product_view,
        SUM(step3) as add_to_cart,
        SUM(step4) as checkout,
        SUM(step5) as purchase
      FROM funnel_steps
    `, [startDate]);

    // 9. Revenue Metrics
    const revenueMetrics = await db.raw(`
      SELECT 
        DATE(created_at) as date,
        SUM(total) as revenue,
        COUNT(*) as orders,
        AVG(total) as avg_order_value
      FROM orders
      WHERE created_at >= ? AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startDate]);

    // 10. User Retention
    const retentionData = await db.raw(`
      WITH cohorts AS (
        SELECT 
          user_id,
          DATE_TRUNC('week', created_at) as cohort_week
        FROM users
        WHERE created_at >= ?
      )
      SELECT 
        c.cohort_week,
        COUNT(DISTINCT c.user_id) as users,
        COUNT(DISTINCT CASE 
          WHEN s.start_time >= c.cohort_week + INTERVAL '7 days' 
          THEN s.user_id 
        END) as retained_week1,
        COUNT(DISTINCT CASE 
          WHEN s.start_time >= c.cohort_week + INTERVAL '14 days' 
          THEN s.user_id 
        END) as retained_week2
      FROM cohorts c
      LEFT JOIN user_sessions s ON c.user_id = s.user_id
      GROUP BY c.cohort_week
      ORDER BY c.cohort_week DESC
    `, [startDate]);

    res.status(200).json({
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days: daysAgo,
      },
      keyMetrics: {
        totalUsers: totalUsers.count,
        activeUsers: activeUsers.count,
        revenue: revenue.total || 0,
        orders: orders.count,
        avgOrderValue,
        conversionRate: totalUsers.count > 0 
          ? ((orders.count / totalUsers.count) * 100).toFixed(2) + '%'
          : '0%',
      },
      timeSeries: {
        daily: dailyMetrics.rows,
        revenue: revenueMetrics.rows,
      },
      traffic: {
        sources: trafficSources,
        devices: deviceStats,
        geographic: geoData,
      },
      content: {
        topPages,
        topEvents,
      },
      conversions: {
        funnel: funnelData.rows[0],
        retention: retentionData.rows,
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
}
```

#### React Dashboard Component

```typescript
// components/Dashboard/AnalyticsDashboard.tsx
import { useEffect, useState } from 'react';
import { LineChart, BarChart, PieChart } from '@/components/Charts';
import { MetricCard } from '@/components/Dashboard/MetricCard';

interface DashboardData {
  keyMetrics: {
    totalUsers: number;
    activeUsers: number;
    revenue: number;
    orders: number;
    avgOrderValue: number;
    conversionRate: string;
  };
  timeSeries: {
    daily: any[];
    revenue: any[];
  };
  traffic: {
    sources: any[];
    devices: any[];
    geographic: any[];
  };
  content: {
    topPages: any[];
    topEvents: any[];
  };
  conversions: {
    funnel: any;
    retention: any[];
  };
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/custom?period=${period}`);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Users"
          value={data.keyMetrics.totalUsers.toLocaleString()}
          icon="👥"
        />
        <MetricCard
          title="Active Users (7d)"
          value={data.keyMetrics.activeUsers.toLocaleString()}
          icon="🔥"
        />
        <MetricCard
          title="Revenue"
          value={`$${data.keyMetrics.revenue.toLocaleString()}`}
          icon="💰"
        />
        <MetricCard
          title="Conversion Rate"
          value={data.keyMetrics.conversionRate}
          icon="📈"
        />
      </div>

      {/* Time Series Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h2>Daily Active Users</h2>
          <LineChart
            data={data.timeSeries.daily}
            xKey="date"
            yKey="active_users"
          />
        </div>

        <div className="chart-card">
          <h2>Daily Revenue</h2>
          <LineChart
            data={data.timeSeries.revenue}
            xKey="date"
            yKey="revenue"
          />
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="charts-grid">
        <div className="chart-card">
          <h2>Traffic Sources</h2>
          <PieChart
            data={data.traffic.sources}
            nameKey="source"
            valueKey="sessions"
          />
        </div>

        <div className="chart-card">
          <h2>Device Breakdown</h2>
          <BarChart
            data={data.traffic.devices}
            xKey="device_type"
            yKey="sessions"
          />
        </div>
      </div>

      {/* Top Content */}
      <div className="tables-grid">
        <div className="table-card">
          <h2>Top Pages</h2>
          <table>
            <thead>
              <tr>
                <th>Page</th>
                <th>Views</th>
                <th>Unique Visitors</th>
                <th>Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {data.content.topPages.map((page, i) => (
                <tr key={i}>
                  <td>{page.page}</td>
                  <td>{page.views.toLocaleString()}</td>
                  <td>{page.unique_visitors.toLocaleString()}</td>
                  <td>{Math.round(page.avg_time)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <h2>Top Events</h2>
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Count</th>
                <th>Unique Users</th>
              </tr>
            </thead>
            <tbody>
              {data.content.topEvents.map((event, i) => (
                <tr key={i}>
                  <td>{event.event_name}</td>
                  <td>{event.count.toLocaleString()}</td>
                  <td>{event.unique_users.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

### 9.5.2. Automated Reports

```typescript
// pages/api/reports/dashboard.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get key metrics
    const [userCount] = await db('users').count('* as count');
    const [activeUsers] = await db('user_sessions')
      .where('start_time', '>=', new Date(Date.now() - 86400000))
      .countDistinct('user_id as count');

    const [revenue] = await db('orders')
      .where('created_at', '>=', new Date(Date.now() - 2592000000)) // 30 days
      .sum('total as total');

    const [avgOrderValue] = await db('orders')
      .where('created_at', '>=', new Date(Date.now() - 2592000000))
      .avg('total as avg');

    // Get time series data
    const dailyUsers = await db('user_sessions')
      .select(db.raw('DATE(start_time) as date'))
      .countDistinct('user_id as count')
      .where('start_time', '>=', new Date(Date.now() - 2592000000))
      .groupBy(db.raw('DATE(start_time)'))
      .orderBy('date', 'asc');

    const dailyRevenue = await db('orders')
      .select(db.raw('DATE(created_at) as date'))
      .sum('total as revenue')
      .where('created_at', '>=', new Date(Date.now() - 2592000000))
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc');

    // Top products
    const topProducts = await db('order_items')
      .join('products', 'order_items.product_id', 'products.id')
      .select('products.name')
      .sum('order_items.quantity as quantity')
      .sum('order_items.total as revenue')
      .groupBy('products.id', 'products.name')
      .orderBy('revenue', 'desc')
      .limit(10);

    res.status(200).json({
      metrics: {
        totalUsers: userCount.count,
        activeUsers: activeUsers.count,
        monthlyRevenue: revenue.total || 0,
        avgOrderValue: avgOrderValue.avg || 0,
      },
      timeSeries: {
        dailyUsers,
        dailyRevenue,
      },
      topProducts,
    });
  } catch (error) {
    console.error('Dashboard report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}
```

---

### 9.5.3. Data Export & Visualization

```typescript
// services/reportingService.ts
import { db } from '@/lib/database';
import { sendEmail } from './emailService';

export class ReportingService {
  static async generateWeeklyReport() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Gather metrics
    const [newUsers] = await db('users')
      .where('created_at', '>=', startDate)
      .count('* as count');

    const [activeUsers] = await db('user_sessions')
      .where('start_time', '>=', startDate)
      .countDistinct('user_id as count');

    const [orders] = await db('orders')
      .where('created_at', '>=', startDate)
      .count('* as count')
      .sum('total as revenue');

    const topPages = await db('page_views')
      .select('page')
      .count('* as views')
      .where('created_at', '>=', startDate)
      .groupBy('page')
      .orderBy('views', 'desc')
      .limit(10);

    // Generate report
    const report = {
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
      metrics: {
        newUsers: newUsers.count,
        activeUsers: activeUsers.count,
        orders: orders.count,
        revenue: orders.revenue || 0,
      },
      topPages,
    };

    // Send email
    await sendEmail({
      to: 'team@example.com',
      subject: 'Weekly Performance Report',
      template: 'weekly-report',
      data: report,
    });

    return report;
  }

  static async generateMonthlyReport() {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    // Similar implementation for monthly metrics
    // ...

    return report;
  }

  static async exportData(options: {
    type: 'users' | 'orders' | 'events';
    startDate: Date;
    endDate: Date;
    format: 'csv' | 'json';
  }) {
    let query;

    switch (options.type) {
      case 'users':
        query = db('users')
          .where('created_at', '>=', options.startDate)
          .where('created_at', '<=', options.endDate);
        break;
      case 'orders':
        query = db('orders')
          .where('created_at', '>=', options.startDate)
          .where('created_at', '<=', options.endDate);
        break;
      case 'events':
        query = db('user_events')
          .where('created_at', '>=', options.startDate)
          .where('created_at', '<=', options.endDate);
        break;
    }

    const data = await query;

    if (options.format === 'csv') {
      return this.convertToCSV(data);
    }

    return data;
  }

  private static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
```

---

## 9.6. A/B Testing & Experimentation

### 9.6.1. A/B Testing Framework

```typescript
// components/Dashboard/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
}) => {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <h3>{title}</h3>
        {icon && <div className="metric-icon">{icon}</div>}
      </div>
      
      <div className="metric-value">{value}</div>
      
      {change !== undefined && (
        <div className={`metric-change ${changeType}`}>
          {changeType === 'increase' ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
};

// components/Dashboard/Chart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
}

export const Chart: React.FC<ChartProps> = ({ data, xKey, yKey, title }) => {
  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

---

## 9.6. A/B Testing & Experimentation

### 9.6.1. A/B Testing Framework

```typescript
// lib/abTesting.ts
import { db } from './database';

export class ABTesting {
  static async assignVariant(userId: string, experimentId: string): Promise<string> {
    // Check if user already has assignment
    const existing = await db('experiment_assignments')
      .where({ user_id: userId, experiment_id: experimentId })
      .first();

    if (existing) {
      return existing.variant;
    }

    // Get experiment configuration
    const experiment = await db('experiments')
      .where('id', experimentId)
      .first();

    if (!experiment || !experiment.active) {
      return 'control';
    }

    // Assign variant based on traffic allocation
    const random = Math.random();
    let cumulative = 0;
    let assignedVariant = 'control';

    for (const [variant, allocation] of Object.entries(experiment.variants)) {
      cumulative += allocation as number;
      if (random < cumulative) {
        assignedVariant = variant;
        break;
      }
    }

    // Save assignment
    await db('experiment_assignments').insert({
      user_id: userId,
      experiment_id: experimentId,
      variant: assignedVariant,
      assigned_at: new Date(),
    });

    return assignedVariant;
  }

  static async trackConversion(
    userId: string,
    experimentId: string,
    metricName: string,
    value: number = 1
  ) {
    const assignment = await db('experiment_assignments')
      .where({ user_id: userId, experiment_id: experimentId })
      .first();

    if (!assignment) return;

    await db('experiment_conversions').insert({
      user_id: userId,
      experiment_id: experimentId,
      variant: assignment.variant,
      metric_name: metricName,
      value,
      created_at: new Date(),
    });
  }

  static async getExperimentResults(experimentId: string) {
    const results = await db('experiment_conversions')
      .select('variant')
      .count('* as conversions')
      .sum('value as total_value')
      .where('experiment_id', experimentId)
      .groupBy('variant');

    const assignments = await db('experiment_assignments')
      .select('variant')
      .count('* as users')
      .where('experiment_id', experimentId)
      .groupBy('variant');

    return results.map(result => {
      const assignment = assignments.find(a => a.variant === result.variant);
      return {
        variant: result.variant,
        users: assignment?.users || 0,
        conversions: result.conversions,
        conversionRate: assignment?.users
          ? (result.conversions / assignment.users) * 100
          : 0,
        totalValue: result.total_value,
      };
    });
  }
}
```

---

### 9.6.2. Statistical Significance

```typescript
// lib/statistics.ts

/**
 * Calculate z-score for A/B test
 * 
 * @example
 * const control = { conversions: 120, visitors: 1000 };
 * const variant = { conversions: 150, visitors: 1000 };
 * const zScore = calculateZScore(control, variant);
 */
export function calculateZScore(
  control: { conversions: number; visitors: number },
  variant: { conversions: number; visitors: number }
): number {
  const p1 = control.conversions / control.visitors;
  const p2 = variant.conversions / variant.visitors;
  
  const pPool = (control.conversions + variant.conversions) / 
                (control.visitors + variant.visitors);
  
  const se = Math.sqrt(pPool * (1 - pPool) * 
                      (1 / control.visitors + 1 / variant.visitors));
  
  return (p2 - p1) / se;
}

/**
 * Calculate p-value from z-score
 * 
 * @example
 * const zScore = 2.5;
 * const pValue = calculatePValue(zScore);
 * console.log(`p-value: ${pValue}`); // 0.0062 (statistically significant!)
 */
export function calculatePValue(zScore: number): number {
  // Two-tailed test
  const x = Math.abs(zScore);
  const t = 1 / (1 + 0.2316419 * x);
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * 
    (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return 2 * probability;
}

/**
 * Calculate confidence interval
 * 
 * @example
 * const ci = calculateConfidenceInterval(150, 1000, 0.95);
 * console.log(`95% CI: ${ci.lower}% - ${ci.upper}%`);
 */
export function calculateConfidenceInterval(
  conversions: number,
  visitors: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  const conversionRate = conversions / visitors;
  const zScore = confidenceLevel === 0.95 ? 1.96 : 2.58; // 95% or 99%
  
  const se = Math.sqrt((conversionRate * (1 - conversionRate)) / visitors);
  const margin = zScore * se;
  
  return {
    lower: Math.max(0, (conversionRate - margin) * 100),
    upper: Math.min(100, (conversionRate + margin) * 100),
  };
}

/**
 * Calculate required sample size
 * 
 * @example
 * const sampleSize = calculateSampleSize(0.10, 0.12, 0.05, 0.80);
 * console.log(`Need ${sampleSize} users per variant`);
 */
export function calculateSampleSize(
  baselineRate: number,
  minimumDetectableEffect: number,
  alpha: number = 0.05,
  power: number = 0.80
): number {
  const zAlpha = 1.96; // for alpha = 0.05 (two-tailed)
  const zBeta = 0.84;  // for power = 0.80
  
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);
  const pAvg = (p1 + p2) / 2;
  
  const n = Math.pow(zAlpha + zBeta, 2) * 2 * pAvg * (1 - pAvg) / 
            Math.pow(p2 - p1, 2);
  
  return Math.ceil(n);
}

/**
 * Complete A/B test analysis
 */
export function analyzeABTest(
  control: { conversions: number; visitors: number },
  variant: { conversions: number; visitors: number }
) {
  const controlRate = control.conversions / control.visitors;
  const variantRate = variant.conversions / variant.visitors;
  const lift = ((variantRate - controlRate) / controlRate) * 100;
  
  const zScore = calculateZScore(control, variant);
  const pValue = calculatePValue(zScore);
  const isSignificant = pValue < 0.05;
  
  const controlCI = calculateConfidenceInterval(control.conversions, control.visitors);
  const variantCI = calculateConfidenceInterval(variant.conversions, variant.visitors);
  
  return {
    control: {
      rate: (controlRate * 100).toFixed(2) + '%',
      confidenceInterval: `${controlCI.lower.toFixed(2)}% - ${controlCI.upper.toFixed(2)}%`,
    },
    variant: {
      rate: (variantRate * 100).toFixed(2) + '%',
      confidenceInterval: `${variantCI.lower.toFixed(2)}% - ${variantCI.upper.toFixed(2)}%`,
    },
    lift: lift.toFixed(2) + '%',
    pValue: pValue.toFixed(4),
    isSignificant,
    recommendation: isSignificant 
      ? (lift > 0 ? 'Deploy variant' : 'Keep control')
      : 'Continue testing',
  };
}
```

---

### 9.6.3. React A/B Testing Hook

```typescript
// hooks/useABTest.ts
import { useEffect, useState } from 'react';
import { ABTesting } from '@/lib/abTesting';

/**
 * Hook for A/B testing
 * 
 * @example
 * function PricingPage() {
 *   const variant = useABTest('pricing_experiment');
 *   
 *   return (
 *     <div>
 *       {variant === 'control' && <PricingA />}
 *       {variant === 'variant_b' && <PricingB />}
 *     </div>
 *   );
 * }
 */
export function useABTest(experimentId: string): string {
  const [variant, setVariant] = useState<string>('control');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const assignVariant = async () => {
      try {
        const userId = getUserId(); // Get from auth context
        const assigned = await ABTesting.assignVariant(userId, experimentId);
        setVariant(assigned);
      } catch (error) {
        console.error('Failed to assign variant:', error);
        setVariant('control');
      } finally {
        setLoading(false);
      }
    };

    assignVariant();
  }, [experimentId]);

  return loading ? 'control' : variant;
}

/**
 * Hook for tracking experiment conversions
 * 
 * @example
 * function CheckoutButton() {
 *   const trackConversion = useABTestConversion('pricing_experiment', 'purchase');
 *   
 *   const handleCheckout = () => {
 *     // ... checkout logic
 *     trackConversion(99.99); // Track with value
 *   };
 *   
 *   return <button onClick={handleCheckout}>Checkout</button>;
 * }
 */
export function useABTestConversion(experimentId: string, metricName: string) {
  return async (value?: number) => {
    try {
      const userId = getUserId();
      await ABTesting.trackConversion(userId, experimentId, metricName, value);
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  };
}

function getUserId(): string {
  // Get from auth context or localStorage
  return localStorage.getItem('user_id') || 'anonymous';
}
```

---

## 9.7. Kết luận

```typescript
// lib/abTesting.ts
import { db } from './database';

export class ABTesting {
  static async assignVariant(userId: string, experimentId: string): Promise<string> {
    // Check if user already has assignment
    const existing = await db('experiment_assignments')
      .where({ user_id: userId, experiment_id: experimentId })
      .first();

    if (existing) {
      return existing.variant;
    }

    // Get experiment configuration
    const experiment = await db('experiments')
      .where('id', experimentId)
      .first();

    if (!experiment || !experiment.active) {
      return 'control';
    }

    // Assign variant based on traffic allocation
    const random = Math.random();
    let cumulative = 0;
    let assignedVariant = 'control';

    for (const [variant, allocation] of Object.entries(experiment.variants)) {
      cumulative += allocation as number;
      if (random < cumulative) {
        assignedVariant = variant;
        break;
      }
    }

    // Save assignment
    await db('experiment_assignments').insert({
      user_id: userId,
      experiment_id: experimentId,
      variant: assignedVariant,
      assigned_at: new Date(),
    });

    return assignedVariant;
  }

  static async trackConversion(
    userId: string,
    experimentId: string,
    metricName: string,
    value: number = 1
  ) {
    const assignment = await db('experiment_assignments')
      .where({ user_id: userId, experiment_id: experimentId })
      .first();

    if (!assignment) return;

    await db('experiment_conversions').insert({
      user_id: userId,
      experiment_id: experimentId,
      variant: assignment.variant,
      metric_name: metricName,
      value,
      created_at: new Date(),
    });
  }

  static async getExperimentResults(experimentId: string) {
    const results = await db('experiment_conversions')
      .select('variant')
      .count('* as conversions')
      .sum('value as total_value')
      .where('experiment_id', experimentId)
      .groupBy('variant');

    const assignments = await db('experiment_assignments')
      .select('variant')
      .count('* as users')
      .where('experiment_id', experimentId)
      .groupBy('variant');

    return results.map(result => {
      const assignment = assignments.find(a => a.variant === result.variant);
      return {
        variant: result.variant,
        users: assignment?.users || 0,
        conversions: result.conversions,
        conversionRate: assignment?.users
          ? (result.conversions / assignment.users) * 100
          : 0,
        totalValue: result.total_value,
      };
    });
  }
}
```

## 9.5. Kết luận

Phân tích và báo cáo là công cụ quan trọng để hiểu rõ performance của ứng dụng và hành vi người dùng. Data-driven decisions giúp cải thiện product và tối ưu hóa trải nghiệm người dùng.

---

**Ngày cập nhật**: 05/11/2025  
**Phiên bản**: 1.0
