import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Images,
  Trash2,
  RotateCcw,
  Upload,
  Check,
  Eye,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
} from "lucide-react";
import { mediaApi } from "../../api/media.api.js";
import { uploadsApi } from "../../api/uploads.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDate, formatDateTime } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";

const PAGE_SIZE = 48;

const FOLDER_LABELS = {
  products: "Products",
  "hero-banners": "Hero banners",
  "payment-screenshots": "Payment screenshots",
  avatars: "User avatars",
  brands: "Brands",
  categories: "Categories",
  "sub-categories": "Sub-categories",
  testimonials: "Testimonials",
  library: "Library uploads",
  misc: "Other",
};

const folderLabel = (folder) => FOLDER_LABELS[folder] || folder;

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function daysUntil(date) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
}

export default function MediaLibraryPage() {
  const [view, setView] = useState("active"); // "active" | "trash"
  const [folder, setFolder] = useState("");
  const [usage, setUsage] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [confirmAction, setConfirmAction] = useState(null); // "trash" | "delete"
  const [isWorking, setIsWorking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const isTrash = view === "trash";

  const loadSummary = async () => {
    try {
      const res = await mediaApi.summary();
      setSummary(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const load = async (p = page) => {
    setIsLoading(true);
    try {
      const params = { status: view, page: p, limit: PAGE_SIZE };
      if (folder) params.folder = folder;
      if (usage && !isTrash) params.usage = usage;
      const res = await mediaApi.list(params);
      setItems(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    setSelected(new Set());
    load(page);
    loadSummary();
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelected(new Set());
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, folder, usage]);

  const changePage = (p) => {
    setSelected(new Set());
    setPage(p);
    load(p);
  };

  // In-use images can't be binned, so they can't be selected in the library.
  const isSelectable = (item) => isTrash || item.usedIn.length === 0;
  const selectableItems = items.filter(isSelectable);
  const allSelected = selectableItems.length > 0 && selectableItems.every((i) => selected.has(i.id));

  const toggle = (item) => {
    if (!isSelectable(item)) {
      toast.info(`This image is in use (${item.usedIn[0]}). Remove it there first.`);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableItems.map((i) => i.id)));
  };

  const runBulk = async (action) => {
    const ids = [...selected];
    setIsWorking(true);
    try {
      const res = await (action === "trash"
        ? mediaApi.trash(ids)
        : action === "restore"
        ? mediaApi.restore(ids)
        : mediaApi.deletePermanently(ids));
      toast.success(res.data.message);
      const skipped = res.data.data?.skipped || [];
      if (skipped.length) {
        toast.info(`${skipped.length} image(s) were skipped because they are still in use.`);
      }
      setConfirmAction(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsWorking(false);
    }
  };

  const handleUpload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setIsUploading(true);
    let uploaded = 0;
    for (const file of files) {
      try {
        await uploadsApi.uploadImage(file, "library");
        uploaded++;
      } catch (err) {
        toast.error(`${file.name}: ${getErrorMessage(err)}`);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (uploaded) toast.success(`Uploaded ${uploaded} image(s).`);
    refresh();
  };

  const retentionDays = summary?.trashRetentionDays ?? 30;
  const folderOptions = Object.entries(summary?.folders || {}).sort(([a], [b]) =>
    folderLabel(a).localeCompare(folderLabel(b))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-7xl mx-auto space-y-5"
    >
      <Seo title="Media Library" description="Every image stored on the server — browse, bin and restore." />
      <PageHeader
        title="Media Library"
        description={
          summary
            ? `${summary.active.count} images · ${formatBytes(summary.active.sizeBytes)} on the server`
            : "Every image stored on the server."
        }
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isUploading ? "Uploading…" : "Upload images"}
            </button>
          </>
        }
      />

      {/* View tabs + filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex bg-panel/60 border border-line p-1 rounded-xl w-full sm:w-auto">
          {[
            { key: "active", label: "Library", count: summary?.active.count },
            { key: "trash", label: "Bin", count: summary?.trash.count },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                view === tab.key ? "bg-white text-ink shadow-card border border-line" : "text-muted hover:text-ink"
              }`}
            >
              {tab.key === "trash" ? <Trash2 size={14} /> : <Images size={14} />}
              {tab.label}
              {tab.count !== undefined && <span className="text-xs text-muted">{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
          <select className="input sm:w-52" value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="">All folders</option>
            {folderOptions.map(([key, count]) => (
              <option key={key} value={key}>
                {folderLabel(key)} ({count})
              </option>
            ))}
          </select>
          {!isTrash && (
            <select className="input sm:w-40" value={usage} onChange={(e) => setUsage(e.target.value)}>
              <option value="">In use + unused</option>
              <option value="used">In use</option>
              <option value="unused">Unused</option>
            </select>
          )}
        </div>
      </div>

      {isTrash && (
        <p className="text-sm text-muted">
          Images in the bin are deleted permanently {retentionDays} days after they were binned. Restore one to keep it.
        </p>
      )}

      {/* Selection toolbar */}
      {selectableItems.length > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 bg-white border border-line rounded-xl shadow-card px-3 py-2">
          <button className="btn-ghost !px-2.5 !py-1.5" onClick={toggleAll}>
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                allSelected ? "bg-accent border-accent text-white" : "border-line bg-white"
              }`}
            >
              {allSelected && <Check size={12} strokeWidth={3} />}
            </span>
            {allSelected ? "Clear selection" : "Select all on page"}
          </button>
          <span className="text-sm text-muted">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            {isTrash ? (
              <>
                <button className="btn-secondary" disabled={!selected.size || isWorking} onClick={() => runBulk("restore")}>
                  <RotateCcw size={15} /> Restore
                </button>
                <button className="btn-danger" disabled={!selected.size || isWorking} onClick={() => setConfirmAction("delete")}>
                  <Trash2 size={15} /> Delete forever
                </button>
              </>
            ) : (
              <button className="btn-danger" disabled={!selected.size || isWorking} onClick={() => setConfirmAction("trash")}>
                <Trash2 size={15} /> Move to bin
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-2 text-muted text-sm">
            <Loader2 size={22} className="animate-spin text-accent" />
            Loading images…
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={isTrash ? Trash2 : Images}
            title={isTrash ? "The bin is empty" : "No images here"}
            description={
              isTrash
                ? "Images you delete land here first, so you can restore them."
                : "Images uploaded for products, banners, brands and payments will show up here."
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 p-3 sm:p-4">
            {items.map((item) => (
              <MediaTile
                key={item.id}
                item={item}
                isTrash={isTrash}
                isSelected={selected.has(item.id)}
                isSelectable={isSelectable(item)}
                onToggle={() => toggle(item)}
                onPreview={() => setPreview(item)}
              />
            ))}
          </div>
        )}
        <Pagination meta={meta} onPageChange={changePage} />
      </div>

      <PreviewModal item={preview} isTrash={isTrash} onClose={() => setPreview(null)} />

      <ConfirmDialog
        open={confirmAction === "trash"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => runBulk("trash")}
        loading={isWorking}
        title={`Move ${selected.size} image(s) to the bin?`}
        description={`They stay in the bin for ${retentionDays} days and are then deleted permanently. You can restore them any time before that.`}
        confirmLabel="Move to bin"
      />
      <ConfirmDialog
        open={confirmAction === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => runBulk("delete")}
        loading={isWorking}
        title={`Delete ${selected.size} image(s) forever?`}
        description="The files are removed from the server right away. This cannot be undone."
        confirmLabel="Delete forever"
      />
    </motion.div>
  );
}

function MediaTile({ item, isTrash, isSelected, isSelectable, onToggle, onPreview }) {
  const inUse = item.usedIn.length > 0;
  return (
    <div
      className={`group relative rounded-xl border bg-white overflow-hidden transition-all ${
        isSelected ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-accent/40"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="block w-full aspect-square bg-panel/60"
        title={item.originalName || item.storageKey}
      >
        <img src={item.url} alt={item.originalName || ""} loading="lazy" className="w-full h-full object-contain" />
      </button>

      <span
        className={`absolute top-2 left-2 w-5 h-5 rounded-md border flex items-center justify-center pointer-events-none ${
          isSelected
            ? "bg-accent border-accent text-white"
            : isSelectable
            ? "bg-white/90 border-line"
            : "bg-white/90 border-line text-muted"
        }`}
      >
        {isSelected ? <Check size={13} strokeWidth={3} /> : !isSelectable && <Lock size={11} />}
      </span>

      <button
        type="button"
        onClick={onPreview}
        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 border border-line flex items-center justify-center text-muted hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        title="View details"
      >
        <Eye size={14} />
      </button>

      <div className="px-2.5 py-2 border-t border-line space-y-1">
        <p className="text-xs font-medium text-ink truncate">{item.originalName || item.storageKey.split("/").pop()}</p>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] text-muted">{formatBytes(item.sizeBytes)}</span>
          {isTrash ? (
            <span className="text-[11px] font-medium text-danger">{daysUntil(item.purgeAt)}d left</span>
          ) : inUse ? (
            <Badge tone="verify">In use</Badge>
          ) : (
            <Badge>Unused</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ item, isTrash, onClose }) {
  const toast = useToast();
  if (!item) return null;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      toast.success("Image link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const rows = [
    ["Folder", folderLabel(item.folder)],
    ["Size", formatBytes(item.sizeBytes)],
    ["Type", item.mimeType],
    ["Uploaded", formatDateTime(item.createdAt)],
  ];
  if (isTrash) {
    rows.push(["Binned", formatDateTime(item.trashedAt)]);
    rows.push(["Deleted on", formatDate(item.purgeAt)]);
  }

  return (
    <Modal open={!!item} onClose={onClose} title={item.originalName || "Image details"} size="lg">
      <div className="space-y-4">
        <div className="rounded-xl bg-panel/60 border border-line flex items-center justify-center max-h-[45vh] overflow-hidden">
          <img src={item.url} alt="" className="max-h-[45vh] w-auto object-contain" />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="text-xs text-muted mb-1.5">Used in</p>
          {item.usedIn.length ? (
            <div className="flex flex-wrap gap-1.5">
              {item.usedIn.map((label) => (
                <Badge key={label} tone="verify">
                  {label}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink">Not used anywhere</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input font-mono text-xs" readOnly value={item.url} onFocus={(e) => e.target.select()} />
          <div className="flex gap-2 shrink-0">
            <button className="btn-secondary" onClick={copyUrl}>
              <Copy size={15} /> Copy
            </button>
            <a className="btn-secondary" href={item.url} target="_blank" rel="noreferrer">
              <ExternalLink size={15} /> Open
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
