# DormDash - React Frontend

This is the React TypeScript version of the DormDash application, converted from the original Streamlit implementation for better frontend UI control and performance.

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **CSS** - Component-scoped styling

## Project Structure

```
react-app/
├── src/
│   ├── pages/           # Page components
│   │   ├── LandingPage.tsx
│   │   ├── CustomerLogin.tsx
│   │   ├── WorkerLogin.tsx
│   │   ├── RestaurantBrowse.tsx
│   │   ├── WorkerDashboard.tsx
│   │   ├── WorkerOrders.tsx
│   │   ├── CustomerOrders.tsx
│   │   └── Account.tsx
│   ├── components/      # Reusable components
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app with routing
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the react-app directory:
```bash
cd react-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features Implemented

### ✅ Completed
- [x] Landing page with role selection
- [x] Project structure and configuration
- [x] TypeScript types and interfaces
- [x] Routing setup

### 🚧 In Progress
- [ ] Customer login page
- [ ] Worker login page
- [ ] Restaurant browsing page
- [ ] Worker dashboard
- [ ] Worker orders page
- [ ] Customer orders page
- [ ] Account page

## Key Differences from Streamlit

1. **Better Performance** - No Python backend needed for UI
2. **More Control** - Full control over UI/UX and interactions
3. **Better Routing** - Client-side routing with React Router
4. **Type Safety** - TypeScript for better developer experience
5. **Modern Tooling** - Vite for fast builds and hot module replacement

## State Management

Currently using React's built-in useState for authentication state. For a production app, consider:
- Context API for global state
- React Query for server state
- Zustand or Redux for complex state management

## Next Steps

To complete the migration:
1. Implement all page components
2. Create reusable UI components (Header, Card, Button, etc.)
3. Add form validation
4. Set up a backend API (Express, FastAPI, etc.)
5. Implement real authentication
6. Add tests
7. Deploy to production

## Login Credentials (Demo)

- Username: `login`
- Password: `login`

## Notes

This is a faithful recreation of the Streamlit UI with improvements:
- Better component organization
- Type-safe code
- Faster load times
- More responsive design
- Better browser compatibility
