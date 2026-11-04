export type TourPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right';

export interface TourStep {
  /** value of the `data-tour` attribute on the element to highlight; omit for a centered intro bubble */
  target?: string;
  title: string;
  body: string;
  placement?: TourPlacement;
  /** short tip shown under the body */
  tip?: string;
}

export interface TourDefinition {
  id: string;
  /** react-router path patterns (relative to the basename) */
  paths: string[];
  /** screen name shown in the bubble header */
  name: string;
  steps: TourStep[];
}
