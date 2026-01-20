"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import Layout from "@/components/layout/Layout";
import GetToken from "@/lib/GetTokenClient";
import { fetchWithAuthHandling } from "@/lib/api/fetch-with-auth";

export default function AddTags() {
  const token = GetToken();
  const [isPending, startTransition] = useTransition();
  const [productIdInput, setProductIdInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tags, setTags] = useState([]);

  const productId = useMemo(() => {
    const id = parseInt(productIdInput, 10);
    return Number.isFinite(id) ? id : null;
  }, [productIdInput]);

  async function fetchTags() {
    setError("");
    setSuccess("");
    if (!productId) {
      setError("Enter a valid product ID");
      return;
    }
    try {
      const res = await fetch(
        `${require("@/lib/api/env").getBackendUrl()}/api/v1/tags/${productId}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || `Failed to load tags (${res.status})`);
        setTags([]);
        return;
      }
      setTags(json.data?.tags || []);
    } catch (e) {
      setError("Unexpected error fetching tags");
      setTags([]);
    }
  }

  function parseTags(input) {
    return Array.from(
      new Set(
        (input || "")
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      )
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("Not authenticated");
      return;
    }
    if (!productId) {
      setError("Enter a valid product ID");
      return;
    }
    const tagsArray = parseTags(tagsInput);
    if (tagsArray.length === 0) {
      setError("Enter at least one tag");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetchWithAuthHandling(
          `${require("@/lib/api/env").getBackendUrl()}/api/v1/tags/${productId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ tags: tagsArray }),
          }
        , "AddTags.createTags");
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || `Failed to save tags (${res.status})`);
          return;
        }
        setSuccess(json.message || "Tags saved");
        setTagsInput("");
        await fetchTags();
      } catch (err) {
        setError("Unexpected error creating tags");
      }
    });
  }

  useEffect(() => {
    // Auto-load when a valid product id is entered
    if (productId) {
      fetchTags();
    } else {
      setTags([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return (
    <>
      <Layout breadcrumbTitleParent="Tags" breadcrumbTitle="Add Tags">
        <div className="wg-box">
          <form className="form-new-product form-style-1" onSubmit={onSubmit}>
            <fieldset className="name">
              <div className="body-title">Product ID</div>
              <input
                className="flex-grow"
                type="number"
                placeholder="Enter product ID"
                name="productId"
                tabIndex={0}
                value={productIdInput}
                onChange={(e) => setProductIdInput(e.target.value)}
              />
            </fieldset>

            <fieldset className="name">
              <div className="body-title">Tags (comma-separated)</div>
              <input
                className="flex-grow"
                type="text"
                placeholder="e.g., summer, limited, new"
                name="tags"
                tabIndex={0}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </fieldset>

            <div className="bot">
              <div />
              <button className="tf-button w208" type="submit" disabled={isPending || !productId}>
                {isPending ? "Saving..." : "Save Tags"}
              </button>
            </div>
          </form>

          {error && (
            <div className="alert alert-danger mb-4" style={{ color: "red", padding: 10, border: "1px solid red", borderRadius: 4 }}>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success mb-4" style={{ color: "green", padding: 10, border: "1px solid green", borderRadius: 4 }}>
              {success}
            </div>
          )}

          <div className="wg-table table-all-attribute" style={{ marginTop: 16 }}>
            <ul className="table-title flex gap20 mb-14">
              <li>
                <div className="body-title">Tag</div>
              </li>
              <li>
                <div className="body-title">Created Date</div>
              </li>
              <li>
                <div className="body-title">Action</div>
              </li>
            </ul>
            <ul className="flex flex-column">
              {(tags || []).map((t) => (
                <li key={t.id} className="attribute-item flex items-center justify-between gap20">
                  <div className="name">
                    <div className="body-title-2">{t.tag}</div>
                  </div>
                  <div className="body-text">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"}</div>
                  <div className="list-icon-function">
                    <div className="item trash" title="Delete not implemented">
                      <i className="icon-trash-2" />
                    </div>
                  </div>
                </li>
              ))}
              {!tags?.length && (
                <li className="attribute-item flex items-center justify-between gap20">
                  <div className="body-text">{productId ? "No tags yet" : "Enter a product ID to load tags"}</div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Layout>
    </>
  );
}


