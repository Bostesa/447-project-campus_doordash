import { supabase } from './supabaseClient';

// Static late night items (always available, API doesn't have these)
const LATE_NIGHT_ITEMS = [
  { name: 'Pizza Slice', description: 'Fresh hot pizza slice', price: 3.50, calories: 285 },
  { name: 'Chicken Tenders (4 pc)', description: 'Crispy breaded chicken tenders with dipping sauce', price: 6.99, calories: 420 },
  { name: 'French Fries', description: 'Golden crispy fries', price: 3.50, calories: 365 },
  { name: 'Mozzarella Sticks (6 pc)', description: 'Breaded mozzarella with marinara sauce', price: 5.99, calories: 480 },
  { name: 'Soft Drink', description: 'Fountain beverage (16 oz)', price: 2.00, calories: 150 },
  { name: 'Cheeseburger', description: 'Classic burger with cheese, lettuce, tomato', price: 7.99, calories: 550 },
  { name: 'Grilled Cheese', description: 'Melted American cheese on toasted bread', price: 4.99, calories: 380 },
];

// Static fallback menu for when API is unavailable
const FALLBACK_MENU = {
  breakfast: [
    { name: 'Scrambled Eggs', description: 'Fluffy scrambled eggs', price: 3.99, calories: 180 },
    { name: 'Bacon (3 strips)', description: 'Crispy bacon strips', price: 2.99, calories: 120 },
    { name: 'Pancakes (2)', description: 'Buttermilk pancakes with syrup', price: 4.99, calories: 350 },
    { name: 'French Toast', description: 'Classic French toast with syrup', price: 4.99, calories: 380 },
    { name: 'Hash Browns', description: 'Crispy shredded potatoes', price: 2.49, calories: 210 },
    { name: 'Oatmeal', description: 'Hot oatmeal with brown sugar', price: 2.99, calories: 150 },
    { name: 'Fresh Fruit Cup', description: 'Seasonal fresh fruits', price: 3.49, calories: 80 },
    { name: 'Breakfast Burrito', description: 'Eggs, cheese, and sausage in a flour tortilla', price: 6.99, calories: 520 },
    { name: 'Yogurt Parfait', description: 'Greek yogurt with granola and berries', price: 4.49, calories: 280 },
    { name: 'Coffee', description: 'Fresh brewed coffee', price: 1.99, calories: 5 },
  ],
  lunch: [
    { name: 'Grilled Chicken Sandwich', description: 'Grilled chicken breast with lettuce and tomato', price: 8.99, calories: 450 },
    { name: 'Turkey Club', description: 'Triple-decker turkey sandwich with bacon', price: 9.49, calories: 580 },
    { name: 'Caesar Salad', description: 'Romaine lettuce with Caesar dressing and croutons', price: 7.99, calories: 320 },
    { name: 'Chicken Caesar Salad', description: 'Caesar salad topped with grilled chicken', price: 9.99, calories: 480 },
    { name: 'Soup of the Day', description: 'Chef\'s daily soup selection', price: 4.99, calories: 200 },
    { name: 'Veggie Wrap', description: 'Fresh vegetables in a spinach wrap', price: 7.49, calories: 380 },
    { name: 'Quesadilla', description: 'Cheese quesadilla with salsa and sour cream', price: 6.99, calories: 450 },
    { name: 'Chicken Quesadilla', description: 'Grilled chicken quesadilla with toppings', price: 8.99, calories: 580 },
    { name: 'Garden Salad', description: 'Mixed greens with choice of dressing', price: 5.99, calories: 150 },
    { name: 'Soft Drink', description: 'Fountain beverage', price: 2.00, calories: 150 },
  ],
  dinner: [
    { name: 'Grilled Chicken Plate', description: 'Grilled chicken with rice and vegetables', price: 10.99, calories: 520 },
    { name: 'Pasta Marinara', description: 'Penne pasta with marinara sauce', price: 8.99, calories: 480 },
    { name: 'Chicken Alfredo', description: 'Fettuccine with creamy Alfredo and grilled chicken', price: 11.99, calories: 680 },
    { name: 'Stir Fry', description: 'Vegetables and protein over rice', price: 9.99, calories: 450 },
    { name: 'Fish Tacos (2)', description: 'Grilled fish tacos with slaw and lime crema', price: 9.99, calories: 420 },
    { name: 'BBQ Chicken', description: 'BBQ glazed chicken with sides', price: 10.99, calories: 550 },
    { name: 'Vegetable Curry', description: 'Mixed vegetables in curry sauce over rice', price: 8.99, calories: 380 },
    { name: 'Burger', description: 'Classic beef burger with fries', price: 9.99, calories: 750 },
    { name: 'Loaded Baked Potato', description: 'Baked potato with butter, sour cream, cheese, and bacon', price: 6.99, calories: 450 },
    { name: 'Mac and Cheese', description: 'Creamy macaroni and cheese', price: 6.99, calories: 520 },
  ],
};

interface MenuItem {
  name: string;
  description: string;
  price: number;
  calories?: number;
}

interface APIResponse {
  date?: string;
  meals?: {
    breakfast?: Array<{ name: string; description?: string; calories?: number; station?: string }>;
    lunch?: Array<{ name: string; description?: string; calories?: number; station?: string }>;
    dinner?: Array<{ name: string; description?: string; calories?: number; station?: string }>;
  };
}

// Fetch menu from UMBC SGA API
async function fetchMenuFromAPI(date: string): Promise<APIResponse | null> {
  try {
    const response = await fetch(`https://api.sga.umbc.edu/menus/dhall/${date}`);
    const data = await response.json();

    // API returns null when no menu is available
    if (!data || data === null) {
      console.log('[syncTrueGritsMenu] API returned null for date:', date);
      return null;
    }

    console.log('[syncTrueGritsMenu] API response:', data);
    return data;
  } catch (error) {
    console.error('[syncTrueGritsMenu] Error fetching from API:', error);
    return null;
  }
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
      open_time: '07:00:00',
      close_time: '23:00:00',
      latitude: 39.2537,
      longitude: -76.7143
    })
    .select('id')
    .single();

  if (error) {
    console.error('[syncTrueGritsMenu] Error creating restaurant:', error);
    return null;
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

    // Try to fetch today's menu from API
    const today = new Date().toISOString().split('T')[0];
    const apiData = await fetchMenuFromAPI(today);

    let menuData: { breakfast: MenuItem[]; lunch: MenuItem[]; dinner: MenuItem[] };
    let dataSource: string;

    if (apiData?.meals) {
      // Use API data
      dataSource = 'UMBC SGA API';
      menuData = {
        breakfast: (apiData.meals.breakfast || []).map(item => ({
          name: item.name,
          description: item.description || item.station || '',
          price: 8.99, // API doesn't provide prices, use default
          calories: item.calories
        })),
        lunch: (apiData.meals.lunch || []).map(item => ({
          name: item.name,
          description: item.description || item.station || '',
          price: 9.99,
          calories: item.calories
        })),
        dinner: (apiData.meals.dinner || []).map(item => ({
          name: item.name,
          description: item.description || item.station || '',
          price: 10.99,
          calories: item.calories
        }))
      };
    } else {
      // Use fallback static menu
      dataSource = 'fallback static menu';
      menuData = FALLBACK_MENU;
    }

    console.log('[syncTrueGritsMenu] Using data source:', dataSource);

    let totalItems = 0;

    // Sync each meal category
    const categories = [
      { name: 'Breakfast', items: menuData.breakfast },
      { name: 'Lunch', items: menuData.lunch },
      { name: 'Dinner', items: menuData.dinner },
      { name: 'Late Night', items: LATE_NIGHT_ITEMS }
    ];

    for (const category of categories) {
      const categoryId = await getOrCreateCategory(restaurantId, category.name);
      if (!categoryId) {
        console.error(`[syncTrueGritsMenu] Failed to get/create category: ${category.name}`);
        continue;
      }

      // Clear existing items and insert new ones
      await clearCategoryItems(categoryId);
      await insertMenuItems(categoryId, category.items);

      totalItems += category.items.length;
      console.log(`[syncTrueGritsMenu] Synced ${category.items.length} items for ${category.name}`);
    }

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
