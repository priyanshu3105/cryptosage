import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    authUser?: {
      id: string;
      email: string;
      name: string;
      isGuest?: boolean;
    };
  }
}
