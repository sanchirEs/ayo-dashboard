"use client";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { useEffect, useState } from "react";
import GetToken from "@/lib/GetTokenClient";
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "@/lib/api/attributes";

export default function AttributesPage() {
  const token = GetToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "select",
    description: "",
  });



  async function load() {
    setLoading(true);
    setError("");
    const data = await getAttributes();
    console.log("Attributes data:", data); // Temporary debug log
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) {
      setError("Not authenticated");
      return;
    }
    if (!form.name) {
      setError("Name is required");
      return;
    }
    if (
      !form.type ||
      !["select", "text"].includes(String(form.type).toLowerCase())
    ) {
      setError("Type must be select or text");
      return;
    }
    setError("");
    if (editing) {
      const ok = await updateAttribute(
        editing.id,
        { name: form.name, type: form.type },
        token
      );
      if (!ok) setError("Failed to update attribute");
    } else {
      const created = await createAttribute(
        { name: form.name, type: form.type },
        token
      );
      if (!created) setError("Failed to create attribute");
    }
    setForm({ name: "", type: "select", description: "" });
    setEditing(null);
    await load();
  }

  async function onDelete(id) {
    if (!token) {
      setError("Not authenticated");
      return;
    }
    const resp = await deleteAttribute(id, token);
    if (!resp.ok) setError(resp.message || "Failed to delete attribute");
    await load();
  }

  function startEdit(a) {
    setEditing(a);
    setForm({
      name: a.name,
      type: String(a.type || "select").toLowerCase(),
      description: "",
    });
  }



  return (
    <>
      <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Атрибут">
        <div className="wg-box">
          <div className="wg-box" style={{ marginTop: 16 }}>
            <form className="form-new-product form-style-1" onSubmit={onSubmit}>
              <fieldset className="name">
                <div className="body-title">Name</div>
                <input
                  className="flex-grow"
                  type="text"
                  placeholder="e.g., Color, Size, Storage"
                  name="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                />
              </fieldset>
              <fieldset className="name">
                <div className="body-title">Type</div>
                <select
                  className="flex-grow"
                  value={form.type}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, type: e.target.value }))
                  }
                >
                  <option value="select">select</option>
                  <option value="text">text</option>
                </select>
              </fieldset>
              <div className="bot">
                <div />
                <button className="tf-button w208" type="submit">
                  {editing ? "Update Attribute" : "Create Attribute"}
                </button>
              </div>
            </form>
            {error && (
              <div
                className="alert alert-danger mb-4"
                style={{
                  color: "red",
                  padding: 10,
                  border: "1px solid red",
                  borderRadius: 4,
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div
            className="wg-table table-all-attribute"
            style={{ marginTop: 16 }}
          >
            <ul className="table-title flex gap20 mb-14">
              <li className="flex-1">
                <div className="body-title">Attribute Name</div>
              </li>
              <li className="flex-1">
                <div className="body-title">Options</div>
              </li>
              <li className="w-20">
                <div className="body-title">Action</div>
              </li>
            </ul>
            <ul className="flex flex-column">
              {loading ? (
                <li className="attribute-item flex items-center justify-between gap20">
                  <div className="body-text">Loading...</div>
                </li>
              ) : items.length ? (
                items.map((a) => (
                  <li
                    key={a.id}
                    className="attribute-item flex items-center justify-between gap20"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-center gap20 flex-1">
                      <Link
                        href={`/attributes/${a.id}/options`}
                        className="flex items-center gap20 flex-1"
                        style={{ textDecoration: "none", color: "inherit" }}
                        onClick={(e) => {
                          // Prevent navigation if clicking on action buttons
                          if (e.target.closest('.list-icon-function')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="name">
                          <div className="body-title-2">{a.name}</div>
                        </div>
                      </Link>
                    </div>
                    <div className="flex-1">
                      <div className="body-text" style={{ 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap",
                        maxWidth: "100%"
                      }}>{(a.options || []).map(option => option.value || option.label || option.title || option.name || JSON.stringify(option)).join(", ")}
                      </div>
                    </div>
                    <div className="w-20">
                      <div className="list-icon-function">
                        <Link
                          href={`/attributes/${a.id}/edit`}
                          className="item edit"
                          title="Edit"
                        >
                          <i className="icon-edit-3" />
                        </Link>
                        <div
                          className="item trash"
                          onClick={() => onDelete(a.id)}
                          title="Delete"
                        >
                          <i className="icon-trash-2" />
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="attribute-item flex items-center justify-between gap20">
                  <div className="body-text">No attributes</div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Layout>
    </>
  );
}
