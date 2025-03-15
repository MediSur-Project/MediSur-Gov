import { Appointment } from '../types';
import { format, addDays, parseISO } from 'date-fns';
/**
 * Calculate the growth rate using a logarithmic regression
 * Adds weighted averaging for recent days to increase sensitivity.
 */
export const calculateGrowthRate = (
  dailyCounts: number[],
  days: number = 7
): number => {
  if (dailyCounts.length < 2) return 0;

  const recentCounts = dailyCounts.slice(-Math.min(days, dailyCounts.length));
  if (recentCounts.length < 2) return 0;

  const weightedSum = recentCounts.reduce((sum, count, index) => sum + count * (index + 1), 0);
  const totalWeight = (recentCounts.length * (recentCounts.length + 1)) / 2;
  const weightedAverage = weightedSum / totalWeight;

  const initialValue = Math.max(recentCounts[0], 1); // Avoid div by zero
  const finalValue = Math.max(weightedAverage, 1);
  
  return Math.pow(finalValue / initialValue, 1 / (recentCounts.length - 1)) - 1;
};

/**
 * Generate volatile predictions with randomness, periodic spikes, and momentum
 */
export const generatePredictions = (
  lastValue: number,
  growthRate: number,
  startDate: Date,
  days: number
): Array<{ date: string; value: number }> => {
  const predictions = [];
  let currentValue = lastValue;

  for (let i = 1; i <= days; i++) {
    const randomFactor = 1 + (Math.random() - 0.5) * 0.2; // Adds ±10% randomness
    const waveEffect = 1 + 0.1 * Math.sin(i / 3); // Adds cyclic fluctuations
    const momentum = 1 + (growthRate * Math.log(i + 1)); // Growth momentum
    
    currentValue *= (1 + growthRate) * randomFactor * waveEffect * momentum;
    
    predictions.push({
      date: format(new Date(startDate.getTime() + i * 86400000), 'yyyy-MM-dd'),
      value: Math.round(currentValue),
    });
  }

  return predictions;
};

/**
 * Group appointments by date and count them
 * @param appointments Array of appointments
 * @returns Object with dates as keys and counts as values
 */
export const groupAppointmentsByDate = (
  appointments: Appointment[]
): Record<string, number> => {
  return appointments.reduce((acc, appointment) => {
    const date = appointment.request_start_time.split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Generate the URL for the pandemic tracking dashboard
 * @returns The URL for the pandemic tracking page
 */
export const getPandemicTrackingUrl = (): string => {
  return '/pandemic-tracking';
};

/**
 * Check if the current URL is the pandemic tracking page
 * @returns Boolean indicating if we're on the pandemic tracking page
 */
export const isPandemicTrackingPage = (): boolean => {
  return window.location.pathname === getPandemicTrackingUrl();
}; 