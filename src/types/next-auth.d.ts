import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      communityId: string;
      communityName: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    communityId?: string;
    communityName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    communityId?: string;
    communityName?: string;
  }
}
