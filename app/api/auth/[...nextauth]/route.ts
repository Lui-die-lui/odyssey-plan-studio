import NextAuth from "next-auth";

import { authOptions } from "@/features/auth/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
// [...nextauth] = 동적 세그먼트
// auth 아래의 여러 인증 경로를 다 처리한다는 의미
// route.ts = 서버 api 라우트
