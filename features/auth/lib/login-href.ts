/** `/login?callbackUrl=…` for post-sign-in return (see `LoginScreen` + NextAuth). */
export function loginHref(callbackUrl: string): string {
  const q = new URLSearchParams();
  q.set("callbackUrl", callbackUrl);
  return `/login?${q.toString()}`;
}
