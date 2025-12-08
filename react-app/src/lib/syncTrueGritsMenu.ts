import { supabase } from './supabaseClient';

// True Grits menu structured by actual dining hall stations
// Based on UMBC True Grits dining hall layout

interface MenuItem {
  name: string;
  description: string;
  price: number;
  calories?: number;
}

interface CategoryMenu {
  [category: string]: MenuItem[];
}

// Breakfast menu by station
const BREAKFAST_MENU: CategoryMenu = {
  'Homestyle': [
    { name: 'Scrambled Eggs', description: 'Fluffy scrambled eggs', price: 2.99, calories: 180 },
    { name: 'French Toast Sticks', description: 'Golden fried french toast sticks with syrup', price: 3.99, calories: 350 },
    { name: 'Pork Sausage Link', description: 'Grilled pork sausage', price: 2.49, calories: 170 },
    { name: 'Herb Roasted Potato Wedges', description: 'Crispy seasoned potato wedges', price: 2.99, calories: 210 },
    { name: 'Buttermilk Pancakes', description: 'Stack of fluffy buttermilk pancakes', price: 4.49, calories: 320 },
    { name: 'Crispy Bacon', description: 'Thick-cut crispy bacon strips', price: 2.99, calories: 120 },
  ],
  'Sweet House': [
    { name: 'Chocolate Chip Muffin', description: 'Fresh baked muffin with chocolate chips', price: 2.99, calories: 420 },
    { name: 'Cheese Danish', description: 'Flaky pastry with sweet cheese filling', price: 3.49, calories: 380 },
    { name: 'Blueberry Muffin', description: 'Fresh baked blueberry muffin', price: 2.99, calories: 390 },
    { name: 'Cinnamon Roll', description: 'Warm cinnamon roll with icing', price: 3.99, calories: 450 },
    { name: 'Croissant', description: 'Buttery flaky croissant', price: 2.99, calories: 280 },
  ],
  'Fruit & Yogurt': [
    { name: 'Low Fat Vanilla Yogurt', description: 'Creamy vanilla yogurt', price: 2.49, calories: 150 },
    { name: 'Fresh Honeydew', description: 'Sliced fresh honeydew melon', price: 2.99, calories: 60 },
    { name: 'Fresh Cantaloupe', description: 'Sliced fresh cantaloupe', price: 2.99, calories: 55 },
    { name: 'Cottage Cheese', description: 'Fresh cottage cheese', price: 2.49, calories: 110 },
    { name: 'Mixed Berries', description: 'Fresh strawberries, blueberries, raspberries', price: 3.99, calories: 80 },
    { name: 'Granola', description: 'Crunchy granola with oats and honey', price: 2.49, calories: 200 },
  ],
  'House of Char (Omelet Bar)': [
    { name: 'Custom Omelet', description: 'Made-to-order omelet with your choice of fillings', price: 6.99, calories: 350 },
    { name: 'Veggie Omelet', description: 'Omelet with spinach, tomatoes, peppers, onions', price: 5.99, calories: 280 },
    { name: 'Cheese Omelet', description: 'Three-egg omelet with melted cheese', price: 4.99, calories: 320 },
    { name: 'Western Omelet', description: 'Ham, peppers, onions, and cheese', price: 6.99, calories: 380 },
    { name: 'Egg White Omelet', description: 'Healthy egg white omelet with veggies', price: 5.99, calories: 180 },
  ],
};

// Lunch menu by station
const LUNCH_MENU: CategoryMenu = {
  'Grill': [
    { name: 'Classic Cheeseburger', description: 'Beef patty with American cheese, lettuce, tomato', price: 7.99, calories: 650 },
    { name: 'Grilled Chicken Sandwich', description: 'Marinated chicken breast on brioche bun', price: 7.99, calories: 450 },
    { name: 'Crispy Chicken Sandwich', description: 'Breaded chicken with pickles and mayo', price: 7.99, calories: 580 },
    { name: 'Veggie Burger', description: 'Plant-based patty with all the fixings', price: 7.99, calories: 420 },
    { name: 'French Fries', description: 'Golden crispy fries', price: 2.99, calories: 365 },
    { name: 'Onion Rings', description: 'Beer-battered crispy onion rings', price: 3.99, calories: 410 },
  ],
  'Deli': [
    { name: 'Turkey & Swiss Sub', description: 'Sliced turkey with Swiss cheese on fresh bread', price: 7.49, calories: 480 },
    { name: 'Italian Sub', description: 'Ham, salami, pepperoni with provolone', price: 7.99, calories: 620 },
    { name: 'Chicken Caesar Wrap', description: 'Grilled chicken, romaine, parmesan in tortilla', price: 7.49, calories: 520 },
    { name: 'Veggie Wrap', description: 'Fresh vegetables with hummus in spinach wrap', price: 6.99, calories: 380 },
    { name: 'BLT Sandwich', description: 'Bacon, lettuce, tomato with mayo', price: 6.99, calories: 450 },
  ],
  'Global Kitchen': [
    { name: 'Chicken Tikka Masala', description: 'Creamy tomato curry with basmati rice', price: 8.99, calories: 580 },
    { name: 'Vegetable Stir Fry', description: 'Wok-tossed vegetables over rice', price: 7.99, calories: 380 },
    { name: 'Teriyaki Chicken Bowl', description: 'Grilled chicken with teriyaki glaze and rice', price: 8.99, calories: 520 },
    { name: 'Beef & Broccoli', description: 'Tender beef with broccoli in savory sauce', price: 9.49, calories: 480 },
    { name: 'Vegetable Lo Mein', description: 'Stir-fried noodles with mixed vegetables', price: 7.49, calories: 450 },
  ],
  'Salad Bar': [
    { name: 'Garden Salad', description: 'Mixed greens with fresh vegetables', price: 5.99, calories: 120 },
    { name: 'Caesar Salad', description: 'Romaine with caesar dressing and croutons', price: 6.99, calories: 320 },
    { name: 'Chef Salad', description: 'Mixed greens with turkey, ham, cheese, egg', price: 8.99, calories: 450 },
    { name: 'Greek Salad', description: 'Cucumbers, tomatoes, olives, feta cheese', price: 7.49, calories: 280 },
  ],
};

// Dinner menu by station
const DINNER_MENU: CategoryMenu = {
  'Homestyle': [
    { name: 'Roasted Chicken', description: 'Herb-roasted chicken quarter with sides', price: 9.99, calories: 480 },
    { name: 'Meatloaf', description: 'Classic meatloaf with brown gravy', price: 8.99, calories: 520 },
    { name: 'Baked Fish', description: 'Lemon herb baked fish with tartar sauce', price: 9.99, calories: 380 },
    { name: 'Mac and Cheese', description: 'Creamy three-cheese macaroni', price: 6.99, calories: 580 },
    { name: 'Mashed Potatoes', description: 'Creamy mashed potatoes with gravy', price: 2.99, calories: 220 },
    { name: 'Steamed Vegetables', description: 'Seasonal steamed vegetables', price: 2.99, calories: 80 },
  ],
  'Grill': [
    { name: 'Double Cheeseburger', description: 'Two patties with cheese and all the fixings', price: 9.99, calories: 920 },
    { name: 'BBQ Bacon Burger', description: 'Burger with BBQ sauce, bacon, onion rings', price: 9.99, calories: 850 },
    { name: 'Buffalo Chicken Sandwich', description: 'Spicy buffalo chicken with ranch', price: 8.99, calories: 620 },
    { name: 'Chicken Tenders', description: 'Hand-breaded chicken tenders with dipping sauce', price: 7.99, calories: 520 },
    { name: 'Loaded Fries', description: 'Fries topped with cheese, bacon, sour cream', price: 5.99, calories: 680 },
  ],
  'Pasta Station': [
    { name: 'Spaghetti Marinara', description: 'Spaghetti with house-made marinara', price: 7.99, calories: 480 },
    { name: 'Chicken Alfredo', description: 'Fettuccine with creamy Alfredo and grilled chicken', price: 9.99, calories: 720 },
    { name: 'Baked Ziti', description: 'Ziti pasta baked with ricotta and mozzarella', price: 8.99, calories: 580 },
    { name: 'Penne Vodka', description: 'Penne in creamy tomato vodka sauce', price: 8.49, calories: 540 },
    { name: 'Garlic Bread', description: 'Toasted garlic bread', price: 2.49, calories: 180 },
  ],
  'Pizza': [
    { name: 'Cheese Pizza Slice', description: 'Classic cheese pizza', price: 3.49, calories: 285 },
    { name: 'Pepperoni Pizza Slice', description: 'Pepperoni pizza slice', price: 3.99, calories: 320 },
    { name: 'Veggie Pizza Slice', description: 'Pizza with peppers, onions, mushrooms', price: 3.99, calories: 275 },
    { name: 'Meat Lovers Pizza Slice', description: 'Pepperoni, sausage, bacon', price: 4.49, calories: 380 },
  ],
};

// Late Night menu (static, available 9pm-midnight)
const LATE_NIGHT_MENU: CategoryMenu = {
  'Late Night': [
    { name: 'Pizza Slice', description: 'Fresh hot pizza slice', price: 3.50, calories: 285 },
    { name: 'Chicken Tenders (4 pc)', description: 'Crispy breaded chicken tenders with dipping sauce', price: 6.99, calories: 420 },
    { name: 'French Fries', description: 'Golden crispy fries', price: 3.50, calories: 365 },
    { name: 'Mozzarella Sticks (6 pc)', description: 'Breaded mozzarella with marinara sauce', price: 5.99, calories: 480 },
    { name: 'Soft Drink', description: 'Fountain beverage (16 oz)', price: 2.00, calories: 150 },
    { name: 'Cheeseburger', description: 'Classic burger with cheese, lettuce, tomato', price: 7.99, calories: 550 },
    { name: 'Grilled Cheese', description: 'Melted American cheese on toasted bread', price: 4.99, calories: 380 },
    { name: 'Quesadilla', description: 'Cheese quesadilla with salsa', price: 5.99, calories: 420 },
    { name: 'Nachos', description: 'Tortilla chips with cheese and toppings', price: 6.99, calories: 580 },
  ],
};

interface APIMenuItem {
  name: string;
  description?: string;
  calories?: number;
  station?: string;
}

interface APIResponse {
  date?: string;
  meals?: {
    breakfast?: APIMenuItem[];
    lunch?: APIMenuItem[];
    dinner?: APIMenuItem[];
  };
}

// UMBC True Grits site ID for dineoncampus API
const UMBC_SITE_ID = '5751fd3590975b60e048929a';

// Fetch menu from dineoncampus API (primary) or SGA API (fallback)
async function fetchMenuFromAPI(date: string): Promise<APIResponse | null> {
  // Try dineoncampus API first with browser-like headers
  try {
    console.log('[syncTrueGritsMenu] Trying dineoncampus API for date:', date);
    const dineOnCampusUrl = `https://api.dineoncampus.com/v1/location/menu?site_id=${UMBC_SITE_ID}&platform=0&date=${date}`;

    const response = await fetch(dineOnCampusUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://dineoncampus.com/umbc',
        'Origin': 'https://dineoncampus.com'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[syncTrueGritsMenu] dineoncampus API response:', JSON.stringify(data, null, 2).slice(0, 1000));

      // Parse dineoncampus format into our format
      if (data?.menu?.periods) {
        return parseDineOnCampusMenu(data);
      }
    } else {
      console.log('[syncTrueGritsMenu] dineoncampus API returned status:', response.status);
    }
  } catch (error) {
    console.log('[syncTrueGritsMenu] dineoncampus API error:', error);
  }

  // Fallback to SGA API
  try {
    console.log('[syncTrueGritsMenu] Trying SGA API for date:', date);
    const response = await fetch(`https://api.sga.umbc.edu/menus/dhall/${date}`);
    const data = await response.json();

    if (!data || data === null) {
      console.log('[syncTrueGritsMenu] SGA API returned null for date:', date);
      return null;
    }

    console.log('[syncTrueGritsMenu] SGA API response:', JSON.stringify(data, null, 2).slice(0, 1000));
    return data;
  } catch (error) {
    console.error('[syncTrueGritsMenu] SGA API error:', error);
    return null;
  }
}

// Parse dineoncampus API response into our format
function parseDineOnCampusMenu(data: any): APIResponse | null {
  try {
    const meals: APIResponse['meals'] = {};

    for (const period of data.menu.periods || []) {
      const periodName = period.name?.toLowerCase() || '';
      const items: APIMenuItem[] = [];

      for (const category of period.categories || []) {
        const stationName = category.name || 'Other';

        for (const item of category.items || []) {
          items.push({
            name: item.name || 'Unknown Item',
            description: item.desc || '',
            calories: item.calories || undefined,
            station: stationName
          });
        }
      }

      if (periodName.includes('breakfast')) {
        meals.breakfast = items;
      } else if (periodName.includes('lunch')) {
        meals.lunch = items;
      } else if (periodName.includes('dinner')) {
        meals.dinner = items;
      }
    }

    if (Object.keys(meals).length > 0) {
      return { meals };
    }
  } catch (error) {
    console.error('[syncTrueGritsMenu] Error parsing dineoncampus data:', error);
  }

  return null;
}

// Convert API menu items to our format, grouped by station
function processAPIMenuByStation(items: APIMenuItem[], defaultPrice: number): CategoryMenu {
  const grouped: CategoryMenu = {};

  for (const item of items) {
    const station = item.station || 'Other';
    if (!grouped[station]) {
      grouped[station] = [];
    }
    grouped[station].push({
      name: item.name,
      description: item.description || '',
      price: defaultPrice,
      calories: item.calories
    });
  }

  return grouped;
}

// Get or create True Grits restaurant
async function getOrCreateTrueGritsRestaurant(): Promise<number | null> {
  // First, try to find existing True Grits restaurant
  const { data: existing } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', 'true-grits')
    .single();

  if (existing) {
    return existing.id;
  }

  // Create True Grits if it doesn't exist
  const { data: created, error } = await supabase
    .from('restaurants')
    .insert({
      name: 'True Grits',
      slug: 'true-grits',
      location: 'The Commons',
      latitude: 39.2537,
      longitude: -76.7143
    })
    .select('id')
    .single();

  if (error) {
    console.error('[syncTrueGritsMenu] Error creating restaurant:', error);
    return null;
  }

  // Insert operating hours for the new restaurant (all 7 days, 7am-11pm)
  if (created?.id) {
    const operatingHours = [];
    for (let day = 0; day < 7; day++) {
      operatingHours.push({
        restaurant_id: created.id,
        day_of_week: day,
        opens_at: '07:00:00',
        closes_at: '23:00:00',
        is_closed: false
      });
    }

    const { error: hoursError } = await supabase
      .from('operating_hours')
      .insert(operatingHours);

    if (hoursError) {
      console.error('[syncTrueGritsMenu] Error creating operating hours:', hoursError);
    }
  }

  return created?.id || null;
}

// Get or create category for a restaurant
async function getOrCreateCategory(restaurantId: number, categoryName: string): Promise<number | null> {
  // Try to find existing category
  const { data: existing } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('name', categoryName)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create category if it doesn't exist
  const { data: created, error } = await supabase
    .from('menu_categories')
    .insert({
      restaurant_id: restaurantId,
      name: categoryName
    })
    .select('id')
    .single();

  if (error) {
    console.error('[syncTrueGritsMenu] Error creating category:', error);
    return null;
  }

  return created?.id || null;
}

// Clear existing menu items for a category
async function clearCategoryItems(categoryId: number): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('category_id', categoryId);

  if (error) {
    console.error('[syncTrueGritsMenu] Error clearing items:', error);
  }
}

// Insert menu items for a category
async function insertMenuItems(categoryId: number, items: MenuItem[]): Promise<void> {
  const menuItems = items.map(item => ({
    category_id: categoryId,
    name: item.name,
    description: item.description || '',
    price: item.price,
    calories: item.calories || null
  }));

  const { error } = await supabase
    .from('menu_items')
    .insert(menuItems);

  if (error) {
    console.error('[syncTrueGritsMenu] Error inserting items:', error);
  }
}

// Clear all menu items for a restaurant
async function clearAllMenuItems(restaurantId: number): Promise<void> {
  // Get all category IDs for this restaurant
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('restaurant_id', restaurantId);

  if (categories) {
    for (const cat of categories) {
      await clearCategoryItems(cat.id);
    }
  }

  // Also delete all categories to start fresh
  await supabase
    .from('menu_categories')
    .delete()
    .eq('restaurant_id', restaurantId);
}

// Sync a category menu (helper function)
async function syncCategoryMenu(
  restaurantId: number,
  categoryMenu: CategoryMenu
): Promise<number> {
  let totalItems = 0;

  for (const [categoryName, items] of Object.entries(categoryMenu)) {
    const categoryId = await getOrCreateCategory(restaurantId, categoryName);
    if (!categoryId) {
      console.error(`[syncTrueGritsMenu] Failed to get/create category: ${categoryName}`);
      continue;
    }

    await insertMenuItems(categoryId, items);
    totalItems += items.length;
    console.log(`[syncTrueGritsMenu] Synced ${items.length} items for ${categoryName}`);
  }

  return totalItems;
}

// Main sync function
export async function syncTrueGritsMenu(): Promise<{ success: boolean; message: string; itemCount: number }> {
  console.log('[syncTrueGritsMenu] Starting sync...');

  try {
    // Get or create True Grits restaurant
    const restaurantId = await getOrCreateTrueGritsRestaurant();
    if (!restaurantId) {
      return { success: false, message: 'Failed to get or create True Grits restaurant', itemCount: 0 };
    }

    console.log('[syncTrueGritsMenu] Restaurant ID:', restaurantId);

    // Clear existing menu to start fresh
    await clearAllMenuItems(restaurantId);
    console.log('[syncTrueGritsMenu] Cleared existing menu');

    // Try to fetch today's menu from API
    const today = new Date().toISOString().split('T')[0];
    const apiData = await fetchMenuFromAPI(today);

    let totalItems = 0;
    let dataSource: string;

    if (apiData?.meals) {
      // Use API data - group by station
      dataSource = 'UMBC SGA API';

      // Process each meal period's items grouped by station
      if (apiData.meals.breakfast && apiData.meals.breakfast.length > 0) {
        const breakfastByStation = processAPIMenuByStation(apiData.meals.breakfast, 4.99);
        totalItems += await syncCategoryMenu(restaurantId, breakfastByStation);
      }

      if (apiData.meals.lunch && apiData.meals.lunch.length > 0) {
        const lunchByStation = processAPIMenuByStation(apiData.meals.lunch, 7.99);
        totalItems += await syncCategoryMenu(restaurantId, lunchByStation);
      }

      if (apiData.meals.dinner && apiData.meals.dinner.length > 0) {
        const dinnerByStation = processAPIMenuByStation(apiData.meals.dinner, 9.99);
        totalItems += await syncCategoryMenu(restaurantId, dinnerByStation);
      }

      // Always add late night static menu
      totalItems += await syncCategoryMenu(restaurantId, LATE_NIGHT_MENU);

    } else {
      // Use fallback static menus organized by station
      dataSource = 'fallback static menu (API unavailable)';
      console.log('[syncTrueGritsMenu] API returned no data, using fallback menus');

      // Sync breakfast stations
      totalItems += await syncCategoryMenu(restaurantId, BREAKFAST_MENU);

      // Sync lunch stations
      totalItems += await syncCategoryMenu(restaurantId, LUNCH_MENU);

      // Sync dinner stations
      totalItems += await syncCategoryMenu(restaurantId, DINNER_MENU);

      // Sync late night
      totalItems += await syncCategoryMenu(restaurantId, LATE_NIGHT_MENU);
    }

    console.log('[syncTrueGritsMenu] Using data source:', dataSource);
    console.log('[syncTrueGritsMenu] Total items synced:', totalItems);

    return {
      success: true,
      message: `Synced ${totalItems} items from ${dataSource}`,
      itemCount: totalItems
    };
  } catch (error) {
    console.error('[syncTrueGritsMenu] Unexpected error:', error);
    return { success: false, message: `Error: ${error}`, itemCount: 0 };
  }
}

// Function to check current menu status
export async function getTrueGritsMenuStatus(): Promise<{
  exists: boolean;
  itemCount: number;
  categories: string[];
}> {
  const { data } = await supabase
    .from('full_menu')
    .select('category_name, item_name')
    .eq('restaurant_slug', 'true-grits');

  if (!data || data.length === 0) {
    return { exists: false, itemCount: 0, categories: [] };
  }

  const categories = [...new Set(data.map(item => item.category_name))];
  return {
    exists: true,
    itemCount: data.length,
    categories
  };
}
