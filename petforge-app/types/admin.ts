export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  credits: number;
  createdAt: string;
  _count: {
    orders: number;
    petIPs: number;
  };
}

export interface PetIP {
  id: string;
  name: string;
  style: string;
  rarity: string;
  likes: number;
  isPublic: boolean;
  createdAt: string;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
}
