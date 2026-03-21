import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

import { prisma } from "@/lib/prisma";

const getEnv = (name: string): string | undefined => process.env[name];

const googleClientId = getEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = getEnv("GOOGLE_CLIENT_SECRET");

const kakaoClientId = getEnv("KAKAO_CLIENT_ID");
const kakaoClientSecret = getEnv("KAKAO_CLIENT_SECRET");

export const authOptions: NextAuthOptions = {
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    ...(kakaoClientId && kakaoClientSecret
      ? [
          KakaoProvider({
            clientId: kakaoClientId,
            clientSecret: kakaoClientSecret,
          }),
        ]
      : []),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account?.provider && account.providerAccountId) {
        const dbUser = await prisma.user.upsert({
          where: {
            provider_providerUserId: {
              provider: account.provider,
              providerUserId: account.providerAccountId,
            },
          },
          create: {
            provider: account.provider,
            providerUserId: account.providerAccountId,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
          update: {
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });
        token.dbUserId = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.dbUserId) {
        session.user.id = token.dbUserId;
      }
      return session;
    },
  },
};

export default authOptions;

