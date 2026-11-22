import Link from "next/link";
import { headers } from "next/headers";
import { sessionUser } from "@/lib/auth";

export function AccountLinks({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <Link href={signedIn ? "/dashboard" : "/sign-in"} className="btn btn-ghost">
        {signedIn ? "Dashboard" : "Sign in"}
      </Link>
      <Link href={signedIn ? "/dashboard#api-keys" : "/dashboard"} className="btn btn-primary">
        {signedIn ? "Manage keys" : "Get API key"}
      </Link>
    </>
  );
}

export async function AccountNav() {
  const user = await sessionUser(await headers());
  return <AccountLinks signedIn={Boolean(user)} />;
}
