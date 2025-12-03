/**
 * Returns the logo image path for a restaurant based on its name.
 * Falls back to the UMBC logo for restaurants without a specific logo.
 */
export function getRestaurantLogo(restaurantName: string): string {
  const name = restaurantName.toLowerCase();

  if (name.includes('chick-fil-a') || name.includes('chickfila')) {
    return '/images/chickfila.png';
  }
  if (name.includes('dunkin')) {
    return '/images/dunkin.png';
  }
  if (name.includes('einstein')) {
    return '/images/einstein bros.jpeg';
  }
  if (name.includes('starbucks')) {
    return '/images/starbyucks.png';
  }

  // Default to UMBC logo for all other restaurants
  return '/images/UMBC-vertical-logo-CMYK-on-black.png';
}

/**
 * Check if a restaurant has a specific logo (not the default UMBC one)
 */
export function hasRestaurantLogo(restaurantName: string): boolean {
  const name = restaurantName.toLowerCase();
  return (
    name.includes('chick-fil-a') ||
    name.includes('chickfila') ||
    name.includes('dunkin') ||
    name.includes('einstein') ||
    name.includes('starbucks')
  );
}
