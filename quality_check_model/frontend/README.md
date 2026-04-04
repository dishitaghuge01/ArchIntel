# Floor Plan Quality Check Frontend

A React-based frontend application for analyzing and evaluating floor plan quality using AI-powered insights.

## Features

- **Floor Plan Analysis**: Upload SVG floor plans for comprehensive quality assessment
- **AI-Powered Chat**: Ask questions about your floor plans and get intelligent responses
- **Quality Metrics**: DQI (Design Quality Index) scoring and detailed insights
- **Interactive UI**: Modern, responsive interface built with React and Tailwind CSS

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Zustand** for state management
- **TanStack Query** for API state management
- **shadcn/ui** for UI components

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API base URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: Base URL for the backend API (default: http://localhost:8000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and configurations
├── pages/         # Page components
└── types/         # TypeScript type definitions
```
