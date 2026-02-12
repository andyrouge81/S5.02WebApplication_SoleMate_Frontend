export type ArchType = "PES_PLANUS" | "PES_RECTUS" | "PES_CAVUS";
export type SwipeAction = "LIKE" | "DISLIKE";

export type AuthResponse = { token: string };

export type CurrentUser = {
  id: number;
  username: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
};

export type Foot = {
  id: number;
  title: string;
  imageUrl: string;
  archType: ArchType;
  ownerUsername: string;
  createdAt: string;
};

export type Review = {
  id: number;
  comment: string;
  rateAspect: number;
  reviewUsername: string;
  createdAt: string;
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
  createdAt: string;
};

export type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

export type Swipe = {
  footId: number;
  action: SwipeAction;
  createdAt: string;
};

export type MinigameLibraryResponse = {
  folders: string[];
  selectedFolder: string | null;
  images: string[];
};
