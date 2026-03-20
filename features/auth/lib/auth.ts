import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

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
    // Keep default session behavior; this hook exists so you can customize later.
    async session({ session }) {
      return session;
    },
  },
};

export default authOptions;

