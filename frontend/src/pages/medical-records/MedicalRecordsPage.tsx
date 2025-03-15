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
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getPatient,
  getMedicalRecords, 
  createMedicalRecord, 
  deleteMedicalRecord 
} from '../../services/patientService';
import { MedicalRecord, MedicalRecordCreate, Patient } from '../../types';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const MedicalRecordsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState<MedicalRecordCreate>({
    diagnosis: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (patientId) {
      fetchPatient();
      fetchRecords();
    } else {
      navigate('/dashboard/patients');
    }
  }, [patientId, page, rowsPerPage]);

  const fetchPatient = async () => {
    if (!patientId) return;
    
    try {
      const patientData = await getPatient(patientId);
      setPatient(patientData);
    } catch (error) {
      console.error('Error fetching patient:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load patient information',
        severity: 'error',
      });
    }
  };

  const fetchRecords = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      const skip = page * rowsPerPage;
      const response = await getMedicalRecords(patientId, skip, rowsPerPage);
      setRecords(response.data);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load medical records',
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

  const handleOpenCreateDialog = () => {
    setFormData({
      diagnosis: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSubmit = async () => {
    if (!patientId) return;
    
    try {
      await createMedicalRecord(patientId, formData);
      setSnackbar({
        open: true,
        message: 'Medical record created successfully',
        severity: 'success',
      });
      handleCloseDialog();
      fetchRecords();
    } catch (error) {
      console.error('Error saving medical record:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create medical record',
        severity: 'error',
      });
    }
  };

  const handleOpenDeleteDialog = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedRecord(null);
  };

  const handleDeleteRecord = async () => {
    if (!patientId || !selectedRecord) return;
    
    try {
      await deleteMedicalRecord(patientId, selectedRecord.id);
      setSnackbar({
        open: true,
        message: 'Medical record deleted successfully',
        severity: 'success',
      });
      handleCloseDeleteDialog();
      fetchRecords();
    } catch (error) {
      console.error('Error deleting medical record:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete medical record',
        severity: 'error',
      });
    }
  };

  const handleBackToPatients = () => {
    navigate('/dashboard/patients');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Medical Records
          </Typography>
          {patient && (
            <Typography variant="h6" color="textSecondary">
              Patient: {patient.first_name} {patient.last_name} ({patient.national_id})
            </Typography>
          )}
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleBackToPatients}
            sx={{ mr: 2 }}
          >
            Back to Patients
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Add Medical Record
          </Button>
        </Box>
      </Box>
      
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 240px)' }}>
          <Table stickyHeader aria-label="medical records table">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Physician ID</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No medical records found
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{record.diagnosis}</TableCell>
                    <TableCell>{record.notes || 'N/A'}</TableCell>
                    <TableCell>{record.physician_id || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="delete"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(record)}
                      >
                        <DeleteIcon />
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

      {/* Create Medical Record Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Medical Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this medical record?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteRecord} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MedicalRecordsPage; 