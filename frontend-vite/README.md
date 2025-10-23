# Frontend Vite - Production Ready CodeGrader# React + TypeScript + Vite



Phiên bản frontend production-ready sử dụng **Vite + React** thay thế cho Next.js, với **100% cùng UI/UX Neo-Brutalism design**.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## ✨ FeaturesCurrently, two official plugins are available:



- ⚡ **Vite 7** - Lightning fast HMR- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- ⚛️ **React 19** - Latest stable- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- 🎨 **Neo-Brutalism** - 100% match với frontend-new

- 🌗 **Dark/Light Mode** - Persistent theme## React Compiler

- 📱 **Responsive** - Mobile-first

- 🔒 **TypeScript** - Strict modeThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

- 🚀 **Optimized** - Code splitting, lazy loading

- 🐳 **Docker Ready** - Multi-stage build + Nginx## Expanding the ESLint configuration



## 🚀 Quick StartIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:



### Development```js

```bashexport default defineConfig([

npm install  globalIgnores(['dist']),

npm run dev  {

# → http://localhost:3000    files: ['**/*.{ts,tsx}'],

```    extends: [

      // Other configs...

### Production (Docker)

```bash      // Remove tseslint.configs.recommended and replace with this

# Build and run      tseslint.configs.recommendedTypeChecked,

docker build -t frontend-vite .      // Alternatively, use this for stricter rules

docker run -p 3000:80 frontend-vite      tseslint.configs.strictTypeChecked,

      // Optionally, add this for stylistic rules

# Or with docker-compose      tseslint.configs.stylisticTypeChecked,

docker-compose up frontend-vite

```      // Other configs...

    ],

## 📦 Tech Stack    languageOptions: {

      parserOptions: {

- **Framework**: Vite 7 + React 19        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **Styling**: Tailwind CSS 4 + CSS Variables        tsconfigRootDir: import.meta.dirname,

- **UI**: Radix UI primitives      },

- **Routing**: React Router v7      // other options...

- **Editor**: Monaco Editor (lazy)    },

- **HTTP**: Axios  },

- **Deployment**: Nginx])

```

## 🎨 Neo-Brutalism Design

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

### Colors (Light Mode)

- Primary: Purple/Blue `oklch(0.5 0.27 264)````js

- Secondary: Yellow `oklch(0.7 0.22 45)`// eslint.config.js

- Accent: Green/Cyan `oklch(0.6 0.25 145)`import reactX from 'eslint-plugin-react-x'

- Border: Black `oklch(0.05 0 0)`import reactDom from 'eslint-plugin-react-dom'



### Dark Modeexport default defineConfig([

- Background: `oklch(0.15 0.015 264)`  globalIgnores(['dist']),

- Primary: `oklch(0.60 0.22 270)`  {

- Accent: `oklch(0.65 0.20 190)`    files: ['**/*.{ts,tsx}'],

    extends: [

### Elements      // Other configs...

✅ Thick borders `border-4`      // Enable lint rules for React

✅ Bold text `font-black uppercase`      reactX.configs['recommended-typescript'],

✅ Drop shadows `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`      // Enable lint rules for React DOM

✅ Geometric shapes      reactDom.configs.recommended,

    ],

## 📁 Structure    languageOptions: {

      parserOptions: {

```        project: ['./tsconfig.node.json', './tsconfig.app.json'],

src/        tsconfigRootDir: import.meta.dirname,

├── pages/          # Routes      },

├── components/     # UI components      // other options...

├── hooks/problem/  # Custom hooks    },

├── services/       # API  },

├── types/          # TypeScript])

├── lib/            # Utils```

└── App.tsx         # Router
```

## 🔌 API

```typescript
import { authAPI, classAPI, problemAPI } from '@/services/api'

await authAPI.login({ email, password })
await classAPI.getAll()
await problemAPI.getById(id)
```

## 🐳 Docker

### Multi-Stage Build
1. **Build**: Node 20 → `npm run build`
2. **Serve**: Nginx → Static files

### Nginx Config
- SPA routing: `try_files $uri /index.html`
- API proxy: `/api` → `backend:5000`
- Gzip compression
- 1-year cache for assets

## 📊 Performance

**Production Bundle**:
- Total: ~578 KB
- Gzipped: ~186 KB
- HTML: 0.54 KB
- CSS: 88 KB (14 KB gzipped)
- JS: 520 KB (156 KB gzipped)

**Optimizations**:
✅ Code splitting
✅ Lazy loading
✅ Tree shaking
✅ Minification

## 🆚 Vite vs Next.js

| | Vite | Next.js |
|-|------|---------|
| Build | ⚡ < 5s | 🚀 ~10s |
| Bundle | 578 KB | ~200 KB |
| SSR/SSG | ❌ | ✅ |
| Docker | 25 MB | 350 MB |
| Use Case | SPA | Full-stack |

## 📝 Scripts

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # ESLint
```

## 🔄 Migration (Next.js → Vite)

### Routing
```diff
- import { useRouter } from 'next/navigation'
+ import { useNavigate } from 'react-router-dom'

- router.push('/path')
+ navigate('/path')

- <Link href="/path">
+ <Link to="/path">
```

### Env Vars
```diff
- process.env.NEXT_PUBLIC_*
+ import.meta.env.VITE_*
```

### Client Directive
```diff
- "use client"  // Remove
```

## 📞 Support

- GitHub: [code-grader-project](https://github.com/Venus2Mice/code-grader-project)
- Issues: [Report Bug](https://github.com/Venus2Mice/code-grader-project/issues)

## 📄 License

MIT
