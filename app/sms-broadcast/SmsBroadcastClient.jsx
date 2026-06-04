"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import FilterPanel from "./FilterPanel";
import ComposePanel from "./ComposePanel";
import BroadcastHistory from "./BroadcastHistory";
import {
  previewBroadcastUsers,
  sendBroadcast,
  getBroadcasts,
  getBroadcastTemplates,
  saveBroadcastTemplate,
} from "@/lib/api/smsBroadcast";

const DEFAULT_FILTERS = {
  role: 'CUSTOMER',
  hasOrdered: false,
  lastOrderedDays: '',
  neverOrdered: false,
  registeredAfter: '',
};

export default function SmsBroadcastClient({ initialBroadcasts }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [users, setUsers] = useState([]);
  const [excludedNoPhone, setExcludedNoPhone] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState([]);
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts || []);
  const [sendState, setSendState] = useState('idle');
  const [sendResult, setSendResult] = useState(null);
  const [sendError, setSendError] = useState(null);

  const debounceRef = useRef(null);

  const fetchPreview = useCallback(async (f, t) => {
    setPreviewLoading(true);
    const res = await previewBroadcastUsers(f, t);
    setPreviewLoading(false);
    if (res.success) {
      setUsers(res.data.users);
      setExcludedNoPhone(res.data.excludedNoPhone);
      setSelectedIds(new Set(res.data.users.map((u) => u.id)));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPreview(filters, token);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [filters, token, fetchPreview]);

  useEffect(() => {
    if (!token) return;
    getBroadcastTemplates(token).then((res) => {
      if (res.success) setTemplates(res.data);
    });
  }, [token]);

  async function handleSend(action) {
    if (action === 'reset') {
      setSendState('idle');
      setSendResult(null);
      setSendError(null);
      setTitle('');
      setMessage('');
      return;
    }
    setSendState('sending');
    setSendError(null);
    const res = await sendBroadcast(
      { title, message, userIds: Array.from(selectedIds), filters },
      token
    );
    if (res.success && res.data) {
      setSendResult(res.data);
      setSendState('done');
      getBroadcasts(token).then((r) => { if (r.success) setBroadcasts(r.data); });
    } else {
      setSendState('idle');
      setSendError(res.error || 'Алдаа гарлаа');
    }
  }

  async function handleSaveTemplate(name) {
    await saveBroadcastTemplate({ name, message }, token);
    const res = await getBroadcastTemplates(token);
    if (res.success) setTemplates(res.data);
  }

  async function refreshBroadcasts() {
    const res = await getBroadcasts(token);
    if (res.success) setBroadcasts(res.data);
  }

  return (
    <div>
      {sendError && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#991b1b' }}>
          ❌ {sendError}
        </div>
      )}
      <div className="flex gap-16 mb-16" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          users={users}
          excludedNoPhone={excludedNoPhone}
          loading={previewLoading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
        <ComposePanel
          title={title}
          onTitleChange={setTitle}
          message={message}
          onMessageChange={setMessage}
          templates={templates}
          selectedCount={selectedIds.size}
          onSend={handleSend}
          sendState={sendState}
          sendResult={sendResult}
          onSaveTemplate={handleSaveTemplate}
        />
      </div>
      <BroadcastHistory broadcasts={broadcasts} onRefresh={refreshBroadcasts} token={token} />
    </div>
  );
}
