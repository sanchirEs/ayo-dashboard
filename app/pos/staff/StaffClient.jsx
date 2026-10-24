"use client";

/**
 * Till staff (Ажилтан): who can unlock a till, in which branches, and as what.
 * PINs are only ever typed here; the server keeps a hash (spec §8.1, §16.2).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { createStaff, listLocations, listStaff, resetStaffPin, updateStaff } from "@/lib/api/pos";
import { ROLES, pinFormError, roleLabel } from "@/lib/pos/validation";
import { Button, C, Dialog, ErrorText, Field, Pill, Table } from "@/components/pos/ui";

// The template gives .tf-button its own height; pin it so row actions stay compact.
const ROW_BUTTON = { padding: "0 14px", fontSize: 14, height: 36, lineHeight: "20px" };
const DUPLICATE_PIN = "Энэ PIN өөр ажилтанд олгогдсон";

/** PIN typed twice. Digits only on the keypad, but paste still works. */
function PinFields({ pin, again, setPin, setAgain, errors, hint, label = "PIN" }) {
  return (
    <>
      <Field label={label} hint={hint ?? "4-6 оронтой тоо"} error={errors.pin}>
        {(props) => (
          <input
            {...props}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        )}
      </Field>
      <Field label="PIN давтах" error={errors.again}>
        {(props) => (
          <input
            {...props}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            value={again}
            onChange={(e) => setAgain(e.target.value.replace(/\D/g, ""))}
          />
        )}
      </Field>
    </>
  );
}

function StaffDialog({ token, locations, staff, onClose, onSaved }) {
  const editing = !!staff;
  const [form, setForm] = useState({
    name: staff?.name ?? "",
    phone: staff?.phone ?? "",
    role: staff?.role ?? "CASHIER",
    locationIds: staff?.locations ?? [],
    active: staff?.active ?? true,
  });
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // The server cannot compare PINs it only has hashes of, so adding a branch or
  // switching someone back on means typing the PIN again.
  const addsBranch = editing && form.locationIds.some((id) => !staff.locations.includes(id));
  const reactivates = editing && form.active && !staff.active;
  const needsPin = !editing || addsBranch || reactivates;

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const toggleLocation = (id) =>
    setForm((f) => ({
      ...f,
      locationIds: f.locationIds.includes(id) ? f.locationIds.filter((x) => x !== id) : [...f.locationIds, id],
    }));

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Нэрийг оруулна уу";
    if (form.locationIds.length === 0) next.locations = "Ядаж нэг салбар сонгоно уу";
    if (needsPin) {
      const problem = pinFormError(pin, again);
      if (problem === "PIN-үүд таарахгүй байна") next.again = problem;
      else if (problem) next.pin = problem;
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        locationIds: form.locationIds,
        ...(needsPin ? { pin } : {}),
      };
      if (editing) await updateStaff(staff.id, { ...body, phone: form.phone.trim(), active: form.active }, token);
      else await createStaff(body, token);
      await onSaved();
    } catch (e) {
      // A taken PIN belongs under the PIN field, not in a banner.
      if (e.message === DUPLICATE_PIN) setErrors({ pin: e.message });
      else setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title={editing ? "Ажилтан засах" : "Ажилтан нэмэх"} onClose={onClose} width={500}>
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        <Field label="Нэр" error={errors.name}>
          {(props) => <input {...props} data-autofocus value={form.name} onChange={set("name")} autoComplete="off" />}
        </Field>
        <Field label="Утас">
          {(props) => <input {...props} type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} autoComplete="off" />}
        </Field>
        <Field label="Дүр">
          {(props) => (
            <select {...props} value={form.role} onChange={set("role")}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          )}
        </Field>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }} aria-describedby={errors.locations ? "locations-error" : undefined}>
          <legend style={{ fontSize: 13, color: C.muted, marginBottom: 6, padding: 0 }}>Ажиллах салбар</legend>
          <div style={{ display: "grid", gap: 4 }}>
            {locations.map((l) => (
              // The whole row is the label, so the target is the full width and 40px tall.
              <label key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 40, fontSize: 15, color: C.text, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.locationIds.includes(l.id)}
                  onChange={() => toggleLocation(l.id)}
                  style={{ width: 18, height: 18 }}
                />
                {l.name}
                {l.kind === "TEST" && <span style={{ color: C.faint }}>(туршилт)</span>}
              </label>
            ))}
          </div>
          {errors.locations && (
            <div id="locations-error" style={{ fontSize: 13, color: C.red, marginTop: 5 }}>
              {errors.locations}
            </div>
          )}
        </fieldset>

        {editing && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 40, fontSize: 15, color: C.text, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              style={{ width: 18, height: 18 }}
            />
            Идэвхтэй
          </label>
        )}

        {needsPin && (
          <>
            {editing && (
              <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
                {addsBranch
                  ? "Салбар нэмэхдээ PIN-ээ дахин оруулна уу. Нэг салбарт PIN давхцаж болохгүй тул шалгах шаардлагатай."
                  : "Идэвхжүүлэхдээ PIN-ээ дахин оруулна уу. Хэн нэгэн энэ хооронд ижил PIN авсан байж болно."}
              </p>
            )}
            <PinFields pin={pin} again={again} setPin={setPin} setAgain={setAgain} errors={errors} />
          </>
        )}

        <ErrorText>{error}</ErrorText>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button kind="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button type="submit" disabled={busy}>
            Хадгалах
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function ResetPinDialog({ token, staff, onClose, onSaved }) {
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const problem = pinFormError(pin, again);
    if (problem) {
      setErrors(problem === "PIN-үүд таарахгүй байна" ? { again: problem } : { pin: problem });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      await resetStaffPin(staff.id, pin, token);
      await onSaved();
    } catch (e) {
      setErrors({ pin: e.message });
      setBusy(false);
    }
  };

  return (
    <Dialog title="PIN шинэчлэх" onClose={onClose} width={420}>
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        <div style={{ fontSize: 15, color: C.muted }}>{staff.name}</div>
        <PinFields pin={pin} again={again} setPin={setPin} setAgain={setAgain} errors={errors} label="Шинэ PIN" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button kind="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button type="submit" disabled={busy}>
            PIN шинэчлэх
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function DeactivateDialog({ token, staff, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateStaff(staff.id, { active: false }, token);
      await onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title="Ажилтныг идэвхгүй болгох уу?" onClose={onClose} width={420}>
      <p style={{ margin: "0 0 16px", fontSize: 15, color: C.text, lineHeight: 1.5 }}>
        {staff.name} цаашид кассанд нэвтэрч чадахгүй. Одоо нэвтэрсэн бол 12 цаг хүртэл ажиллаж магадгүй. Түүхэн борлуулалт хэвээр үлдэнэ.
      </p>
      <ErrorText>{error}</ErrorText>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
        <Button kind="secondary" onClick={onClose} data-autofocus>
          Болих
        </Button>
        <Button kind="danger" onClick={go} disabled={busy}>
          Идэвхгүй болгох
        </Button>
      </div>
    </Dialog>
  );
}

export default function StaffClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [staff, setStaff] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // null | { kind: "edit" | "new" | "pin" | "off", staff? }
  const [dialog, setDialog] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [people, locs] = await Promise.all([listStaff(token), listLocations(token)]);
      setStaff(people);
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

  const branchName = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);
  const saved = async () => {
    setDialog(null);
    await load();
  };

  const rows = staff.map((s) => ({
    key: s.id,
    name: (
      <span>
        <span style={{ fontWeight: 600, color: s.active ? C.text : C.faint }}>{s.name}</span>
        {s.phone && <span style={{ color: C.faint }}> {s.phone}</span>}
      </span>
    ),
    role: roleLabel(s.role),
    branches: <span style={{ lineHeight: 1.4 }}>{s.locations.map((id) => branchName.get(id) ?? `#${id}`).join(", ")}</span>,
    status: s.active ? <Pill tone="green">Идэвхтэй</Pill> : <Pill tone="gray">Идэвхгүй</Pill>,
    actions: (
      <span style={{ display: "inline-flex", gap: 8 }}>
        <Button kind="secondary" style={ROW_BUTTON} onClick={() => setDialog({ kind: "edit", staff: s })}>
          Засах
        </Button>
        {s.active && (
          <Button kind="secondary" style={ROW_BUTTON} onClick={() => setDialog({ kind: "pin", staff: s })}>
            PIN шинэчлэх
          </Button>
        )}
        {s.active && (
          <Button kind="danger" style={ROW_BUTTON} onClick={() => setDialog({ kind: "off", staff: s })}>
            Идэвхгүй болгох
          </Button>
        )}
      </span>
    ),
  }));

  return (
    <div className="wg-box">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <p style={{ margin: 0, color: C.muted, fontSize: 15, maxWidth: 560 }}>
          Кассанд PIN-ээр нэвтрэх хүмүүс. Нэг салбарт PIN давхцаж болохгүй.
        </p>
        <Button onClick={() => setDialog({ kind: "new" })} disabled={!token || locations.length === 0}>
          <i className="icon-plus" /> Ажилтан нэмэх
        </Button>
      </div>

      <ErrorText>{error}</ErrorText>

      <div style={{ marginTop: 18 }}>
        <Table
          cols={[
            { key: "name", label: "Нэр", width: 200 },
            { key: "role", label: "Дүр", width: 110 },
            { key: "branches", label: "Салбар", width: 200 },
            { key: "status", label: "Төлөв", width: 110 },
            { key: "actions", label: "", align: "right" },
          ]}
          rows={loading ? [] : rows}
          empty={loading || !token ? "Ачаалж байна…" : "Ажилтан бүртгэгдээгүй байна. «Ажилтан нэмэх» дарж эхний кассчингаа нэмнэ үү."}
        />
      </div>

      {(dialog?.kind === "new" || dialog?.kind === "edit") && (
        <StaffDialog token={token} locations={locations} staff={dialog.staff} onClose={() => setDialog(null)} onSaved={saved} />
      )}
      {dialog?.kind === "pin" && <ResetPinDialog token={token} staff={dialog.staff} onClose={() => setDialog(null)} onSaved={saved} />}
      {dialog?.kind === "off" && <DeactivateDialog token={token} staff={dialog.staff} onClose={() => setDialog(null)} onSaved={saved} />}
    </div>
  );
}
