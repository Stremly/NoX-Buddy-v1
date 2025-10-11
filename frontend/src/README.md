# Nox-Buddy Frontend Structure

## 📁 Folder Organization

```
src/
├── 📄 App.jsx                 # Main App component
├── 📄 main.jsx               # React entry point
├── 📄 README.md              # This file
│
├── 📁 pages/                 # Page-level components
│   ├── 📄 index.js          # Barrel exports
│   ├── 📁 Home/             # Homepage
│   │   └── 📄 index.jsx
│   ├── 📁 Settings/         # Settings page
│   │   └── 📄 index.jsx
│   └── 📁 VoiceRecording/   # Voice recording page
│       └── 📄 index.jsx
│
├── 📁 components/           # Reusable components
│   ├── 📁 UI/              # UI components
│   │   ├── 📄 index.js     # Barrel exports
│   │   ├── 📄 SiriWaveform.jsx
│   │   └── 📄 DragHandle.jsx
│   └── 📁 Layout/          # Layout components
│       ├── 📄 index.js     # Barrel exports
│       └── 📄 AppLoader.jsx
│
├── 📁 utils/               # Utilities
│   ├── 📄 index.js        # Barrel exports
│   └── 📄 constants.js    # App constants
│
├── 📁 hooks/              # Custom React hooks
│   └── 📄 (future hooks)
│
└── 📁 assets/             # Static assets
    ├── 📁 images/         # Images
    └── 📁 styles/         # Stylesheets
        └── 📄 globals.css
```

## 🎯 Benefits

- **Clear separation** of pages vs components
- **Barrel exports** for cleaner imports
- **Organized by feature** and responsibility
- **Scalable structure** for future growth
- **Easy to navigate** and maintain

## 📝 Import Examples

```javascript
// Pages
import { Home, Settings, VoiceRecording } from './pages';

// UI Components
import { SiriWaveform, DragHandle } from './components/UI';

// Layout Components
import { AppLoader } from './components/Layout';

// Constants
import { APP_CONFIG, COLORS } from './utils';
```
