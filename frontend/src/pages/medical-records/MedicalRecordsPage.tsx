import React from 'react';
import WorkInProgress from '../../components/WorkInProgress';

const MedicalRecordsPage: React.FC = () => {
  return (
    <WorkInProgress 
      feature="Medical Records" 
      message="The Medical Records management module is coming soon. This feature will provide comprehensive medical history tracking, prescription management, and clinical notes for patients."
    />
  );
};

export default MedicalRecordsPage; 