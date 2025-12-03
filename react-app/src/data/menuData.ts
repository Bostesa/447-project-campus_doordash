export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
}

export const menuData: Record<string, MenuItem[]> = {
  'chick-fil-a': [
    { id: '1', name: 'Chick-fil-A Sandwich', description: 'Classic chicken sandwich', price: 5.99, category: 'Entrees', icon: '🍗' },
    { id: '2', name: 'Spicy Deluxe Sandwich', description: 'Spicy chicken with lettuce & tomato', price: 6.49, category: 'Entrees', icon: '🌶️' },
    { id: '3', name: 'Nuggets (8 count)', description: 'Hand-breaded chicken nuggets', price: 5.29, category: 'Entrees', icon: '🍖' },
    { id: '4', name: 'Waffle Fries', description: 'Crispy waffle-cut fries', price: 2.99, category: 'Sides', icon: '🍟' },
    { id: '5', name: 'Lemonade', description: 'Freshly squeezed lemonade', price: 2.49, category: 'Drinks', icon: '🍋' },
  ],
  'starbucks': [
    { id: '1', name: 'Caramel Macchiato', description: 'Espresso with vanilla and caramel', price: 5.25, category: 'Hot Drinks', icon: '☕' },
    { id: '2', name: 'Iced Latte', description: 'Cold espresso with milk', price: 4.95, category: 'Cold Drinks', icon: '🧊' },
    { id: '3', name: 'Pumpkin Spice Latte', description: 'Seasonal favorite with pumpkin', price: 5.75, category: 'Hot Drinks', icon: '🎃' },
    { id: '4', name: 'Blueberry Muffin', description: 'Fresh baked muffin', price: 3.25, category: 'Food', icon: '🫐' },
    { id: '5', name: 'Egg Bites', description: 'Sous vide egg bites', price: 4.95, category: 'Food', icon: '🥚' },
  ],
  'dining-hall': [
    { id: '1', name: 'Grilled Chicken Plate', description: 'With rice and vegetables', price: 8.99, category: 'Entrees', icon: '🍗' },
    { id: '2', name: 'Pasta Alfredo', description: 'Creamy pasta with garlic bread', price: 7.99, category: 'Entrees', icon: '🍝' },
    { id: '3', name: 'Caesar Salad', description: 'Fresh romaine with caesar dressing', price: 6.49, category: 'Salads', icon: '🥗' },
    { id: '4', name: 'Pizza Slice', description: 'Fresh hot pizza slice', price: 3.50, category: 'Quick Bites', icon: '🍕' },
    { id: '5', name: 'Soft Drink', description: 'Fountain beverage', price: 1.99, category: 'Drinks', icon: '🥤' },
  ],
  'einstein-bros-bagels': [
    { id: '1', name: 'Everything Bagel', description: 'With cream cheese', price: 3.99, category: 'Bagels', icon: '🥯' },
    { id: '2', name: 'Bacon Egg & Cheese', description: 'On a toasted bagel', price: 6.49, category: 'Sandwiches', icon: '🥓' },
    { id: '3', name: 'Cinnamon Sugar Bagel', description: 'Sweet cinnamon bagel', price: 3.49, category: 'Bagels', icon: '🥯' },
    { id: '4', name: 'Coffee', description: 'Fresh brewed coffee', price: 2.49, category: 'Drinks', icon: '☕' },
    { id: '5', name: 'Hash Browns', description: 'Crispy hash browns', price: 2.99, category: 'Sides', icon: '🥔' },
  ],
  'the-commons': [
    { id: '1', name: 'Cheeseburger', description: 'Juicy beef patty with cheese, lettuce, tomato', price: 9.50, category: 'Burgers', icon: '🍔' },
    { id: '2', name: 'Classic Fries', description: 'Crispy golden fries', price: 3.50, category: 'Sides', icon: '🍟' },
    { id: '3', name: 'Chicken Tenders', description: 'Breaded chicken tenders with sauce', price: 8.50, category: 'Entrees', icon: '🍗' },
    { id: '4', name: 'Veggie Wrap', description: 'Fresh vegetables in a wrap', price: 7.99, category: 'Wraps', icon: '🌯' },
    { id: '5', name: 'Milkshake', description: 'Vanilla, chocolate, or strawberry', price: 4.99, category: 'Drinks', icon: '🥛' },
    { id: '6', name: 'Buffalo Wings', description: '6 pieces with ranch', price: 9.99, category: 'Appetizers', icon: '🍗' },
  ],
  'dunkin-donuts': [
    { id: '1', name: 'Glazed Donut', description: 'Classic glazed donut', price: 1.49, category: 'Donuts', icon: '🍩' },
    { id: '2', name: 'Boston Kreme', description: 'Chocolate topped with cream filling', price: 1.99, category: 'Donuts', icon: '🍩' },
    { id: '3', name: 'Iced Coffee', description: 'Cold brewed iced coffee', price: 3.29, category: 'Drinks', icon: '🧊' },
    { id: '4', name: 'Breakfast Sandwich', description: 'Egg, cheese & bacon on english muffin', price: 4.99, category: 'Food', icon: '🥪' },
    { id: '5', name: 'Munchkins (10 pack)', description: 'Donut holes variety pack', price: 3.99, category: 'Donuts', icon: '🍩' },
  ],
};

export const restaurantNames: Record<string, string> = {
  'chick-fil-a': 'Chick-fil-A',
  'starbucks': 'Starbucks',
  'dining-hall': 'Dining Hall',
  'einstein-bros-bagels': 'Einstein Bros Bagels',
  'the-commons': 'The Commons',
  'dunkin-donuts': 'Dunkin Donuts',
};
