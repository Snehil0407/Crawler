# WebSentinals Next.js Frontend

This is the Next.js frontend for the WebSentinals vulnerability scanner application, built with TypeScript and Tailwind CSS.

## Features

- **Modern UI**: Built with Next.js 14 and React 18
- **Responsive Design**: Tailwind CSS for beautiful, responsive layouts
- **TypeScript**: Full type safety throughout the application
- **Real-time Scanning**: Interactive vulnerability scanning with progress tracking
- **Data Visualization**: Charts and graphs using Chart.js
- **Component-based Architecture**: Modular, reusable React components

## Technologies Used

- **Next.js 14** - React framework for production
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js & React-ChartJS-2** - Data visualization
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client for API calls

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on `http://localhost:3000`

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend1
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
frontend1/
├── components/          # Reusable React components
│   ├── Header.tsx
│   ├── ScannerSection.tsx
│   ├── StatsSection.tsx
│   ├── ChartsSection.tsx
│   ├── VulnerabilitiesSection.tsx
│   ├── RecentScansSection.tsx
│   └── VulnerabilityModal.tsx
├── lib/                 # Utility functions and API clients
│   ├── api.ts          # API client functions
│   └── utils.ts        # Helper utilities
├── pages/              # Next.js pages
│   ├── _app.tsx        # App component
│   ├── _document.tsx   # Document component
│   └── index.tsx       # Main dashboard page
├── styles/             # Global styles
│   └── globals.css     # Global CSS with Tailwind
├── types/              # TypeScript type definitions
│   └── index.ts        # Application types
└── public/             # Static assets
```

## Components

### Header
Navigation header with logo and menu items.

### ScannerSection
URL input and scan initiation with real-time progress tracking.

### StatsSection
Dashboard statistics showing vulnerability counts by severity.

### ChartsSection
Data visualization with pie charts and bar charts for vulnerability analysis.

### VulnerabilitiesSection
List of detected vulnerabilities with filtering capabilities.

### RecentScansSection
Historical scan results with quick access to previous scans.

### VulnerabilityModal
Detailed view of individual vulnerabilities with recommendations.

## API Integration

The frontend communicates with the backend through REST API endpoints:

- `POST /api/start-scan` - Initiate new scan
- `GET /api/scan/:id/status` - Check scan status
- `GET /api/scan/:id/results` - Get scan results
- `GET /api/scans` - Get recent scans
- `GET /api/health` - Health check

## Styling

The application uses Tailwind CSS for styling with:

- Custom color palette for severity levels
- Responsive design breakpoints
- Dark mode support (configurable)
- Smooth animations and transitions

## Type Safety

Full TypeScript integration with:

- Strict type checking
- Interface definitions for all data structures
- Type-safe API responses
- Component prop validation

## Development

### Adding New Components

1. Create component in `components/` directory
2. Define TypeScript interfaces for props
3. Export component for use in pages
4. Add proper styling with Tailwind CSS

### API Updates

1. Update types in `types/index.ts`
2. Modify API functions in `lib/api.ts`
3. Update components to handle new data

### Styling Changes

1. Modify `tailwind.config.js` for theme changes
2. Update `globals.css` for global styles
3. Use Tailwind classes in components

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

3. Configure reverse proxy to serve frontend on desired port

## Environment Variables

Create a `.env.local` file for configuration:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow TypeScript strict mode guidelines
2. Use Tailwind CSS for all styling
3. Ensure components are properly typed
4. Add proper error handling
5. Test responsive design on multiple devices

## License

MIT License - see LICENSE file for details.
