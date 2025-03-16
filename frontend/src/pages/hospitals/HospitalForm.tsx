import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getHospital, createHospital, updateHospital } from '../../services/hospitalService';
import { Hospital, HospitalCreate, HospitalUpdate } from '../../types';

type FormData = HospitalCreate | HospitalUpdate;

// Default map center (Buenos Aires)
const DEFAULT_CENTER: LatLngTuple = [-34.603722, -58.381592];

const hospitalIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map click handler component
const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const HospitalForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LatLngTuple | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (isEditMode && id) {
      fetchHospital(id);
    }
  }, [id, isEditMode]);

  const fetchHospital = async (hospitalId: string) => {
    try {
      setLoading(true);
      const data = await getHospital(hospitalId);
      // Reset form with fetched data
      reset({
        name: data.name,
        address: data.address,
        phone_number: data.phone_number,
        email: data.email,
        contact_person: data.contact_person,
        latitude: data.latitude,
        longitude: data.longitude,
        uri: data.uri,
      });
      if (data.latitude && data.longitude) {
        setSelectedLocation([data.latitude, data.longitude]);
      }
    } catch (err) {
      console.error('Error fetching hospital:', err);
      setError('Failed to load hospital data');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      if (isEditMode && id) {
        await updateHospital(id, data as HospitalUpdate);
        setSnackbar({
          open: true,
          message: 'Hospital updated successfully',
          severity: 'success',
        });
      } else {
        await createHospital(data as HospitalCreate);
        setSnackbar({
          open: true,
          message: 'Hospital created successfully',
          severity: 'success',
        });
      }
      
      // Navigate back to hospitals page after a short delay
      setTimeout(() => {
        navigate('/dashboard/hospitals');
      }, 1500);
    } catch (err) {
      console.error('Error saving hospital:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditMode ? 'update' : 'create'} hospital`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/hospitals');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && isEditMode) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Edit Hospital' : 'Add Hospital'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                defaultValue=""
                rules={{ required: 'Hospital name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hospital Name"
                    variant="outlined"
                    fullWidth
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                defaultValue=""
                rules={{ required: 'Address is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address"
                    variant="outlined"
                    fullWidth
                    error={Boolean(errors.address)}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="phone_number"
                control={control}
                defaultValue=""
                rules={{ required: 'Phone number is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    variant="outlined"
                    fullWidth
                    error={Boolean(errors.phone_number)}
                    helperText={errors.phone_number?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                defaultValue=""
                rules={{ 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    variant="outlined"
                    fullWidth
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="uri"
                control={control}
                defaultValue=""
                rules={{
                  pattern: {
                    value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                    message: 'Invalid IP address format',
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Server IP"
                    variant="outlined"
                    fullWidth
                    placeholder="192.168.1.1"
                    error={Boolean(errors.uri)}
                    helperText={errors.uri?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="contact_person"
                control={control}
                defaultValue=""
                rules={{ required: 'Contact person is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact Person"
                    variant="outlined"
                    fullWidth
                    error={Boolean(errors.contact_person)}
                    helperText={errors.contact_person?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Location (Click on the map to select)
              </Typography>
              <Paper elevation={2} sx={{ height: '400px', width: '100%', overflow: 'hidden' }}>
                <MapContainer
                  center={selectedLocation || DEFAULT_CENTER}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapClickHandler onLocationSelect={handleLocationSelect} />
                  {selectedLocation && (
                    <Marker
                      position={selectedLocation}
                      icon={hospitalIcon}
                    />
                  )}
                </MapContainer>
              </Paper>
              {/* Hidden fields for latitude and longitude */}
              <Controller
                name="latitude"
                control={control}
                defaultValue={0}
                rules={{ required: 'Location is required' }}
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
              <Controller
                name="longitude"
                control={control}
                defaultValue={0}
                rules={{ required: 'Location is required' }}
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update' : 'Create')}
            </Button>
          </Box>
        </form>
      </Paper>
      
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

export default HospitalForm; 