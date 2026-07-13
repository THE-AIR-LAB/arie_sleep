import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin, KNOWN_DEMOS } from "../../lib/admin-auth";
import SiteLogo from "../../components/SiteLogo";
import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

/**
 * Admin-only screen for granting rights to users: set each account's role
 * (user / expert / admin) and, for experts, which demos they may edit. Backed
 * by the existing GET /api/admin/users and PATCH /api/admin/users/[id] routes.
 */
export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/");
  }

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-[#E1DECF]">
      <nav className="w-full bg-[#E1DECF] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl py-6">
          <SiteLogo size={160} />
        </div>
      </nav>
      <div className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between border-b border-gray-300 py-4">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-gray-500">
                Admin
              </p>
              <h1 className="font-test-american-grotesk text-2xl font-bold text-black">
                User roles &amp; permissions
              </h1>
            </div>
            <Link
              href="/demo/sleep/studio/config"
              className="pb-1 text-xs text-gray-500 underline hover:text-gray-700"
            >
              Model setup
            </Link>
          </div>
          <AdminUsersClient demos={[...KNOWN_DEMOS]} />
        </div>
      </div>
    </div>
  );
}
