"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Role = "user" | "expert" | "admin";
const ROLES: Role[] = ["user", "expert", "admin"];

interface UserRow {
  user_id: string;
  email: string | null;
  role: Role;
  expert_demos: string[];
}

/**
 * Interactive user table. Loads every account from /api/admin/users and lets an
 * admin change each one's role and expert-demo grants. Edits are optimistic:
 * the row updates immediately, PATCHes in the background, and reverts on error.
 */
export default function AdminUsersClient({ demos }: { demos: string[] }) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // user_id → "saving" | error message. Absent means idle/clean.
  const [status, setStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `Failed to load users (${res.status})`);
        }
        const data = (await res.json()) as { users: UserRow[] };
        if (!cancelled) setUsers(data.users);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load users");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback(
    async (
      userId: string,
      payload: { role?: Role; expertDemos?: string[] },
      previous: UserRow
    ) => {
      setStatus((s) => ({ ...s, [userId]: "saving" }));
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `Update failed (${res.status})`);
        }
        const data = (await res.json()) as { user: UserRow };
        // Reconcile with the server's canonical row (it cleans unknown demos).
        setUsers((rows) =>
          rows
            ? rows.map((r) => (r.user_id === userId ? { ...r, ...data.user } : r))
            : rows
        );
        setStatus((s) => {
          const next = { ...s };
          delete next[userId];
          return next;
        });
      } catch (err) {
        // Revert the optimistic change and surface the error on the row.
        setUsers((rows) =>
          rows ? rows.map((r) => (r.user_id === userId ? previous : r)) : rows
        );
        setStatus((s) => ({
          ...s,
          [userId]: err instanceof Error ? err.message : "Update failed",
        }));
      }
    },
    []
  );

  const setRole = useCallback(
    (row: UserRow, role: Role) => {
      if (role === row.role) return;
      setUsers((rows) =>
        rows ? rows.map((r) => (r.user_id === row.user_id ? { ...r, role } : r)) : rows
      );
      void patch(row.user_id, { role }, row);
    },
    [patch]
  );

  const toggleDemo = useCallback(
    (row: UserRow, demo: string) => {
      const has = row.expert_demos.includes(demo);
      const expertDemos = has
        ? row.expert_demos.filter((d) => d !== demo)
        : [...row.expert_demos, demo];
      setUsers((rows) =>
        rows
          ? rows.map((r) =>
              r.user_id === row.user_id ? { ...r, expert_demos: expertDemos } : r
            )
          : rows
      );
      void patch(row.user_id, { expertDemos }, row);
    },
    [patch]
  );

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(q) ||
        u.user_id.toLowerCase().includes(q)
    );
  }, [users, query]);

  if (loadError) {
    return (
      <p className="py-8 text-sm text-red-700">
        {loadError}
      </p>
    );
  }

  if (!users) {
    return <p className="py-8 text-sm text-gray-500">Loading users…</p>;
  }

  return (
    <div className="py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by email…"
          className="w-64 rounded-md border border-gray-400 bg-white/70 px-3 py-1.5 text-sm text-black placeholder:text-gray-500 focus:border-[#c2611f] focus:outline-none"
        />
        <span className="text-xs text-gray-500">
          {filtered.length} of {users.length} users
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white/40">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Expert demos</th>
              <th className="px-4 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const rowStatus = status[row.user_id];
              const saving = rowStatus === "saving";
              const error = rowStatus && rowStatus !== "saving" ? rowStatus : null;
              const demosDisabled = row.role !== "expert";
              return (
                <tr
                  key={row.user_id}
                  className="border-b border-gray-200 last:border-b-0 align-top"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-black">
                      {row.email ?? "(no email)"}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-gray-500">
                      {row.user_id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.role}
                      disabled={saving}
                      onChange={(e) => setRole(row, e.target.value as Role)}
                      className="rounded-md border border-gray-400 bg-white px-2 py-1 text-sm capitalize text-black focus:border-[#c2611f] focus:outline-none disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="capitalize">
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {demos.map((demo) => {
                        const checked = row.expert_demos.includes(demo);
                        return (
                          <label
                            key={demo}
                            className={
                              "flex items-center gap-1.5 text-xs " +
                              (demosDisabled
                                ? "text-gray-400"
                                : "cursor-pointer text-gray-700")
                            }
                            title={
                              demosDisabled
                                ? "Only applies to experts"
                                : undefined
                            }
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={saving || demosDisabled}
                              onChange={() => toggleDemo(row, demo)}
                              className="h-3.5 w-3.5 accent-[#c2611f]"
                            />
                            {demo}
                          </label>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {saving ? (
                      <span className="text-xs text-gray-500">Saving…</span>
                    ) : error ? (
                      <span className="text-xs text-red-700" title={error}>
                        Failed
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No users match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-gray-500">
        <strong>Role</strong> sets overall access: <em>user</em> is the default,{" "}
        <em>expert</em> can edit the demos checked at right, and <em>admin</em> has
        full access to everything. Demo checkboxes only apply to experts.
      </p>
    </div>
  );
}
