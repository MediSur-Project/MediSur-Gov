import React from 'react';
import WorkInProgress from '../../components/WorkInProgress';

const PatientsPage: React.FC = () => {
  return (
    <WorkInProgress 
      feature="Patient Management" 
      message="The Patient Management module is currently under development. This feature will allow you to manage patient records, view medical history, and schedule appointments."
    />
  );
};

export default PatientsPage; 