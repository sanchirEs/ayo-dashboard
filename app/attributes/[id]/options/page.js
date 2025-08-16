"use client";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import GetToken from "@/lib/GetTokenClient";
import {
  getAttribute,
  getAttributeOptions,
  createAttributeOption,
  updateAttributeOption,
  deleteAttributeOption,
} from "@/lib/api/attributes";

export default function AttributeOptionsPage() {
  const params = useParams();
  const id = Number(params?.id);
  const token = GetToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attribute, setAttribute] = useState(null);
  const [options, setOptions] = useState([]);
  const [filter, setFilter] = useState("");
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineValue, setInlineValue] = useState("");
  const [newValue, setNewValue] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const [a, opts] = await Promise.all([getAttribute(id), getAttributeOptions(id)]);
    setAttribute(a);
    setOptions(Array.isArray(opts) ? opts : []);
    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return options;
    return options.filter((o) => o.value.toLowerCase().includes(f));
  }, [options, filter]);

  async function addOption(e) {
    e.preventDefault();
    if (!token) return setError("Not authenticated");
    if (!newValue.trim()) return setError("Value required");
    setError("");
    const ok = await createAttributeOption(id, { value: newValue.trim() }, token);
    if (!ok) return setError("Failed to add option");
    setNewValue("");
    await load();
  }

  function startInlineEdit(opt) {
    setInlineEditingId(opt.id);
    setInlineValue(opt.value);
  }

  async function saveInline() {
    if (!token) return setError("Not authenticated");
    if (!inlineValue.trim()) return setError("Value required");
    const ok = await updateAttributeOption(inlineEditingId, { value: inlineValue.trim() }, token);
    if (!ok) return setError("Failed to update option");
    setInlineEditingId(null);
    setInlineValue("");
    await load();
  }

  async function onDeleteOption(optionId) {
    if (!token) return setError("Not authenticated");
    const ok = await deleteAttributeOption(optionId, token);
    if (!ok) return setError("Failed to delete option");
    await load();
  }

  return (
    <Layout breadcrumbTitleParent="Attributes" breadcrumbTitle="Manage Options">
      <div className="wg-box">
        {loading ? (
          <div className="body-text">Loading...</div>
        ) : !attribute ? (
          <div className="body-text">Attribute not found</div>
        ) : (
          <>
            <div className="flex items-center justify-between gap10 flex-wrap">
              <div>
                <div className="body-title-2">{attribute.name}</div>
                <div className="text-tiny">Type: {String(attribute.type).toLowerCase()}</div>
              </div>
              <Link className="tf-button style-1 w208" href={`/attributes/${attribute.id}/edit`}>
                <i className="icon-edit-3" /> Edit Attribute
              </Link>
            </div>

            <div className="wg-box" style={{ marginTop: 16 }}>
              <form className="form-new-product form-style-1" onSubmit={addOption}>
                <fieldset className="name">
                  <div className="body-title">Add new option</div>
                  <input
                    className="flex-grow"
                    type="text"
                    placeholder="e.g., Red, Large, 128GB"
                    name="value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                </fieldset>
                <div className="bot">
                  <div />
                  <button className="tf-button w208" type="submit">Add Option</button>
                </div>
              </form>
              {error && (
                <div className="alert alert-danger mb-4" style={{ color: "red", padding: 10, border: "1px solid red", borderRadius: 4 }}>
                  {error}
                </div>
              )}
            </div>

            <div className="wg-table table-all-attribute" style={{ marginTop: 16 }}>
              <div className="wg-filter flex-grow" style={{ marginBottom: 16 }}>
                <form className="form-search" onSubmit={(e) => e.preventDefault()}>
                  <fieldset className="name">
                    <input
                      type="text"
                      placeholder="Search options..."
                      name="filter"
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

              <ul className="table-title flex gap20 mb-14">
                <li>
                  <div className="body-title">Option Value</div>
                </li>
                <li>
                  <div className="body-title">Action</div>
                </li>
              </ul>
              <ul className="flex flex-column">
                {filtered.length ? (
                  filtered.map((o) => (
                    <li key={o.id} className="attribute-item flex items-center justify-between gap20">
                      <div className="name">
                        {inlineEditingId === o.id ? (
                          <input
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            className="flex-grow"
                          />
                        ) : (
                          <div className="body-title-2">{o.value}</div>
                        )}
                      </div>
                      <div className="list-icon-function">
                        {inlineEditingId === o.id ? (
                          <div className="item edit" onClick={saveInline} title="Save">
                            <i className="icon-check" />
                          </div>
                        ) : (
                          <div className="item edit" onClick={() => startInlineEdit(o)} title="Edit">
                            <i className="icon-edit-3" />
                          </div>
                        )}
                        <div className="item trash" onClick={() => onDeleteOption(o.id)} title="Delete">
                          <i className="icon-trash-2" />
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="attribute-item flex items-center justify-between gap20">
                    <div className="body-text">No options</div>
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}



