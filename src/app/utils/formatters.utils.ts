/**
 * Utility functions for formatting and data manipulation
 */

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatLargeNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

/**
 * Format compact numbers (shorter format)
 */
export const formatCompactNumber = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toFixed(0);
};

/**
 * Format relative time (e.g., "5m ago", "2h ago")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

/**
 * Format tweet creation time
 */
export const formatTweetTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes}m ago`;
  }
  
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  }
  
  return date.toLocaleDateString();
};

/**
 * Generate random number within range
 */
export const randomInRange = (min: number, max: number): number => 
  Math.random() * (max - min) + min;

/**
 * Generate weighted random choice
 */
export const weightedRandom = (weights: number[]): number => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  
  return weights.length - 1;
};

/**
 * Clamp value between min and max
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Deep clone object using structuredClone (modern approach)
 */
export const deepClone = <T>(obj: T): T => {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }
  // Fallback for older environments
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Check if value is within percentage range of target
 */
export const isWithinPercentage = (value: number, target: number, percentage: number): boolean => {
  const margin = target * (percentage / 100);
  return Math.abs(value - target) <= margin;
};
