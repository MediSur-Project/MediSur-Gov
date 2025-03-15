import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { getAppointments, updateAppointment } from '../../services/appointmentService';
import { Appointment, AppointmentStatus } from '../../types';

// Simple date formatter function
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [hospitalAssigned, setHospitalAssigned] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>(AppointmentStatus.PENDING);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchAppointments();
  }, [page, rowsPerPage]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log('Fetching appointments');
      const skip = page * rowsPerPage;
      const response = await getAppointments(skip, rowsPerPage);
      console.log('Appointments fetched:', response);
      setAppointments(response.data);
      console.log('Appointments set:', appointments);
      setTotalCount(response.count);
      console.log('Total count set:', totalCount);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load appointments',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setHospitalAssigned(appointment.hospital_assigned || '');
    setStatus(appointment.status);
    setScheduledTime(appointment.scheduled_time ? new Date(appointment.scheduled_time) : null);
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleSaveAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await updateAppointment(selectedAppointment.id, {
        hospital_assigned: hospitalAssigned,
        status,
        scheduled_time: scheduledTime ? scheduledTime.toISOString() : undefined,
      });
      setSnackbar({
        open: true,
        message: 'Appointment updated successfully',
        severity: 'success',
      });
      fetchAppointments();
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update appointment',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusChipColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.MISSING_DATA:
        return 'warning';
      case AppointmentStatus.PENDING:
        return 'info';
      case AppointmentStatus.ASSIGNED:
        return 'primary';
      case AppointmentStatus.FINISHED:
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Appointments
      </Typography>
      
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 240px)' }}>
          <Table stickyHeader aria-label="appointments table">
            <TableHead>
              <TableRow>
                <TableCell>Patient ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Hospital</TableCell>
                <TableCell>Specialty</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Request Time</TableCell>
                <TableCell>Scheduled Time</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : appointments == undefined || appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id} hover>
                    <TableCell>{appointment.patient_id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={appointment.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusChipColor(appointment.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{appointment.hospital_assigned || 'Not assigned'}</TableCell>
                    <TableCell>{appointment.medical_specialty || 'Not specified'}</TableCell>
                    <TableCell>{appointment.prority || 'Not specified'}</TableCell>
                    <TableCell>
                      {formatDate(appointment.request_start_time)}
                    </TableCell>
                    <TableCell>
                      {appointment.scheduled_time 
                        ? formatDate(appointment.scheduled_time)
                        : 'Not scheduled'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="edit"
                        color="primary"
                        onClick={() => handleEditClick(appointment)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="view"
                        color="info"
                        // onClick={() => handleViewAppointment(appointment.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Edit Appointment Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                >
                  <MenuItem value={AppointmentStatus.MISSING_DATA}>Missing Data</MenuItem>
                  <MenuItem value={AppointmentStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={AppointmentStatus.ASSIGNED}>Assigned</MenuItem>
                  <MenuItem value={AppointmentStatus.FINISHED}>Finished</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                fullWidth
                label="Hospital Assigned"
                value={hospitalAssigned}
                onChange={(e) => setHospitalAssigned(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="normal"
                fullWidth
                label="Scheduled Time"
                type="datetime-local"
                value={scheduledTime ? scheduledTime.toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : null;
                  setScheduledTime(newDate);
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveAppointment} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppointmentsPage; 