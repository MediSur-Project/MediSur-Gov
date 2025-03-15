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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  HealthAndSafety as HealthIcon,
  Medication as MedicationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  getPatients, 
  createPatient, 
  updatePatient, 
  deletePatient 
} from '../../services/patientService';
import { Patient, PatientCreate, PatientUpdate, Gender, BloodType } from '../../types';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientCreate>({
    first_name: '',
    last_name: '',
    national_id: '',
    date_of_birth: '',
    gender: Gender.MALE,
    blood_type: BloodType.UNKNOWN
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchPatients();
  }, [page, rowsPerPage]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const skip = page * rowsPerPage;
      const response = await getPatients(skip, rowsPerPage);
      setPatients(response.data);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load patients',
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
      first_name: '',
      last_name: '',
      national_id: '',
      date_of_birth: '',
      gender: Gender.MALE,
      blood_type: BloodType.UNKNOWN
    });
    setDialogMode('create');
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      national_id: patient.national_id,
      date_of_birth: patient.date_of_birth.split('T')[0], // Format date for input
      gender: patient.gender,
      blood_type: patient.blood_type,
      email: patient.email,
      phone_number: patient.phone_number,
      address: patient.address,
      city: patient.city,
      allergies: patient.allergies,
      medical_conditions: patient.medical_conditions,
      notes: patient.notes,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPatient(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        await createPatient(formData);
        setSnackbar({
          open: true,
          message: 'Patient created successfully',
          severity: 'success',
        });
      } else {
        if (selectedPatient) {
          await updatePatient(selectedPatient.id, formData as PatientUpdate);
          setSnackbar({
            open: true,
            message: 'Patient updated successfully',
            severity: 'success',
          });
        }
      }
      handleCloseDialog();
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${dialogMode === 'create' ? 'create' : 'update'} patient`,
        severity: 'error',
      });
    }
  };

  const handleOpenDeleteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedPatient(null);
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    
    try {
      await deletePatient(selectedPatient.id);
      setSnackbar({
        open: true,
        message: 'Patient deleted successfully',
        severity: 'success',
      });
      handleCloseDeleteDialog();
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete patient',
        severity: 'error',
      });
    }
  };

  const handleViewMedicalRecords = (patientId: string) => {
    navigate(`/dashboard/patients/${patientId}/medical-records`);
  };

  const handleViewPrescriptions = (patientId: string) => {
    navigate(`/dashboard/patients/${patientId}/prescriptions`);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Patients
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenCreateDialog}
        >
          Add New Patient
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 240px)' }}>
          <Table stickyHeader aria-label="patients table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Blood Type</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No patients found
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>{`${patient.first_name} ${patient.last_name}`}</TableCell>
                    <TableCell>{patient.national_id}</TableCell>
                    <TableCell>{formatDate(patient.date_of_birth)}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>{patient.blood_type}</TableCell>
                    <TableCell>
                      {patient.email || patient.phone_number ? (
                        <>
                          {patient.email && <div>{patient.email}</div>}
                          {patient.phone_number && <div>{patient.phone_number}</div>}
                        </>
                      ) : (
                        'No contact info'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="edit"
                        color="secondary"
                        onClick={() => handleOpenEditDialog(patient)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(patient)}
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

      {/* Patient Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Add New Patient' : 'Edit Patient'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="National ID"
                name="national_id"
                value={formData.national_id}
                onChange={handleInputChange}
                required
                margin="normal"
                disabled={dialogMode === 'edit'} // Can't edit national ID
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  name="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={handleSelectChange}
                >
                  <MenuItem value={Gender.MALE}>Male</MenuItem>
                  <MenuItem value={Gender.FEMALE}>Female</MenuItem>
                  <MenuItem value={Gender.OTHER}>Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="blood-type-label">Blood Type</InputLabel>
                <Select
                  labelId="blood-type-label"
                  name="blood_type"
                  value={formData.blood_type}
                  label="Blood Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value={BloodType.UNKNOWN}>Unknown</MenuItem>
                  <MenuItem value={BloodType.A_POSITIVE}>A+</MenuItem>
                  <MenuItem value={BloodType.A_NEGATIVE}>A-</MenuItem>
                  <MenuItem value={BloodType.B_POSITIVE}>B+</MenuItem>
                  <MenuItem value={BloodType.B_NEGATIVE}>B-</MenuItem>
                  <MenuItem value={BloodType.AB_POSITIVE}>AB+</MenuItem>
                  <MenuItem value={BloodType.AB_NEGATIVE}>AB-</MenuItem>
                  <MenuItem value={BloodType.O_POSITIVE}>O+</MenuItem>
                  <MenuItem value={BloodType.O_NEGATIVE}>O-</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city || ''}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Allergies"
                name="allergies"
                value={formData.allergies || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical Conditions"
                name="medical_conditions"
                value={formData.medical_conditions || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={2}
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
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name || ''}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone || ''}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {dialogMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the patient {selectedPatient?.first_name} {selectedPatient?.last_name}?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeletePatient} color="error" variant="contained">
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

export default PatientsPage; 