import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  CalendarMonth as AppointmentIcon,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { AppointmentStatus, Hospital as HospitalType, Appointment } from '../types';

// Services
import { getHospitals } from '../services/hospitalService';
import { getPatients } from '../services/patientService';
import { getAppointments } from '../services/appointmentService';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const statusColors = {
  [AppointmentStatus.MISSING_DATA]: {
    background: 'rgba(255, 99, 132, 0.6)',
    border: 'rgba(255, 99, 132, 1)',
  },
  [AppointmentStatus.PENDING]: {
    background: 'rgba(54, 162, 235, 0.6)',
    border: 'rgba(54, 162, 235, 1)',
  },
  [AppointmentStatus.ASSIGNED]: {
    background: 'rgba(255, 206, 86, 0.6)',
    border: 'rgba(255, 206, 86, 1)',
  },
  [AppointmentStatus.FINISHED]: {
    background: 'rgba(75, 192, 192, 0.6)',
    border: 'rgba(75, 192, 192, 1)',
  },
};

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    hospitalsCount: 0,
    patientsCount: 0,
    appointmentsCount: 0,
    medicalRecordsCount: 0,
  });
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentStatusData, setAppointmentStatusData] = useState({
    labels: Object.values(AppointmentStatus).map(status => 
      status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')),
    datasets: [{
      label: 'Appointments by Status',
      data: [0, 0, 0, 0],
      backgroundColor: Object.values(statusColors).map(color => color.background),
      borderColor: Object.values(statusColors).map(color => color.border),
      borderWidth: 1,
    }],
  });
  const [monthlyAppointmentsData, setMonthlyAppointmentsData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Appointments',
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }],
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Update charts when selectedHospital changes
  useEffect(() => {
    if (appointments.length > 0) {
      updateCharts();
    }
  }, [selectedHospital, appointments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch hospitals
      const hospitalsResponse = await getHospitals(0, 100);
      setHospitals(hospitalsResponse.data);
      
      // Fetch patients
      const patientsResponse = await getPatients(0, 100);
      
      // Fetch appointments
      const appointmentsResponse = await getAppointments(0, 500);
      setAppointments(appointmentsResponse.data);
      
      // Set stats
      setStats({
        hospitalsCount: hospitalsResponse.data.length,
        patientsCount: patientsResponse.data.length,
        appointmentsCount: appointmentsResponse.data.length,
        medicalRecordsCount: 0, // No direct API for medical records count
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const updateCharts = () => {
    // Filter appointments by selected hospital if needed
    const filteredAppointments = selectedHospital === 'all' 
      ? appointments 
      : appointments.filter(app => app.hospital_assigned === selectedHospital);
    
    // Update appointment status chart
    const statusCounts = {
      [AppointmentStatus.MISSING_DATA]: 0,
      [AppointmentStatus.PENDING]: 0,
      [AppointmentStatus.ASSIGNED]: 0,
      [AppointmentStatus.FINISHED]: 0,
    };
    
    filteredAppointments.forEach(appointment => {
      statusCounts[appointment.status]++;
    });
    
    setAppointmentStatusData({
      labels: Object.values(AppointmentStatus).map(status => 
        status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')),
      datasets: [{
        label: 'Appointments by Status',
        data: Object.values(statusCounts),
        backgroundColor: Object.values(statusColors).map(color => color.background),
        borderColor: Object.values(statusColors).map(color => color.border),
        borderWidth: 1,
      }],
    });
    
    // Update monthly appointments chart
    const monthlyCounts = Array(12).fill(0);
    
    filteredAppointments.forEach(appointment => {
      // Use request_start_time to determine the month
      if (appointment.request_start_time) {
        const month = new Date(appointment.request_start_time).getMonth();
        monthlyCounts[month]++;
      }
    });
    
    setMonthlyAppointmentsData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Appointments by Month',
        data: monthlyCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }],
    });
  };

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

  const handleHospitalChange = (event: SelectChangeEvent) => {
    setSelectedHospital(event.target.value as string);
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
        
        {/* <Grid item xs={12} sm={6} md={3}>
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
        </Grid> */}
      </Grid>
      
      {/* Hospital Selection */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="hospital-select-label">Select Hospital</InputLabel>
              <Select
                labelId="hospital-select-label"
                id="hospital-select"
                value={selectedHospital}
                label="Select Hospital"
                onChange={handleHospitalChange}
              >
                <MenuItem value="all">All Hospitals</MenuItem>
                {hospitals.map((hospital) => (
                  <MenuItem key={hospital.id} value={hospital.id}>{hospital.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
    </Box>
  );
};

export default DashboardPage; 