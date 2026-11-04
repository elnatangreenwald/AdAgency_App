/**
 * Temporary onboarding feature. Flip to false to hide the floating "מצב לימודי" button
 * and all tour UI without touching the pages (their data-tour attributes are inert).
 */
export const LEARNING_MODE_AVAILABLE = true;

export { LearningModeProvider, useLearningMode } from './LearningModeContext';
export { LearningModeButton } from './LearningModeButton';
export { TourOverlay } from './TourOverlay';
export { Hotspots } from './Hotspots';
