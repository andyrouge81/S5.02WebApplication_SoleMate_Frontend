export type AuthResponse = { token: string };

export type CurrentUser = {
  id: number;
  username: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
};

export type Foot = {
  id: number;
  nickname: string;
  imageUrl: string;
  archType: "PES_PLANUS" | "PES_RECTUS" | "PES_CAVUS";
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
