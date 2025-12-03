export interface User {
  username: string;
  email: string;
}

export interface Order {
  id: string;
  restaurant: string;
  title: string;
  details: string;
  total: string;
  status: 'active' | 'completed' | 'cancelled';
  icon: string;
  date: string;
}

export interface Restaurant {
  name: string;
  hours: string;
  image: string;
}

export interface Job {
  id: string;
  restaurant: string;
  title: string;
  location: string;
  price: string;
  icon: string;
}
