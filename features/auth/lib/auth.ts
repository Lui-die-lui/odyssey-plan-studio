import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

import { logPrismaDatasourceUsage, prisma } from "@/lib/prisma";

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
    async signIn({ account }) {
      if (!account?.provider || !account.providerAccountId) return true;
      logPrismaDatasourceUsage("nextauth.signIn");

      type WithdrawalUserRow = {
        status?: "ACTIVE" | "PENDING_DELETION" | null;
        hardDeleteAt?: Date | null;
        role?: "USER" | "ADMIN" | null;
      } | null;

      const userDelegate = prisma.user as unknown as {
        findUnique: (args: {
          where: unknown;
          select: { status: true; hardDeleteAt: true; role: true };
        }) => Promise<WithdrawalUserRow>;
      };

      const dbUser = await userDelegate.findUnique({
        where: {
          provider_providerUserId: {
            provider: account.provider,
            providerUserId: account.providerAccountId,
          },
        },
        select: {
          status: true,
          hardDeleteAt: true,
          role: true,
        },
      });

      if (dbUser?.status === "PENDING_DELETION") return false;

      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider && account.providerAccountId) {
        logPrismaDatasourceUsage("nextauth.jwt");
        const now = new Date();
        const upsertDelegate = prisma.user as unknown as {
          upsert: (args: unknown) => Promise<{ id: string; role?: "USER" | "ADMIN" | null }>;
        };

        const dbUser = await upsertDelegate.upsert({
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
            lastLoginAt: now,
          },
          update: {
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            lastLoginAt: now,
          },
        });
        token.dbUserId = dbUser.id;
        token.role = dbUser.role === "ADMIN" ? "ADMIN" : "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.dbUserId) {
        session.user.id = token.dbUserId;
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      }
      return session;
    },
  },
};

export default authOptions;

