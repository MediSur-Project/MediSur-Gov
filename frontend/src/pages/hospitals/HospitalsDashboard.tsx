import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  Chip,
  useTheme,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/leaflet.css';
import { Hospital, HospitalStatus } from '../../types';
import { getHospitals } from '../../services/hospitalService';

// Custom hospital icons for different statuses
const hospitalIcons = {
  [HospitalStatus.ACTIVE]: new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  [HospitalStatus.INACTIVE]: new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  [HospitalStatus.UNKNOWN]: new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
};

// Status chip colors
const statusColors = {
  [HospitalStatus.ACTIVE]: 'success',
  [HospitalStatus.INACTIVE]: 'error',
  [HospitalStatus.UNKNOWN]: 'default'
} as const;

const HospitalsDashboard: React.FC = () => {
  const theme = useTheme();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await getHospitals(0, 100);
      setHospitals(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load hospitals data');
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const center = hospitals.length > 0
    ? [hospitals[0].latitude, hospitals[0].longitude]
    : [-34.603722, -58.381592]; // Default to Buenos Aires coordinates

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Hospitals Dashboard
      </Typography>

      {/* Legend */}
      <Box mb={3} display="flex" gap={2}>
        <Chip
          label="Active Hospitals"
          color="success"
          size="small"
        />
        <Chip
          label="Inactive Hospitals"
          color="error"
          size="small"
        />
        <Chip
          label="Unknown Status"
          color="default"
          size="small"
        />
      </Box>
      
      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ height: '500px', overflow: 'hidden' }}>
            <MapContainer
              center={center as [number, number]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {hospitals.map((hospital) => (
                <Marker
                  key={hospital.id}
                  position={[hospital.latitude, hospital.longitude]}
                  icon={hospitalIcons[hospital.status]}
                >
                  <Popup>
                    <Typography variant="subtitle1">{hospital.name}</Typography>
                    <Typography variant="body2">{hospital.address}</Typography>
                    <Typography variant="body2">
                      Contact: {hospital.contact_person}
                    </Typography>
                    <Typography variant="body2">
                      Phone: {hospital.phone_number}
                    </Typography>
                    <Box mt={1}>
                      <Chip
                        label={hospital.status.charAt(0).toUpperCase() + hospital.status.slice(1)}
                        color={statusColors[hospital.status]}
                        size="small"
                      />
                    </Box>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Paper>
        </Grid>

        {/* Hospitals List Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3}>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Registered Hospitals
              </Typography>
              <List>
                {hospitals.map((hospital) => (
                  <ListItem
                    key={hospital.id}
                    component={Card}
                    sx={{ mb: 1, width: '100%' }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="subtitle1" component="div">
                          {hospital.name}
                        </Typography>
                        <Chip
                          label={hospital.status.charAt(0).toUpperCase() + hospital.status.slice(1)}
                          color={statusColors[hospital.status]}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {hospital.address}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Contact: {hospital.contact_person}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phone: {hospital.phone_number}
                      </Typography>
                    </CardContent>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HospitalsDashboard; 