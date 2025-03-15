# MediSur-Gov Frontend

This is the admin dashboard frontend for the MediSur-Gov hospital management system. It provides a comprehensive interface for managing hospitals, patients, appointments, and medical records.

## Features

- **Dashboard**: Overview of system statistics and activity
- **Hospital Management**: Add, edit, view, and delete hospitals
- **Patient Management**: Manage patient records and medical information
- **Appointment Management**: Schedule and track patient appointments
- **Medical Records**: Access and update patient medical history
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React**: Frontend library
- **TypeScript**: Type-safe JavaScript
- **Material UI**: Component library for consistent design
- **React Router**: Navigation and routing
- **Axios**: API client for backend communication
- **Chart.js**: Data visualization
- **React Hook Form**: Form handling and validation
- **Date-fns**: Date utility library

## Setup and Installation

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```

### Configuration

Create a `.env.local` file in the root directory with the following variables:

```
VITE_API_URL=http://localhost:8000
```

Replace the URL with your backend API endpoint.

### Running the Development Server

```
npm run dev
```

This will start the development server at http://localhost:5173.

### Building for Production

```
npm run build
```

This will create an optimized production build in the `dist` directory.

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Page layout components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── theme/           # UI theme configuration
│   ├── types/           # TypeScript types and interfaces
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Entry point
├── package.json
└── README.md
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request

## License

[MIT](LICENSE)
