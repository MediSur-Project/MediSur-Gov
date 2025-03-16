import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Slider,
  Grid,
  Chip,
  Stack,
  Tooltip,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO, subDays } from 'date-fns';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { getRegions, getReports } from '../services/covidApiService';
import { CovidReport, Region } from '../types';

// South America countries ISO codes
const SOUTH_AMERICA_COUNTRIES = [
  'ARG', // Argentina
  'BOL', // Bolivia
  'BRA', // Brazil
  'CHL', // Chile
  'COL', // Colombia
  'ECU', // Ecuador
  'GUF', // French Guiana
  'GUY', // Guyana
  'PRY', // Paraguay
  'PER', // Peru
  'SUR', // Suriname
  'URY', // Uruguay
  'VEN', // Venezuela
];

// Color scales for different metrics
const getColorScale = (value: number, dataType: string) => {
  // Define max values for different metrics
  const maxValues = {
    confirmed: 1000000,
    deaths: 50000,
    recovered: 1000000,
    active: 500000,
  };
  
  const theme = useTheme();
  
  // Normalize value between 0 and 1
  const normalizedValue = Math.min(
    value / (maxValues[dataType as keyof typeof maxValues] || 1000000), 
    1
  );
  
  if (dataType === 'deaths') {
    // Red scale for deaths
    return `rgba(220, 0, 0, ${0.1 + normalizedValue * 0.8})`;
  } else if (dataType === 'recovered') {
    // Green scale for recovered
    return `rgba(0, 180, 0, ${0.1 + normalizedValue * 0.8})`;
  } else if (dataType === 'active') {
    // Orange scale for active cases
    return `rgba(255, 140, 0, ${0.1 + normalizedValue * 0.8})`;
  } else {
    // Blue scale for confirmed (default)
    return `rgba(0, 100, 200, ${0.1 + normalizedValue * 0.8})`;
  }
};

interface SouthAmericaCovidMapProps {
  height?: number | string;
}

const SouthAmericaCovidMap: React.FC<SouthAmericaCovidMapProps> = ({ height = 500 }) => {
  const theme = useTheme();
  
  // State variables
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(subDays(new Date(), 30));
  const [dataType, setDataType] = useState<string>('confirmed');
  const [reports, setReports] = useState<CovidReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch regions
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await getRegions();
        // Filter to get only South American countries
        const saRegions = response.data.filter(
          region => SOUTH_AMERICA_COUNTRIES.includes(region.iso)
        );
        setRegions(saRegions);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError('Failed to load region data');
      }
    };
    
    fetchRegions();
  }, []);
  
  // Fetch reports based on selected date
  useEffect(() => {
    const fetchReports = async () => {
      if (!selectedDate) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        
        // Gather all reports for South American countries
        const allReports: CovidReport[] = [];
        
        // This could be optimized with a single API call if the backend supports it
        for (const iso of SOUTH_AMERICA_COUNTRIES) {
          try {
            const response = await getReports(iso, formattedDate);
            if (response.data && response.data.length > 0) {
              allReports.push(...response.data);
            }
          } catch (err) {
            console.warn(`Error fetching reports for ${iso}:`, err);
            // Continue with other countries
          }
        }
        
        setReports(allReports);
      } catch (err) {
        console.error('Error fetching COVID reports:', err);
        setError('Failed to load COVID-19 data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [selectedDate]);
  
  // Handle data type change
  const handleDataTypeChange = (event: SelectChangeEvent) => {
    setDataType(event.target.value);
  };
  
  // Prepare aggregated data for map display
  const countryData = useMemo(() => {
    const data: Record<string, any> = {};
    
    // Aggregate data by country
    reports.forEach(report => {
      const iso = report.region.iso;
      if (!data[iso]) {
        data[iso] = {
          confirmed: 0,
          deaths: 0,
          recovered: 0,
          active: 0,
          name: report.region.name,
        };
      }
      
      data[iso].confirmed += report.confirmed || 0;
      data[iso].deaths += report.deaths || 0;
      data[iso].recovered += report.recovered || 0;
      data[iso].active += report.active || 0;
    });
    
    return data;
  }, [reports]);
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, height: height }}>
      <Typography variant="h6" gutterBottom>
        South America COVID-19 Map
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel id="data-type-label">Data Type</InputLabel>
            <Select
              labelId="data-type-label"
              id="data-type-select"
              value={dataType}
              label="Data Type"
              onChange={handleDataTypeChange}
            >
              <MenuItem value="confirmed">Confirmed Cases</MenuItem>
              <MenuItem value="deaths">Deaths</MenuItem>
              <MenuItem value="recovered">Recovered</MenuItem>
              <MenuItem value="active">Active Cases</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70%' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box sx={{ height: 'calc(100% - 120px)' }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 400,
              center: [-60, -25]  // Centered on South America
            }}
          >
            <ZoomableGroup>
              <Geographies geography="/southamerica.json">
                {({ geographies }) =>
                  geographies.map(geo => {
                    const iso = geo.properties.ISO_A3;
                    const countryStats = countryData[iso] || null;
                    
                    return (
                      <Tooltip
                        key={geo.rsmKey}
                        title={
                          countryStats
                            ? `${countryStats.name}
                              Confirmed: ${countryStats.confirmed.toLocaleString()}
                              Deaths: ${countryStats.deaths.toLocaleString()}
                              Recovered: ${countryStats.recovered.toLocaleString()}
                              Active: ${countryStats.active.toLocaleString()}`
                            : geo.properties.NAME
                        }
                        arrow
                      >
                        <Geography
                          geography={geo}
                          fill={
                            countryStats
                              ? getColorScale(countryStats[dataType], dataType)
                              : theme.palette.grey[300]
                          }
                          stroke={theme.palette.grey[500]}
                          strokeWidth={0.5}
                          style={{
                            default: {
                              outline: 'none',
                            },
                            hover: {
                              fill: theme.palette.primary.light,
                              outline: 'none',
                            },
                            pressed: {
                              outline: 'none',
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ mt: 2, justifyContent: 'center' }}
          >
            <Chip 
              size="small" 
              label="Low" 
              sx={{ 
                bgcolor: getColorScale(0, dataType),
                border: `1px solid ${theme.palette.grey[300]}`
              }} 
            />
            <Chip 
              size="small" 
              label="Medium" 
              sx={{ 
                bgcolor: getColorScale(
                  (dataType === 'deaths' ? 10000 : 100000), 
                  dataType
                ),
                border: `1px solid ${theme.palette.grey[300]}`
              }} 
            />
            <Chip 
              size="small" 
              label="High" 
              sx={{ 
                bgcolor: getColorScale(
                  (dataType === 'deaths' ? 50000 : 1000000), 
                  dataType
                ),
                color: 'white',
                border: `1px solid ${theme.palette.grey[300]}`
              }} 
            />
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default SouthAmericaCovidMap; 