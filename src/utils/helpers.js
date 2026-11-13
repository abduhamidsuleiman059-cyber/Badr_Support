export function getInitials(name = 'Badr User') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}