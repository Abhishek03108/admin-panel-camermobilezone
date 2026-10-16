import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw, Trash2, Eye, Mail, Phone } from "lucide-react";
import { developerMessagesApi } from "../../api/developerMessages.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { Select } from "../../components/common/FormField.jsx";

export default function DeveloperMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [resolved, setResolved] = useState("false");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const load = async (p = page) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (resolved) params.isResolved = resolved;
      const res = await developerMessagesApi.list(params);
      setMessages(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  const toggleResolved = async (message) => {
    setProcessingId(message.id);
    try {
      await developerMessagesApi.resolve(message.id, !message.isResolved);
      toast.success(message.isResolved ? "Marked as open." : "Marked as done.");
      setSelected(null);
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await developerMessagesApi.remove(deleteTarget.id);
      toast.success("Message deleted.");
      setDeleteTarget(null);
      setSelected(null);
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { key: "createdAt", header: "Received", render: (m) => <span className="whitespace-nowrap">{formatDateTime(m.createdAt)}</span> },
    {
      key: "from",
      header: "From",
      render: (m) => (
        <div>
          <p className="font-medium text-ink">{m.fullName}</p>
          <p className="text-xs text-muted">{m.email}</p>
        </div>
      ),
    },
    { key: "mobile", header: "Phone", render: (m) => <span className="whitespace-nowrap">{m.mobile}</span> },
    { key: "message", header: "Message", render: (m) => <p className="text-muted line-clamp-2 max-w-md">{m.message}</p> },
    { key: "status", header: "Status", render: (m) => <Badge tone={m.isResolved ? "verify" : "accent"}>{m.isResolved ? "Done" : "Open"}</Badge> },
    {
      key: "actions",
      header: "",
      render: (m) => (
        <div className="flex gap-1 justify-end">
          <button className="btn-ghost !px-2 !py-1.5" title="View" onClick={() => setSelected(m)}>
            <Eye size={15} />
          </button>
          <button
            className="btn-ghost !px-2 !py-1.5"
            title={m.isResolved ? "Mark as open" : "Mark as done"}
            disabled={processingId === m.id}
            onClick={() => toggleResolved(m)}
          >
            {m.isResolved ? <RotateCcw size={15} /> : <CheckCircle2 size={15} />}
          </button>
          <button className="btn-ghost !px-2 !py-1.5 hover:!text-danger" title="Delete" onClick={() => setDeleteTarget(m)}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-6xl mx-auto space-y-5"
    >
      <Seo title="Developer Messages" description="Messages sent to the developer from the website footer." />
      <PageHeader
        title="Developer Messages"
        description="Sent from “Reach out to the developer” in the website footer. Each one is also emailed to the developer."
        actions={
          <div className="w-40">
            <Select value={resolved} onChange={(e) => setResolved(e.target.value)}>
              <option value="false">Open</option>
              <option value="true">Done</option>
              <option value="">All</option>
            </Select>
          </div>
        }
      />

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          rows={messages}
          isLoading={isLoading}
          emptyTitle={resolved === "false" ? "No open messages" : "No messages"}
          emptyDescription="Messages sent from the website footer will show up here."
        />
        <Pagination
          meta={meta}
          onPageChange={(p) => {
            setPage(p);
            load(p);
          }}
        />
      </div>

      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Message from ${selected.fullName}`}
          size="lg"
          footer={
            <>
              <button className="btn-secondary" onClick={() => setDeleteTarget(selected)}>
                <Trash2 size={15} /> Delete
              </button>
              <button className="btn-primary" disabled={processingId === selected.id} onClick={() => toggleResolved(selected)}>
                {selected.isResolved ? "Mark as open" : "Mark as done"}
              </button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <Mail size={15} /> {selected.email}
              </a>
              <a href={`tel:${selected.mobile}`} className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <Phone size={15} /> {selected.mobile}
              </a>
            </div>
            <div className="text-xs text-muted space-y-0.5">
              <p>Received {formatDateTime(selected.createdAt)}</p>
              {selected.pageUrl && <p className="break-all">Sent from {selected.pageUrl}</p>}
            </div>
            <div className="rounded-lg border border-line bg-panel/50 p-3 whitespace-pre-wrap text-ink">{selected.message}</div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete this message?"
        description="It will be removed from the admin panel. The copy in the developer's inbox stays."
        confirmLabel="Delete"
      />
    </motion.div>
  );
}
