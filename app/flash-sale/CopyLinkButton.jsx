"use client";
import { useState } from "react";

export default function CopyLinkButton({ shareLink }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid #e2e8f0',
        background: 'white',
        cursor: 'pointer',
        fontSize: 13,
        color: copied ? '#10b981' : '#374151',
        transition: 'color 0.2s'
      }}
    >
      {copied ? '✓ Хуулагдлаа!' : '📋 Линк хуулах'}
    </button>
  );
}
