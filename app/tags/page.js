"use client";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GetToken from "@/lib/GetTokenClient";
import {
  getTagPresets,
  createTagPreset,
  updateTagPreset,
  deleteTagPreset,
} from "@/lib/api/tags";

export default function TagsPage() {
  const token = GetToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [presets, setPresets] = useState([]);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "" });

  // Common preset types (stored as English keys; shown as Mongolian labels)
  const TYPE_OPTIONS = [
    { key: "Color", label: "Өнгө" },
    { key: "Size", label: "Хэмжээ" },
    { key: "Material", label: "Материал" },
    { key: "Season", label: "Улирал" },
    { key: "Style", label: "Загвар" },
  ];
  const [selectedTypeKey, setSelectedTypeKey] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const data = await getTagPresets();
    setPresets(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return presets;
    return presets.filter((p) => p.name.toLowerCase().includes(f) || p.type.toLowerCase().includes(f));
  }, [presets, filter]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) {
      setError("Not authenticated");
      return;
    }
    if (!form.name) {
      setError("Нэр заавал хэрэгтэй");
      return;
    }
    if (!selectedTypeKey && !form.type) {
      setError("Төрөл сонгоно уу эсвэл оруулна уу");
      return;
    }
    if (selectedTypeKey && selectedTypeKey !== "CUSTOM") {
      // bind stored type to selected key
      form.type = selectedTypeKey;
    }
    if (!form.type) {
      setError("Төрөл хоосон байна");
      return;
    }
    setError("");
    if (editing) {
      const ok = await updateTagPreset(editing.id, form, token);
      if (!ok) setError("Failed to update preset");
    } else {
      const ok = await createTagPreset(form, token);
      if (!ok) setError("Failed to create preset");
    }
    setForm({ name: "", type: "" });
    setSelectedTypeKey("");
    setEditing(null);
    await load();
  }

  async function onDelete(id) {
    if (!token) {
      setError("Not authenticated");
      return;
    }
    const ok = await deleteTagPreset(id, token);
    if (!ok) setError("Failed to delete preset");
    await load();
  }

  function startEdit(preset) {
    setEditing(preset);
    setForm({ name: preset.name, type: preset.type });
    const match = TYPE_OPTIONS.find((t) => t.key.toLowerCase() === String(preset.type || "").toLowerCase());
    setSelectedTypeKey(match ? match.key : "CUSTOM");
  }

  function typeLabel(value) {
    const found = TYPE_OPTIONS.find((t) => t.key.toLowerCase() === String(value || "").toLowerCase());
    return found ? found.label : value;
  }

  return (
    <>
      <Layout breadcrumbTitleParent="Tags" breadcrumbTitle="Tag Presets">
        <div className="wg-box">
          <div className="flex items-center justify-between gap10 flex-wrap">
            <div className="wg-filter flex-grow">
              <form className="form-search" onSubmit={(e) => e.preventDefault()}>
                <fieldset className="name">
                  <input
                    type="text"
                    placeholder="Search tag presets..."
                    name="name"
                    tabIndex={2}
                    aria-required="true"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </fieldset>
                <div className="button-submit">
                  <button type="button" onClick={() => setFilter("")}> 
                    <i className="icon-x" />
                  </button>
                </div>
              </form>
            </div>
            <Link className="tf-button style-1 w208" href="/add-tags">
              <i className="icon-plus" />
              Add product tags
            </Link>
          </div>

          <div className="wg-box" style={{ marginTop: 16 }}>
            <form className="form-new-product form-style-1" onSubmit={onSubmit}>
              <fieldset className="name">
                <div className="body-title">Preset name</div>
                <input
                  className="flex-grow"
                  type="text"
                  placeholder="e.g., Red, Large, Cotton"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                />
              </fieldset>
              <fieldset className="name">
                <div className="body-title">Төрөл</div>
                <select
                  className="flex-grow"
                  value={selectedTypeKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedTypeKey(v);
                    if (v !== "CUSTOM") {
                      setForm((s) => ({ ...s, type: v }));
                    } else {
                      setForm((s) => ({ ...s, type: "" }));
                    }
                  }}
                >
                  <option value="">Төрөл сонгох</option>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="CUSTOM">Бусад (гараар оруулах)</option>
                </select>
              </fieldset>
              {selectedTypeKey === "CUSTOM" && (
                <fieldset className="name">
                  <div className="body-title">Төрөл (гараар)</div>
                  <input
                    className="flex-grow"
                    type="text"
                    placeholder="Жишээ: Брэнд"
                    name="type"
                    value={form.type}
                    onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
                  />
                </fieldset>
              )}
              <div className="bot">
                <div />
                <button className="tf-button w208" type="submit">
                  {editing ? "Update Preset" : "Create Preset"}
                </button>
              </div>
            </form>
            {error && (
              <div className="alert alert-danger mb-4" style={{ color: "red", padding: 10, border: "1px solid red", borderRadius: 4 }}>
                {error}
              </div>
            )}
          </div>

          <div className="wg-table table-all-attribute" style={{ marginTop: 16 }}>
            <ul className="table-title flex gap20 mb-14">
              <li>
                <div className="body-title">Name</div>
              </li>
              <li>
                <div className="body-title">Төрөл</div>
              </li>
              <li>
                <div className="body-title">Action</div>
              </li>
            </ul>
            <ul className="flex flex-column">
              {loading ? (
                <li className="attribute-item flex items-center justify-between gap20">
                  <div className="body-text">Loading...</div>
                </li>
              ) : filtered.length ? (
                filtered.map((p) => (
                  <li key={p.id} className="attribute-item flex items-center justify-between gap20">
                    <div className="name">
                      <div className="body-title-2">{p.name}</div>
                    </div>
                    <div className="body-text">{typeLabel(p.type)}</div>
                    <div className="list-icon-function">
                      <div className="item edit" onClick={() => startEdit(p)} title="Edit">
                        <i className="icon-edit-3" />
                      </div>
                      <div className="item trash" onClick={() => onDelete(p.id)} title="Delete">
                        <i className="icon-trash-2" />
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="attribute-item flex items-center justify-between gap20">
                  <div className="body-text">No tag presets</div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Layout>
    </>
  );
}


