import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  useTheme,
  Chip,
  Button,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { format, subDays, differenceInDays, addDays, parseISO } from 'date-fns';
import { getContagiousAppointments } from '../services/appointmentService';
import { getHospitals } from '../services/hospitalService';
import { Appointment, Hospital } from '../types';
import { calculateGrowthRate, generatePredictions, groupAppointmentsByDate } from '../utils/pandemicUtils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PandemicTrackingPage: React.FC = () => {
  const theme = useTheme();
  
  // State for filters
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  
  // State for data
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [predictionDays, setPredictionDays] = useState<number>(7);
  
  // Fetch hospitals for the filter dropdown
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await getHospitals(0, 1000);
        console.log(response.data);
        setHospitals(response.data);
      } catch (err) {
        console.error('Error fetching hospitals:', err);
        setError('Failed to load hospitals data');
      }
    };
    
    fetchHospitals();
  }, []);
  
  // Fetch appointments based on filters
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!startDate || !endDate) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        
        const params: {
          hospitalId?: string;
          startDate: string;
          endDate: string;
        } = {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        };
        
        if (selectedHospital) {
          params.hospitalId = selectedHospital;
        }
        
        const response = await getContagiousAppointments(params);
        console.log(response.data);
        setFilteredAppointments(response.data);

        const params2: {
          hospitalId?: string;
          startDate: string;
          endDate: string;
        } = {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        }
        const response2 = await getContagiousAppointments(params2);
        console.log(response2.data);
        setAppointments(response2.data);
      } catch (err) {
        console.error('Error fetching contagious appointments:', err);
        setError('Failed to load contagious cases data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [selectedHospital, startDate, endDate]);
  
  // Process data for the chart
  const { 
    chartData, 
    totalCases, 
    dailyAverage, 
    growthRate, 
    peakDay, 
    predictionData,
    dailyCounts 
  } = useMemo(() => {
    if (!appointments.length || !startDate || !endDate) {
      return { 
        chartData: { labels: [], datasets: [] }, 
        totalCases: 0, 
        dailyAverage: 0, 
        growthRate: 0, 
        peakDay: null,
        predictionData: [],
        dailyCounts: []
      };
    }
    
    // Create a date range array
    const dayCount = differenceInDays(endDate, startDate) + 1;
    const dateLabels = Array.from({ length: dayCount }, (_, i) => 
      format(addDays(startDate, i), 'yyyy-MM-dd')
    );
    
    // Count cases per day
    const dailyCounts = dateLabels.map(date => {
      return filteredAppointments.filter(app => {
        const appDate = app.request_start_time.split('T')[0];
        return appDate === date;
      }).length;
    });
    
    // Calculate peak day
    const maxCount = Math.max(...dailyCounts);
    const peakDayIndex = dailyCounts.indexOf(maxCount);
    const peakDayDate = peakDayIndex >= 0 ? dateLabels[peakDayIndex] : null;
    
    // Calculate total cases and daily average
    const total = dailyCounts.reduce((sum, count) => sum + count, 0);
    const average = total / dailyCounts.length || 0;
    
    // Calculate growth rate using utility function
    // Use a 7-day window to calculate growth rate for better accuracy
    const rate = calculateGrowthRate(dailyCounts, 7);
    
    // Generate prediction data using utility function
    const lastValue = dailyCounts[dailyCounts.length - 1] || 1;
    const predictions = generatePredictions(lastValue, rate, endDate, predictionDays);
    
    return {
      chartData: {
        labels: dateLabels,
        datasets: [
          {
            label: 'Daily Contagious Cases',
            data: dailyCounts,
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.light,
            tension: 0.2,
            fill: false
          }
        ]
      },
      totalCases: total,
      dailyAverage: average,
      growthRate: rate,
      peakDay: peakDayDate,
      predictionData: predictions,
      dailyCounts
    };
  }, [appointments, startDate, endDate, theme, predictionDays]);
  
  // Combined chart data (actual + predictions)
  const combinedChartData = useMemo(() => {
    if (!chartData.labels.length || !predictionData.length) {
      return { ...chartData };
    }

    // Create a combined dataset with both actual data and predictions
    return {
      labels: [...(chartData.labels as string[]), ...predictionData.map(item => item.date)],
      datasets: [
        {
          ...chartData.datasets[0],
          label: 'Historical Cases'
        },
        {
          label: 'Predicted Cases',
          data: [
            ...Array(chartData.labels.length).fill(null), // Null for historical dates
            ...predictionData.map(item => item.value)
          ],
          borderColor: theme.palette.secondary.main,
          backgroundColor: theme.palette.secondary.light,
          borderDash: [5, 5],
          tension: 0.2,
          fill: false
        }
      ]
    };
  }, [chartData, predictionData, theme]);
  
  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
      title: {
        display: true,
        text: 'Contagious Cases Trend with Predictions',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Cases'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Pandemic Tracking Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and analyze contagious disease trends based on appointment data.
          </Typography>
        </Box>
        
        {/* Filters */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="hospital-select-label">Hospital</InputLabel>
                <Select
                  labelId="hospital-select-label"
                  id="hospital-select"
                  value={selectedHospital}
                  label="Hospital"
                  onChange={(e) => setSelectedHospital(e.target.value)}
                >
                  <MenuItem value="">All Hospitals</MenuItem>
                  {hospitals.map((hospital) => (
                    <MenuItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Prediction Days"
                value={predictionDays}
                onChange={(e) => setPredictionDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 7)))}
                inputProps={{ min: 1, max: 30 }}
                helperText="1-30 days"
              />
            </Grid>
          </Grid>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Contagious Cases
                    </Typography>
                    <Typography variant="h4">
                      {totalCases.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Daily Average
                    </Typography>
                    <Typography variant="h4">
                      {dailyAverage.toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Growth Rate
                    </Typography>
                    <Typography variant="h4" color={growthRate > 0 ? 'error' : growthRate < 0 ? 'success' : 'text.primary'}>
                      {(growthRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      {growthRate > 0 ? 'Increasing' : growthRate < 0 ? 'Decreasing' : 'Stable'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Peak Day
                    </Typography>
                    <Typography variant="h4">
                      {peakDay ? format(parseISO(peakDay), 'MMM d') : 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Combined Chart */}
            <Paper
              elevation={2}
              sx={{
                p: 3,
                mb: 4,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Contagious Cases Trend with Predictions
                </Typography>
                <Box>
                  <Chip 
                    label="Historical Data" 
                    color="primary"
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label="Prediction" 
                    color="secondary"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
              <Box sx={{ height: '400px', width: '100%' }}>
                <Line options={chartOptions} data={combinedChartData} />
              </Box>
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                * Prediction based on {growthRate !== 0 ? Math.abs(growthRate) > 0.01 ? 'exponential' : 'linear' : 'stable'} model using {Math.min(7, dailyCounts.length)}-day trend data.
                Growth rate: {(growthRate * 100).toFixed(2)}% per day.
              </Typography>
            </Paper>
            
            {/* Distribution Charts */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Case Distribution Analysis
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '400px',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Hospital Distribution
                  </Typography>
                  {filteredAppointments.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography variant="body1" color="text.secondary">
                        No data available for the selected filters
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ flexGrow: 1, height: '90%' }}>
                      <Bar
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            title: {
                              display: true,
                              text: 'Cases by Hospital',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            },
                            x: {
                              ticks: {
                                maxRotation: 45,
                                minRotation: 45
                              }
                            }
                          }
                        }}
                        data={{
                          labels: hospitals.map(h => h.name.length > 20 ? `${h.name.substring(0, 20)}...` : h.name),
                          datasets: [
                            {
                              label: 'Cases',
                              data: hospitals.map(hospital => 
                                appointments.filter(app => app.hospital_assigned === hospital.id).length
                              ),
                              backgroundColor: theme.palette.info.light,
                            },
                          ],
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '400px',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Weekly Distribution
                  </Typography>
                  {appointments.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography variant="body1" color="text.secondary">
                        No data available for the selected filters
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ flexGrow: 1, height: '90%' }}>
                      <Bar
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            title: {
                              display: true,
                              text: 'Cases by Day of Week',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                        data={{
                          labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                          datasets: [
                            {
                              label: 'Cases',
                              data: [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => 
                                appointments.filter(app => {
                                  const date = new Date(app.request_start_time);
                                  return date.getDay() === dayOfWeek;
                                }).length
                              ),
                              backgroundColor: theme.palette.warning.light,
                            },
                          ],
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
            
            {/* Disclaimer */}
            <Paper elevation={1} sx={{ p: 2, mt: 4, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Confidential Health Information - For Authorized Personnel Only
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This dashboard contains sensitive pandemic tracking data. The prediction model is for planning purposes only and should not be used as the sole basis for medical decisions.
              </Typography>
            </Paper>
          </>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default PandemicTrackingPage; 