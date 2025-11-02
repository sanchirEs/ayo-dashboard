"use client";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { useEffect, useState } from "react";
import GetToken from "@/lib/GetTokenClient";
import {
  getTagGroups,
  createTagGroup,
  updateTagGroup,
  deleteTagGroup,
} from "@/lib/api/hierarchicalTags";

export default function HierarchicalTagsPage() {
  const token = GetToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tagGroups, setTagGroups] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    const data = await getTagGroups();
    console.log("Tag groups data:", data);
    setTagGroups(Array.isArray(data) ? data : []);
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
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    
    setError("");
    setSuccess("");
    
    if (editing) {
      const ok = await updateTagGroup(
        editing.id,
        { 
          name: form.name.trim(), 
          description: form.description.trim() || undefined 
        },
        token
      );
      if (!ok) {
        setError("Failed to update tag group");
        return;
      }
      setSuccess("Tag group updated successfully");
    } else {
      const created = await createTagGroup(
        { 
          name: form.name.trim(), 
          description: form.description.trim() || undefined 
        },
        token
      );
      if (!created) {
        setError("Failed to create tag group");
        return;
      }
      setSuccess("Tag group created successfully");
    }
    
    setForm({ name: "", description: "" });
    setEditing(null);
    await load();
  }

  async function onDelete(id) {
    if (!token) {
      setError("Not authenticated");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this tag group? This will also delete all its options.")) {
      return;
    }
    
    const resp = await deleteTagGroup(id, token);
    if (!resp.ok) {
      setError(resp.message || "Failed to delete tag group");
      return;
    }
    
    setSuccess("Tag group deleted successfully");
    await load();
  }

  function startEdit(tagGroup) {
    setEditing(tagGroup);
    setForm({
      name: tagGroup.name,
      description: tagGroup.description || "",
    });
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ name: "", description: "" });
    setError("");
    setSuccess("");
  }

  return (
    <>
      <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Hierarchical Tags">
        <div className="wg-box">
          <div className="flex items-center justify-between gap10 flex-wrap">
            <div className="wg-filter">
              <div className="body-title">Hierarchical Tag Groups</div>
              <div className="text-tiny">Manage tag groups like 'Уруул', 'Нүд', etc.</div>
            </div>
            <Link className="tf-button style-1 w208" href="/hierarchical-tags/new">
              <i className="icon-plus" /> Add New Group
            </Link>
          </div>

          {/* Create/Edit Form */}
          <div className="wg-box" style={{ marginTop: 16 }}>
            <form className="form-new-product form-style-1" onSubmit={onSubmit}>
              <fieldset className="name">
                <div className="body-title">Group Name</div>
                <input
                  className="flex-grow"
                  type="text"
                  placeholder="e.g., Уруул, Нүд, Арьс"
                  name="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                />
              </fieldset>
              <fieldset className="name">
                <div className="body-title">Description (optional)</div>
                <textarea
                  className="flex-grow"
                  placeholder="e.g., Уруулын бүтээгдэхүүн"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value }))
                  }
                />
              </fieldset>
              <div className="bot">
                <div>
                  {editing && (
                    <button 
                      type="button" 
                      className="tf-button style-3 w208" 
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <button className="tf-button w208" type="submit">
                  {editing ? "Update Group" : "Create Group"}
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
                  marginTop: 16
                }}
              >
                {error}
              </div>
            )}
            
            {success && (
              <div
                className="alert alert-success mb-4"
                style={{
                  color: "green",
                  padding: 10,
                  border: "1px solid green",
                  borderRadius: 4,
                  marginTop: 16
                }}
              >
                {success}
              </div>
            )}
          </div>

          {/* Tag Groups List */}
          <div className="wg-table table-all-attribute" style={{ marginTop: 16 }}>
            <ul className="table-title flex gap20 mb-14">
              <li>
                <div className="body-title">Group Name</div>
              </li>
              <li>
                <div className="body-title">Description</div>
              </li>
              <li>
                <div className="body-title">Options Count</div>
              </li>
              <li>
                <div className="body-title">Actions</div>
              </li>
            </ul>
            <ul className="flex flex-column">
              {loading ? (
                <li className="attribute-item flex items-center justify-between gap20">
                  <div className="body-text">Loading...</div>
                </li>
              ) : tagGroups.length ? (
                tagGroups.map((group) => (
                  <li key={group.id} className="attribute-item flex items-center justify-between gap20">
                    <div className="name">
                      <div className="body-title-2">{group.name}</div>
                    </div>
                    <div className="body-text">
                      {group.description || "-"}
                    </div>
                    <div className="body-text">
                      {group._count?.options || 0} options
                    </div>
                    <div className="list-icon-function">
                      <Link
                        className="item edit"
                        href={`/hierarchical-tags/${group.id}/options`}
                        title="Manage Options"
                      >
                        <i className="icon-settings" />
                      </Link>
                      <div 
                        className="item edit" 
                        onClick={() => startEdit(group)} 
                        title="Edit Group"
                      >
                        <i className="icon-edit-3" />
                      </div>
                      <div 
                        className="item trash" 
                        onClick={() => onDelete(group.id)} 
                        title="Delete Group"
                      >
                        <i className="icon-trash-2" />
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="attribute-item flex items-center justify-between gap20">
                  <div className="body-text">No tag groups yet</div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Layout>
    </>
  );
}
