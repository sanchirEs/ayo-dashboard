"use client";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import GetToken from "@/lib/GetTokenClient";
import {
  getTagGroup,
  getTagOptions,
  createTagOption,
  updateTagOption,
  deleteTagOption,
} from "@/lib/api/hierarchicalTags";

export default function TagGroupOptionsPage() {
  const params = useParams();
  const id = Number(params?.id);
  const token = GetToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tagGroup, setTagGroup] = useState(null);
  const [options, setOptions] = useState([]);
  const [filter, setFilter] = useState("");
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineForm, setInlineForm] = useState({ name: "", value: "" });
  const [newOptionForm, setNewOptionForm] = useState({ name: "", value: "" });

  async function load() {
    setLoading(true);
    setError("");
    const [group, opts] = await Promise.all([
      getTagGroup(id), 
      getTagOptions(id)
    ]);
    setTagGroup(group);
    setOptions(Array.isArray(opts) ? opts : []);
    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return options;
    return options.filter((o) => 
      o.name.toLowerCase().includes(f) || 
      o.value.toLowerCase().includes(f)
    );
  }, [options, filter]);

  async function addOption(e) {
    e.preventDefault();
    if (!token) return setError("Not authenticated");
    if (!newOptionForm.name.trim()) return setError("Name is required");
    
    setError("");
    setSuccess("");
    
    const ok = await createTagOption(
      id, 
      { 
        name: newOptionForm.name.trim(),
        value: newOptionForm.value.trim() || undefined
      }, 
      token
    );
    
    if (!ok) return setError("Failed to add option");
    
    setSuccess("Option added successfully");
    setNewOptionForm({ name: "", value: "" });
    await load();
  }

  function startInlineEdit(opt) {
    setInlineEditingId(opt.id);
    setInlineForm({ name: opt.name, value: opt.value });
    setError("");
    setSuccess("");
  }

  async function saveInline() {
    if (!token) return setError("Not authenticated");
    if (!inlineForm.name.trim()) return setError("Name is required");
    
    const ok = await updateTagOption(
      inlineEditingId, 
      { 
        name: inlineForm.name.trim(),
        value: inlineForm.value.trim() || undefined
      }, 
      token
    );
    
    if (!ok) return setError("Failed to update option");
    
    setSuccess("Option updated successfully");
    setInlineEditingId(null);
    setInlineForm({ name: "", value: "" });
    await load();
  }

  function cancelInline() {
    setInlineEditingId(null);
    setInlineForm({ name: "", value: "" });
    setError("");
  }

  async function onDeleteOption(optionId) {
    if (!token) return setError("Not authenticated");
    
    if (!confirm("Are you sure you want to delete this option? This will remove it from all products using it.")) {
      return;
    }
    
    const resp = await deleteTagOption(optionId, token);
    if (!resp.ok) return setError(resp.message || "Failed to delete option");
    
    setSuccess("Option deleted successfully");
    await load();
  }

  return (
    <Layout breadcrumbTitleParent="Hierarchical Tags" breadcrumbTitle="Manage Options">
      <div className="wg-box">
        {loading ? (
          <div className="body-text">Loading...</div>
        ) : !tagGroup ? (
          <div className="body-text">Tag group not found</div>
        ) : (
          <>
            <div className="flex items-center justify-between gap10 flex-wrap">
              <div>
                <div className="body-title-2">{tagGroup.name}</div>
                <div className="text-tiny">
                  {tagGroup.description || "No description"}
                </div>
                <div className="text-tiny">
                  {options.length} option{options.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex gap10">
                <Link className="tf-button style-3 w208" href="/hierarchical-tags">
                  <i className="icon-arrow-left" /> Back to Groups
                </Link>
                <Link className="tf-button style-1 w208" href={`/hierarchical-tags/${tagGroup.id}/edit`}>
                  <i className="icon-edit-3" /> Edit Group
                </Link>
              </div>
            </div>

            {/* Add New Option Form */}
            <div className="wg-box" style={{ marginTop: 16 }}>
              <form className="form-new-product form-style-1" onSubmit={addOption}>
                <div className="body-title mb-14">Add New Option</div>
                <div className="flex gap20">
                  <fieldset className="name" style={{ flex: 1 }}>
                    <div className="body-title">Option Name</div>
                    <input
                      className="flex-grow"
                      type="text"
                      placeholder="e.g., Уруулын будаг"
                      value={newOptionForm.name}
                      onChange={(e) => setNewOptionForm(s => ({ ...s, name: e.target.value }))}
                    />
                  </fieldset>
                  <fieldset className="name" style={{ flex: 1 }}>
                    <div className="body-title">Value (optional)</div>
                    <input
                      className="flex-grow"
                      type="text"
                      placeholder="e.g., lipstick (auto-generated if empty)"
                      value={newOptionForm.value}
                      onChange={(e) => setNewOptionForm(s => ({ ...s, value: e.target.value }))}
                    />
                  </fieldset>
                </div>
                <div className="bot">
                  <div />
                  <button className="tf-button w208" type="submit">Add Option</button>
                </div>
              </form>
            </div>

            {/* Messages */}
            {error && (
              <div className="alert alert-danger mb-4" style={{ 
                color: "red", 
                padding: 10, 
                border: "1px solid red", 
                borderRadius: 4,
                marginTop: 16 
              }}>
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success mb-4" style={{ 
                color: "green", 
                padding: 10, 
                border: "1px solid green", 
                borderRadius: 4,
                marginTop: 16 
              }}>
                {success}
              </div>
            )}

            {/* Options Table */}
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
                <li style={{ flex: 2 }}>
                  <div className="body-title">Option Name</div>
                </li>
                <li style={{ flex: 2 }}>
                  <div className="body-title">Value</div>
                </li>
                <li style={{ flex: 1 }}>
                  <div className="body-title">Products</div>
                </li>
                <li style={{ flex: 1 }}>
                  <div className="body-title">Actions</div>
                </li>
              </ul>
              <ul className="flex flex-column">
                {filtered.length ? (
                  filtered.map((option) => (
                    <li key={option.id} className="attribute-item flex items-center justify-between gap20">
                      <div className="name" style={{ flex: 2 }}>
                        {inlineEditingId === option.id ? (
                          <input
                            type="text"
                            value={inlineForm.name}
                            onChange={(e) => setInlineForm(s => ({ ...s, name: e.target.value }))}
                            className="flex-grow"
                            placeholder="Option name"
                          />
                        ) : (
                          <div className="body-title-2">{option.name}</div>
                        )}
                      </div>
                      <div className="name" style={{ flex: 2 }}>
                        {inlineEditingId === option.id ? (
                          <input
                            type="text"
                            value={inlineForm.value}
                            onChange={(e) => setInlineForm(s => ({ ...s, value: e.target.value }))}
                            className="flex-grow"
                            placeholder="Option value"
                          />
                        ) : (
                          <div className="body-text">{option.value}</div>
                        )}
                      </div>
                      <div className="body-text" style={{ flex: 1 }}>
                        {option._count?.productTags || 0}
                      </div>
                      <div className="list-icon-function" style={{ flex: 1 }}>
                        {inlineEditingId === option.id ? (
                          <>
                            <div className="item edit" onClick={saveInline} title="Save">
                              <i className="icon-check" />
                            </div>
                            <div className="item edit" onClick={cancelInline} title="Cancel">
                              <i className="icon-x" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="item edit" onClick={() => startInlineEdit(option)} title="Edit">
                              <i className="icon-edit-3" />
                            </div>
                            <div className="item trash" onClick={() => onDeleteOption(option.id)} title="Delete">
                              <i className="icon-trash-2" />
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="attribute-item flex items-center justify-between gap20">
                    <div className="body-text">
                      {filter ? "No options match your search" : "No options yet"}
                    </div>
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
