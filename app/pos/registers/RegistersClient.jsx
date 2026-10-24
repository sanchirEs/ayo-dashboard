"use client";

/**
 * Tills (Касс): one row per register, per branch. A new register gets a 6-digit
 * code that the till PC types in once to pair (spec §8.1, §16.2).
 */

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { createRegister, listLocations, listRegisters, newPairingCode, revokeRegister } from "@/lib/api/pos";
import { formatCountdown, secondsLeft } from "@/lib/pos/validation";
import { Button, C, Dialog, ErrorText, Field, Pill, Table, ago } from "@/components/pos/ui";

const POLL_MS = 3000;
// The template gives .tf-button its own height; pin it so row actions stay compact.
const ROW_BUTTON = { padding: "0 14px", fontSize: 14, height: 36, lineHeight: "20px" };

function statusOf(register) {
  if (!register.active) return <Pill tone="gray">Хаагдсан</Pill>;
  if (register.pairingPending) return <Pill tone="amber">Код хүлээж байна</Pill>;
  if (register.pairedAt) return <Pill tone="green">Холбогдсон</Pill>;
  return <Pill tone="amber">Холбогдоогүй</Pill>;
}

/** The code, large, with the time it has left. When it lapses it offers a fresh one. */
function PairingPanel({ code, expiresAt, onNewCode, busy }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const left = secondsLeft(expiresAt, now);
  const expired = left === 0;
  const digits = code.split("");

  return (
    <div>
      <div
        role="group"
        aria-label={`Холбох код: ${digits.join(" ")}`}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          padding: "22px 0 14px",
          opacity: expired ? 0.35 : 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {digits.map((digit, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              width: 48,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 700,
              color: C.text,
              backgroundColor: C.grayBg,
              borderRadius: 10,
              // A gap in the middle reads as 482 913.
              marginRight: i === 2 ? 10 : 0,
            }}
          >
            {digit}
          </span>
        ))}
      </div>

      {expired ? (
        <div role="alert" style={{ textAlign: "center", color: C.amber, fontSize: 15, marginBottom: 14 }}>
          Кодын хугацаа дууслаа.
        </div>
      ) : (
        <div style={{ textAlign: "center", color: C.muted, fontSize: 15, marginBottom: 14 }}>
          <span style={{ fontVariantNumeric: "tabular-nums", color: C.text, fontWeight: 600 }}>{formatCountdown(left)}</span> үлдсэн
        </div>
      )}

      {/* The template strips list markers from li, so the numbers are drawn. */}
      <ol style={{ margin: "0 0 18px", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
        {[
          "Кассын компьютер дээр ayo-pos програмыг нээнэ үү.",
          "Гарч ирсэн талбарт дээрх кодыг оруулна уу.",
        ].map((text, i) => (
          <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", color: C.text, fontSize: 15, lineHeight: "24px", listStyle: "none" }}>
            <span
              aria-hidden="true"
              style={{ flex: "none", width: 24, height: 24, borderRadius: 999, backgroundColor: C.grayBg, color: C.muted, fontSize: 13, textAlign: "center", lineHeight: "24px" }}
            >
              {i + 1}
            </span>
            <span style={{ textWrap: "pretty" }}>{text}</span>
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button kind={expired ? "primary" : "secondary"} onClick={onNewCode} disabled={busy}>
          Шинэ код
        </Button>
      </div>
    </div>
  );
}

/** Once the till has used the code: say so, instead of leaving a stale code on screen. */
function Connected({ name, onDone }) {
  return (
    <div style={{ textAlign: "center", padding: "18px 0 4px" }}>
      <div
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          margin: "0 auto 14px",
          borderRadius: 999,
          backgroundColor: C.greenBg,
          color: C.green,
          fontSize: 34,
          lineHeight: "64px",
        }}
      >
        &#10003;
      </div>
      <div role="status" style={{ fontSize: 17, fontWeight: 600, color: C.text }}>
        {name} холбогдлоо
      </div>
      <p style={{ color: C.muted, fontSize: 15, margin: "6px 0 20px" }}>Одоо ажилтан PIN-ээрээ нэвтэрч болно.</p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button onClick={onDone}>Болсон</Button>
      </div>
    </div>
  );
}

/**
 * Create a register, or get a fresh code for an existing one. While the code is
 * showing, the list is polled so the dialog can tell the owner it worked.
 */
function PairDialog({ token, locations, existing, onClose, onChanged }) {
  const [form, setForm] = useState({ locationId: locations[0]?.id ?? "", name: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pairing, setPairing] = useState(existing ? { id: existing.id, name: existing.name, code: null, expiresAt: null } : null);
  const [connected, setConnected] = useState(false);
  const [baseline, setBaseline] = useState(existing?.pairedAt ?? null);

  const issue = useCallback(
    async (id) => {
      setBusy(true);
      setError(null);
      try {
        const fresh = await newPairingCode(id, token);
        setPairing((p) => ({ ...p, code: fresh.pairingCode, expiresAt: fresh.expiresAt }));
        onChanged();
      } catch (e) {
        setError(e.message);
      }
      setBusy(false);
    },
    [token, onChanged]
  );

  // An existing register opens straight on a new code.
  useEffect(() => {
    if (existing) issue(existing.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for the till using the code.
  useEffect(() => {
    if (!pairing?.code || connected) return undefined;
    const timer = setInterval(async () => {
      try {
        const row = (await listRegisters(token)).find((r) => r.id === pairing.id);
        if (row && row.pairedAt && row.pairedAt !== baseline && !row.pairingPending) {
          setConnected(true);
          onChanged();
        }
      } catch {
        // A missed poll is harmless; the next one tries again.
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [pairing?.id, pairing?.code, connected, baseline, token, onChanged]);

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.locationId) next.locationId = "Салбараа сонгоно уу";
    if (!form.name.trim()) next.name = "Кассын нэрийг оруулна уу";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError(null);
    try {
      const out = await createRegister({ locationId: Number(form.locationId), name: form.name.trim() }, token);
      setBaseline(null);
      setPairing({ id: out.register.id, name: out.register.name, code: out.pairingCode, expiresAt: out.expiresAt });
      onChanged();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const title = pairing ? "Кассыг холбох" : "Касс нэмэх";

  return (
    <Dialog title={title} onClose={onClose} width={440}>
      {connected ? (
        <Connected name={pairing.name} onDone={onClose} />
      ) : pairing ? (
        <>
          <div style={{ fontSize: 15, color: C.muted }}>{pairing.name}</div>
          {pairing.code ? (
            <PairingPanel code={pairing.code} expiresAt={pairing.expiresAt} onNewCode={() => issue(pairing.id)} busy={busy} />
          ) : (
            <div style={{ padding: "30px 0", textAlign: "center", color: C.muted }}>Код үүсгэж байна…</div>
          )}
          <ErrorText>{error}</ErrorText>
        </>
      ) : (
        <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
          <Field label="Салбар" error={errors.locationId}>
            {(props) => (
              <select
                {...props}
                data-autofocus
                value={form.locationId}
                onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.kind === "TEST" ? " (туршилт)" : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Кассын нэр" hint="Жишээ нь: Касс 1" error={errors.name}>
            {(props) => <input {...props} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}
          </Field>
          <ErrorText>{error}</ErrorText>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button kind="secondary" onClick={onClose}>
              Болих
            </Button>
            <Button type="submit" disabled={busy}>
              Үүсгэх
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function RevokeDialog({ register, token, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const revoke = async () => {
    setBusy(true);
    setError(null);
    try {
      await revokeRegister(register.id, token);
      await onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title="Касс хаах уу?" onClose={onClose} width={420}>
      <p style={{ margin: "0 0 16px", fontSize: 15, color: C.text, lineHeight: 1.5 }}>
        «{register.name}» ({register.locationName}) касс дахин нэвтэрч чадахгүй болно. Хэрэгтэй бол шинэ касс нэмж холбоно.
      </p>
      <ErrorText>{error}</ErrorText>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
        <Button kind="secondary" onClick={onClose} data-autofocus>
          Болих
        </Button>
        <Button kind="danger" onClick={revoke} disabled={busy}>
          Касс хаах
        </Button>
      </div>
    </Dialog>
  );
}

export default function RegistersClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [registers, setRegisters] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // null | { kind: "new" } | { kind: "code", register } | { kind: "revoke", register }
  const [dialog, setDialog] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [regs, locs] = await Promise.all([listRegisters(token), listLocations(token)]);
      setRegisters(regs);
      setLocations(locs);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [token]);

  // token is a dependency on purpose: useSession is undefined on first render.
  useEffect(() => {
    load();
  }, [load]);

  const rows = registers.map((r) => ({
    key: r.id,
    name: (
      <span>
        <span style={{ fontWeight: 600 }}>{r.name}</span>
        <span style={{ color: C.faint }}> №{r.number}</span>
      </span>
    ),
    branch: r.locationName ? `${r.locationName}${r.locationCode ? ` (${r.locationCode})` : ""}` : "—",
    status: statusOf(r),
    lastSeen: (
      <span style={{ lineHeight: 1.4 }}>
        {r.lastSeenAt ? ago(r.lastSeenAt) : <span style={{ color: C.faint }}>Холбогдоогүй</span>}
        {r.appVersion && <span style={{ display: "block", fontSize: 13, color: C.faint }}>Хувилбар {r.appVersion}</span>}
      </span>
    ),
    actions: r.active ? (
      <span style={{ display: "inline-flex", gap: 8 }}>
        <Button kind="secondary" style={ROW_BUTTON} onClick={() => setDialog({ kind: "code", register: r })}>
          Шинэ код
        </Button>
        <Button kind="danger" style={ROW_BUTTON} onClick={() => setDialog({ kind: "revoke", register: r })}>
          Касс хаах
        </Button>
      </span>
    ) : null,
  }));

  return (
    <div className="wg-box">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <p style={{ margin: 0, color: C.muted, fontSize: 15, maxWidth: 560 }}>
          Салбар бүрийн кассын компьютер. Шинэ касс нэмээд гарсан кодыг компьютер дээр нэг удаа оруулна.
        </p>
        <Button onClick={() => setDialog({ kind: "new" })} disabled={!token || locations.length === 0}>
          <i className="icon-plus" /> Касс нэмэх
        </Button>
      </div>

      <ErrorText>{error}</ErrorText>

      <div style={{ marginTop: 18 }}>
        <Table
          cols={[
            { key: "name", label: "Касс", width: 170 },
            { key: "branch", label: "Салбар", width: 210 },
            { key: "status", label: "Төлөв", width: 170 },
            { key: "lastSeen", label: "Сүүлд холбогдсон", width: 170 },
            { key: "actions", label: "", align: "right" },
          ]}
          rows={loading ? [] : rows}
          empty={loading || !token ? "Ачаалж байна…" : "Касс бүртгэгдээгүй байна. «Касс нэмэх» дарж эхний кассаа нэмнэ үү."}
        />
      </div>

      {dialog?.kind === "new" && (
        <PairDialog token={token} locations={locations} onClose={() => setDialog(null)} onChanged={load} />
      )}
      {dialog?.kind === "code" && (
        <PairDialog token={token} locations={locations} existing={dialog.register} onClose={() => setDialog(null)} onChanged={load} />
      )}
      {dialog?.kind === "revoke" && (
        <RevokeDialog
          register={dialog.register}
          token={token}
          onClose={() => setDialog(null)}
          onDone={async () => {
            setDialog(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
