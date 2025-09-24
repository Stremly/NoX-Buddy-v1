# Nox-Buddy Frontend

Modern React frontend for the Nox-Buddy desktop companion application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠 Development

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Code Quality**: ESLint configuration

## 📦 Dependencies

### Core
- React 18.3.1
- React DOM 18.3.1
- Framer Motion 11.11.17

### Styling
- Tailwind CSS 3.4.14
- Autoprefixer 10.4.20
- PostCSS 8.4.49

### Development
- Vite 5.4.10
- ESLint 9.13.0
- Various Vite plugins

## 🎨 Component Architecture

```
src/components/
├── AppLoader.jsx      # Loading screen with secret code setup
├── Homepage.jsx       # Main chat interface
├── Settings.jsx       # Settings management with tabs
├── LandingPage.jsx    # Legacy authentication (unused)
└── DragHandle.jsx     # Window dragging functionality
```

## 🔧 Build Configuration

- **Vite**: Fast development and optimized builds
- **Tailwind**: Utility-first CSS framework
- **ESLint**: Code quality and consistency

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
