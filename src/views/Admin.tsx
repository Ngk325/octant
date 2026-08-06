import { useCallback, useEffect, useState } from "react";
import { usePublishContext } from "../chat/ChatContext";
import { Panel } from "../components/Bits";
import Explain from "../components/Explain";

/* ------------------------------------------------------------------ *
 * WHO CAN GET IN.
 *
 * The owner's surface. The API behind it refuses anyone else outright,
 * so this page is a convenience rather than the security boundary — but
 * it still declines to render for a non-owner, because showing somebody
 * a list of buttons that will all fail is not a kindness.
 * ------------------------------------------------------------------ */

type Status = "pending" | "approved" | "blocked";

interface User {
  email: string;
  name: string;
  status: Status;
  firstSeen: number;
  lastSeen: number;
  owner?: boolean;
}

type SchStatus = "pending" | "approved" | "denied";

interface ScholarshipRequest {
  email: string;
  name: string;
  country: string;
  reason: string;
  status: SchStatus;
  submittedAt: number;
  decidedAt?: number;
}

const WHEN = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const STATUS_LABEL: Record<Status, string> = {
  pending: "Waiting for you",
  approved: "Has access",
  blocked: "Blocked",
};

const SCH_STATUS_LABEL: Record<SchStatus, string> = {
  pending: "Waiting for you",
  approved: "Approved",
  denied: "Denied",
};

/** Who can get in, and the controls to change that. Owner only. */
export default function Admin() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  usePublishContext(() => ({ kind: "admin" }), []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setError("This page is for the owner of this deployment.");
        return;
      }
      if (!res.ok) {
        setError("Could not load the list.");
        return;
      }
      const data = (await res.json()) as { users: User[] };
      setUsers(data.users);
      setError(null);
    } catch {
      setError("Could not reach the server.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const change = async (email: string, status: Status) => {
    setBusy(email);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "That did not work.");
      } else {
        /* Re-read rather than patching locally. KV is eventually consistent, so
           the authoritative answer is whatever the next read says — showing an
           optimistic state here would be showing something possibly untrue. */
        await load();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  };

  const waiting = users?.filter((u) => u.status === "pending") ?? [];
  const rest = users?.filter((u) => u.status !== "pending") ?? [];

  const [requests, setRequests] = useState<ScholarshipRequest[] | null>(null);
  const [schBusy, setSchBusy] = useState<string | null>(null);

  const loadScholarships = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/scholarships");
      if (!res.ok) return; // the users panel above is the one that has to report a load failure
      const data = (await res.json()) as { requests: ScholarshipRequest[] };
      setRequests(data.requests);
    } catch {
      // best-effort — same reasoning as above
    }
  }, []);

  useEffect(() => { void loadScholarships(); }, [loadScholarships]);

  const decideScholarship = async (email: string, decision: "approved" | "denied") => {
    setSchBusy(email);
    try {
      const res = await fetch("/api/admin/scholarships", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, decision }),
      });
      if (res.ok) await loadScholarships();
    } finally {
      setSchBusy(null);
    }
  };

  const waitingSch = requests?.filter((r) => r.status === "pending") ?? [];
  const decidedSch = requests?.filter((r) => r.status !== "pending") ?? [];

  return (
    <>
      <h1>Who can get in</h1>

      <Explain
        big
        plain="Everyone who has ever signed in with Google, and whether you have let them through. Somebody waiting sees a holding page and nothing else — no pages, no assets, no assistant."
      >
        <p>
          Backed by <code>/api/admin/users</code>, which refuses anyone whose session is not the
          owner&rsquo;s. Status lives in KV and is re-read on every page load and API call, so a
          change here takes effect on somebody&rsquo;s next navigation — within about a minute
          allowing for KV&rsquo;s eventual consistency. To end every session everywhere
          immediately, rotate <code>AUTH_SECRET</code> instead.
        </p>
      </Explain>

      {error && <p className="note warn" style={{ marginTop: "var(--s5)" }}>{error}</p>}

      {!users && !error && <p className="muted" style={{ marginTop: "var(--s5)" }}>Loading…</p>}

      {waitingSch.length > 0 && (
        <Panel title={`Scholarship requests — ${waitingSch.length}`} style={{ marginTop: "var(--s5)" }}>
          {waitingSch.map((r) => (
            <ScholarshipRow key={r.email} request={r} busy={schBusy === r.email} onDecide={decideScholarship} />
          ))}
        </Panel>
      )}

      {decidedSch.length > 0 && (
        <Panel title="Past scholarship decisions" style={{ marginTop: "var(--s4)" }}>
          {decidedSch.map((r) => (
            <ScholarshipRow key={r.email} request={r} busy={false} onDecide={decideScholarship} />
          ))}
        </Panel>
      )}

      {waiting.length > 0 && (
        <Panel title={`Waiting for you — ${waiting.length}`} style={{ marginTop: "var(--s5)" }}>
          {waiting.map((u) => (
            <AdminRow key={u.email} user={u} busy={busy === u.email} onChange={change} />
          ))}
        </Panel>
      )}

      {users && (
        <Panel
          title={waiting.length ? "Everyone else" : "Everyone"}
          style={{ marginTop: "var(--s4)" }}
        >
          {rest.length === 0 && (
            <p className="small muted" style={{ margin: 0 }}>
              Nobody yet. People appear here the first time they sign in with Google.
            </p>
          )}
          {rest.map((u) => (
            <AdminRow key={u.email} user={u} busy={busy === u.email} onChange={change} />
          ))}
        </Panel>
      )}

      <p className="small muted" style={{ marginTop: "var(--s5)" }}>
        Invite codes are separate and are not listed here — they live in the{" "}
        <code>ACCESS_CODES</code> secret, and you add or remove one by editing it.
      </p>
    </>
  );
}

function AdminRow({
  user, busy, onChange,
}: {
  user: User;
  busy: boolean;
  onChange(email: string, status: Status): void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s3)",
        flexWrap: "wrap",
        padding: "var(--s3) 0",
        borderTop: "1px solid var(--rule)",
      }}
    >
      <div style={{ flex: "1 1 14rem", minWidth: 0 }}>
        <b style={{ fontFamily: "var(--sans)" }}>{user.name}</b>
        {user.owner && <span className="chip" style={{ marginLeft: 8 }}>you</span>}
        <div className="small muted" style={{ wordBreak: "break-all" }}>{user.email}</div>
        <div className="small muted">
          {STATUS_LABEL[user.status]} · first seen {WHEN(user.firstSeen)}
        </div>
      </div>

      {!user.owner && (
        <div className="cluster" style={{ gap: "var(--s2)" }}>
          {user.status !== "approved" && (
            <button type="button" className="btn primary" disabled={busy} onClick={() => onChange(user.email, "approved")}>
              Approve
            </button>
          )}
          {user.status !== "blocked" && (
            <button type="button" className="btn" disabled={busy} onClick={() => onChange(user.email, "blocked")}>
              Block
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One scholarship application. Approving pre-grants access for whenever this
 * email next signs in with Google — see `preApprove` in the Worker — rather
 * than changing an existing account the way `AdminRow` does, because most
 * applicants have never signed in at all.
 */
function ScholarshipRow({
  request, busy, onDecide,
}: {
  request: ScholarshipRequest;
  busy: boolean;
  onDecide(email: string, decision: "approved" | "denied"): void;
}) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: "var(--s2)",
        padding: "var(--s3) 0", borderTop: "1px solid var(--rule)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--s3)", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 14rem", minWidth: 0 }}>
          <b style={{ fontFamily: "var(--sans)" }}>{request.name}</b>
          <div className="small muted" style={{ wordBreak: "break-all" }}>{request.email}</div>
          <div className="small muted">
            {SCH_STATUS_LABEL[request.status]} · applied {WHEN(request.submittedAt)}
            {request.country ? ` · ${request.country}` : ""}
          </div>
        </div>

        {request.status === "pending" && (
          <div className="cluster" style={{ gap: "var(--s2)" }}>
            <button
              type="button" className="btn primary" disabled={busy}
              onClick={() => onDecide(request.email, "approved")}
            >
              Approve
            </button>
            <button
              type="button" className="btn" disabled={busy}
              onClick={() => onDecide(request.email, "denied")}
            >
              Deny
            </button>
          </div>
        )}
      </div>

      {request.reason && <p className="small muted" style={{ margin: 0 }}>{request.reason}</p>}
    </div>
  );
}
