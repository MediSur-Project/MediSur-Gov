import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import { Construction } from '@mui/icons-material';

interface WorkInProgressProps {
  feature: string;
  message?: string;
}

const WorkInProgress: React.FC<WorkInProgressProps> = ({ 
  feature, 
  message = 'This feature is currently under development and will be available soon.' 
}) => {
  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 4, 
          textAlign: 'center',
          borderRadius: 2,
          borderLeft: '5px solid #f39c12'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Construction sx={{ fontSize: 64, color: '#f39c12', mb: 2 }} />
          
          <Typography variant="h4" component="h1" gutterBottom>
            {feature} - Work in Progress
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 3 }}>
            Check back soon for updates or contact the development team for more information.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default WorkInProgress; 