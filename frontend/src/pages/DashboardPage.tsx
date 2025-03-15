import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  CalendarMonth as AppointmentIcon,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { AppointmentStatus } from '../types';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Mock data for stats
const mockStats = {
  hospitalsCount: 8,
  patientsCount: 245,
  appointmentsCount: 120,
  medicalRecordsCount: 352,
};

// Mock data for appointment status distribution
const appointmentStatusData = {
  labels: ['Missing Data', 'Pending', 'Assigned', 'Finished'],
  datasets: [
    {
      label: 'Appointments by Status',
      data: [12, 35, 45, 28],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

// Mock data for monthly appointments
const monthlyAppointmentsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Appointments',
      data: [15, 22, 18, 25, 30, 42, 38, 35, 40, 45, 35, 28],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    },
  ],
};

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(mockStats);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Custom options for bar chart
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Appointments',
      },
    },
  };

  // Custom options for pie chart
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Appointment Status Distribution',
      },
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Overview
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
              bgcolor: 'primary.light',
              color: 'white',
            }}
          >
            <Box display="flex" alignItems="center">
              <HospitalIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Hospitals
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              {stats.hospitalsCount}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
              bgcolor: 'secondary.light',
              color: 'white',
            }}
          >
            <Box display="flex" alignItems="center">
              <PersonIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Patients
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              {stats.patientsCount}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
              bgcolor: 'info.light',
              color: 'white',
            }}
          >
            <Box display="flex" alignItems="center">
              <AppointmentIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Appointments
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              {stats.appointmentsCount}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
              bgcolor: 'success.light',
              color: 'white',
            }}
          >
            <Box display="flex" alignItems="center">
              <MedicalServicesIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Medical Records
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              {stats.medicalRecordsCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Pie data={appointmentStatusData} options={pieOptions} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Bar data={monthlyAppointmentsData} options={barOptions} />
          </Paper>
        </Grid>
      </Grid>
      
      {/* Recent Activity */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" component="div" gutterBottom>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 200, overflow: 'auto' }}>
              {/* Mock activity items */}
              {[1, 2, 3, 4, 5].map((item) => (
                <Box key={item} sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body1">
                    {item % 2 === 0
                      ? 'New appointment created for Patient #1234'
                      : 'Medical record updated for Patient #5678'}
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage; 