# WebSentinals Next.js Frontend Setup Instructions

## Overview

This document provides complete setup instructions for the WebSentinals Next.js frontend application. The new frontend (`frontend1`) is a modern React application built with Next.js, TypeScript, and Tailwind CSS.

## Quick Start

### Method 1: Using the Batch Script (Windows)

1. Open Command Prompt or PowerShell as Administrator
2. Navigate to the frontend1 directory:
   ```cmd
   cd "d:\Web Sentinals\Crawler\frontend1"
   ```
3. Run the startup script:
   ```cmd
   start_frontend.bat
   ```

### Method 2: Manual Setup

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Recommended version: 18.x or higher
   - Verify installation: `node --version`

2. **Navigate to the frontend directory:**
   ```bash
   cd "d:\Web Sentinals\Crawler\frontend1"
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open your browser and go to: http://localhost:3001

## System Requirements

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Browser**: Modern browser with ES6+ support
- **Memory**: Minimum 4GB RAM recommended
- **Storage**: At least 500MB free space for dependencies

## Project Structure

```
frontend1/
├── components/              # React components
│   ├── Header.tsx          # Navigation header
│   ├── ScannerSection.tsx  # URL scanner interface
│   ├── StatsSection.tsx    # Statistics dashboard
│   ├── ChartsSection.tsx   # Data visualization
│   ├── VulnerabilitiesSection.tsx  # Vulnerability list
│   ├── RecentScansSection.tsx      # Historical scans
│   ├── VulnerabilityModal.tsx      # Detailed vulnerability view
│   └── index.ts            # Component exports
├── lib/                    # Utility libraries
│   ├── api.ts             # Backend API integration
│   └── utils.ts           # Helper functions
├── pages/                 # Next.js pages
│   ├── _app.tsx          # Application wrapper
│   ├── _document.tsx     # HTML document structure
│   └── index.tsx         # Main dashboard page
├── styles/               # Styling
│   └── globals.css       # Global styles with Tailwind
├── types/                # TypeScript definitions
│   └── index.ts          # Application types
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── next.config.js        # Next.js configuration
└── README.md             # Documentation
```

## Features

### 🚀 Modern Technology Stack
- **Next.js 14**: Latest React framework with App Router
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

### 🎨 Enhanced UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern Interface**: Clean, professional design with smooth animations
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Dark Mode Ready**: Easy to implement dark theme support

### 📊 Advanced Data Visualization
- **Interactive Charts**: Pie charts, bar charts, and trend analysis
- **Real-time Updates**: Live progress tracking during scans
- **Filtering**: Advanced filtering options for vulnerability data
- **Export Capabilities**: Easy data export and reporting

### 🔧 Developer Experience
- **Hot Reload**: Instant updates during development
- **Type Safety**: Comprehensive TypeScript coverage
- **ESLint**: Code quality and consistency enforcement
- **Component Architecture**: Modular, reusable components

## Configuration

### Environment Variables

Create a `.env.local` file in the frontend1 directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Custom port for frontend
PORT=3001
```

### Customization

#### Styling
- Modify `tailwind.config.js` for theme customization
- Update `styles/globals.css` for global styles
- Component-specific styles use Tailwind classes

#### API Integration
- Backend endpoints configured in `lib/api.ts`
- Type definitions in `types/index.ts`
- Error handling and retry logic built-in

## Available Scripts

```bash
# Development
npm run dev          # Start development server on port 3001
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Run ESLint for code quality

# Utilities
npm run type-check   # TypeScript type checking
npm audit            # Security vulnerability check
npm fund             # View funding information for dependencies
```

## Backend Integration

The frontend communicates with the Python backend through REST APIs:

### API Endpoints
- `POST /api/start-scan` - Initiate new vulnerability scan
- `GET /api/scan/:id/status` - Check scan progress
- `GET /api/scan/:id/results` - Retrieve scan results
- `GET /api/scans` - Get recent scan history
- `GET /api/health` - Backend health check

### Data Flow
1. User enters URL in scanner interface
2. Frontend sends scan request to backend
3. Backend starts Python vulnerability scanner
4. Frontend polls for progress updates
5. Results displayed with charts and detailed analysis

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution**: Change port in package.json or stop conflicting process

#### Dependencies Installation Fails
```bash
npm ERR! peer dep missing
```
**Solution**: 
```bash
npm install --legacy-peer-deps
# or
npm install --force
```

#### TypeScript Errors
```bash
Type 'X' is not assignable to type 'Y'
```
**Solution**: Check type definitions in `types/index.ts` and component props

#### Backend Connection Issues
```bash
Network Error: Failed to fetch
```
**Solution**: Ensure backend is running on http://localhost:3000

### Performance Optimization

#### Development
- Use `npm run dev` for hot reload
- Enable React DevTools for debugging
- Use TypeScript strict mode for better error catching

#### Production
- Run `npm run build` for optimized build
- Enable compression in production server
- Use CDN for static assets

## Deployment

### Development Deployment
```bash
npm run dev
```
Access at: http://localhost:3001

### Production Deployment
```bash
npm run build
npm run start
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Security Considerations

### Frontend Security
- Environment variables properly configured
- API endpoints use HTTPS in production
- Input validation on all forms
- XSS protection enabled

### API Communication
- CORS properly configured
- Request/response validation
- Error handling without sensitive data exposure
- Rate limiting on API endpoints

## Browser Compatibility

### Supported Browsers
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Polyfills
- Automatically included by Next.js
- ES6+ features supported
- CSS Grid and Flexbox support

## Maintenance

### Regular Updates
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Security audit
npm audit
npm audit fix
```

### Monitoring
- Check console for JavaScript errors
- Monitor API response times
- Track user engagement metrics
- Performance monitoring with Web Vitals

## Support and Documentation

### Additional Resources
- **Next.js Documentation**: https://nextjs.org/docs
- **React Documentation**: https://reactjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

### Getting Help
1. Check the browser console for errors
2. Review the backend logs
3. Verify API connectivity
4. Check environment variables
5. Restart development server

## Contributing

### Development Workflow
1. Create feature branch from main
2. Make changes with proper TypeScript types
3. Test functionality thoroughly
4. Run linting and type checking
5. Submit pull request with description

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Tailwind CSS for styling
- Write descriptive component interfaces
- Add proper error handling

---

**Note**: This frontend is designed to work seamlessly with the existing WebSentinals backend. Ensure the backend server is running before starting the frontend application.
