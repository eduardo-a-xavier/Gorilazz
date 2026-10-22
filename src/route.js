export const TRACK_RADIUS = 58;
export const STOP_COUNT = 9;
export const MEMBER_STOPS = [.22, .44, .65, .86];
export function wrapProgress(value) { return ((value % 1) + 1) % 1; }
export function routePose(progress, lateral = 0) {
  const angle = progress * Math.PI * 2;
  return { x: Math.sin(angle) * (TRACK_RADIUS + lateral), z: Math.cos(angle) * (TRACK_RADIUS + lateral) - TRACK_RADIUS, heading: angle - Math.PI / 2 };
}
export function nearestDestination(current, target) {
  return current + wrapProgress(target - wrapProgress(current) + .5) - .5;
}
export function circularDistance(first, second) {
  const distance = Math.abs(wrapProgress(first) - wrapProgress(second));
  return Math.min(distance, 1 - distance);
}
