import { useEffect, useState, useMemo } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Award, 
  Loader2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Sparkles,
  ArrowUpDown
} from "lucide-react";
import { brandsApi } from "../../api/taxonomy.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { Field, Input, Checkbox } from "../../components/common/FormField.jsx";
import ImageUploader from "../../components/common/ImageUploader.jsx";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  
  const [modalBrand, setModalBrand] = useState(undefined); // undefined = closed, null = new, obj = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await brandsApi.list();
      setBrands(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteBrand = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await brandsApi.remove(deleteTarget.id);
      toast.success("Brand deleted successfully.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Search & Filter Logic
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const matchesSearch =
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && brand.isActive) ||
        (statusFilter === "inactive" && !brand.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [brands, searchQuery, statusFilter]);

  // Brand Stats
  const stats = useMemo(() => {
    const total = brands.length;
    const active = brands.filter((b) => b.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [brands]);

  return (
    <div className="font-body text-ink max-w-6xl mx-auto space-y-6">
      <Seo title="Brands" description="Manage product brands." />

      <PageHeader
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Brands</span>}
        description="Every product in the catalog is mapped to a primary brand."
        actions={
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent hover:bg-accentDark text-white shadow-sm transition-all duration-200 active:scale-95"
            onClick={() => setModalBrand(null)}
          >
            <Plus size={16} /> New Brand
          </button>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-line p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Brands</p>
            <p className="font-heading text-2xl font-extrabold text-ink mt-0.5">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-panel flex items-center justify-center text-muted border border-line">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-line p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Active</p>
            <p className="font-heading text-2xl font-extrabold text-verify mt-0.5">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-verifyLight flex items-center justify-center text-verify border border-verify/20">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-line p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Inactive</p>
            <p className="font-heading text-2xl font-extrabold text-muted mt-0.5">{stats.inactive}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-panel flex items-center justify-center text-muted border border-line">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-line bg-panel/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-sm border border-line bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-semibold text-muted mr-1 flex items-center gap-1">
              <Filter size={13} /> Filter:
            </span>
            {["all", "active", "inactive"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === status
                    ? "bg-accent text-white shadow-2xs"
                    : "bg-white text-muted border border-line hover:text-ink hover:bg-panel"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          isLoading={isLoading}
          rows={filteredBrands}
          emptyTitle="No brands found"
          emptyDescription={
            searchQuery || statusFilter !== "all"
              ? "Try adjusting your search query or status filter."
              : "Add your first brand to start building out your product catalog."
          }
          columns={[
            {
              key: "name",
              header: "Brand Name",
              render: (b) => (
                <div className="flex items-center gap-3 py-1">
                  {b.logoUrl ? (
                    <img
                      src={b.logoUrl}
                      alt={b.name}
                      className="w-10 h-10 rounded-xl object-contain bg-panel p-1.5 border border-line shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-accentLight flex items-center justify-center text-accentDark font-display text-base font-bold border border-accent/20 shadow-2xs">
                      {b.logoInitial || b.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-ink font-heading tracking-tight flex items-center gap-1.5">
                      {b.name}
                    </p>
                    <p className="text-xs font-mono text-muted">/{b.slug}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (b) => (
                <Badge tone={b.isActive ? "verify" : "neutral"}>
                  {b.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
            {
              key: "displayOrder",
              header: (
                <span className="inline-flex items-center gap-1">
                  Order <ArrowUpDown size={12} />
                </span>
              ),
              render: (b) => (
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-panel border border-line text-muted">
                  {b.displayOrder}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              headClassName: "text-right",
              className: "text-right",
              render: (b) => (
                <div className="flex justify-end gap-1.5">
                  <button
                    className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-panel transition-colors border border-transparent hover:border-line"
                    onClick={() => setModalBrand(b)}
                    aria-label={`Edit ${b.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-dangerLight transition-colors border border-transparent hover:border-danger/20"
                    onClick={() => setDeleteTarget(b)}
                    aria-label={`Delete ${b.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Add / Edit Brand Modal */}
      {modalBrand !== undefined && (
        <BrandModal brand={modalBrand} onClose={() => setModalBrand(undefined)} onSaved={load} />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete brand?"
        description={`"${deleteTarget?.name}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Brand"}
        onConfirm={handleDeleteBrand}
      />
    </div>
  );
}

function BrandModal({ brand, onClose, onSaved }) {
  const isEdit = !!brand;
  const [form, setForm] = useState({
    name: brand?.name || "",
    logoUrl: brand?.logoUrl || "",
    logoInitial: brand?.logoInitial || "",
    displayOrder: brand?.displayOrder ?? 0,
    isActive: brand?.isActive ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = form.name.trim();
    if (!cleanName) {
      toast.error("Please enter a brand name.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...form, name: cleanName };
      if (isEdit) {
        await brandsApi.update(brand.id, payload);
        toast.success("Brand updated.");
      } else {
        await brandsApi.create(payload);
        toast.success("Brand created.");
      }
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Form preview letter calculation
  const previewInitial = form.logoInitial.trim() || form.name.trim()[0] || "B";

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="font-heading font-extrabold text-lg text-ink flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          {isEdit ? `Edit Brand: ${brand.name}` : "Create New Brand"}
        </span>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:text-ink hover:bg-panel transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="brand-modal-form"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-accent hover:bg-accentDark text-white shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving…" : "Save Brand"}
          </button>
        </div>
      }
    >
      <form id="brand-modal-form" onSubmit={handleSubmit} className="space-y-4 font-body">
        {/* Live Logo / Badge Preview */}
        <div className="p-3 bg-panel rounded-xl border border-line flex items-center gap-3">
          {form.logoUrl ? (
            <img
              src={form.logoUrl}
              alt="Preview"
              className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-line shadow-2xs"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-accentLight flex items-center justify-center text-accentDark font-display text-lg font-bold border border-accent/20 shadow-2xs uppercase">
              {previewInitial}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Live Preview</p>
            <p className="text-sm font-heading font-extrabold text-ink">
              {form.name.trim() || "Brand Name"}
            </p>
          </div>
        </div>

        <Field label="Brand Name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Apple"
            autoFocus
          />
        </Field>

        <ImageUploader
          label="Logo"
          value={form.logoUrl}
          folder="brands"
          onUploaded={(res) => setForm((f) => ({ ...f, logoUrl: res?.url || "" }))}
        />

        <Field label="Fallback Initial" hint="Shown when there's no logo (e.g. 'A' for Apple).">
          <Input
            maxLength={2}
            className="font-mono uppercase"
            value={form.logoInitial}
            onChange={(e) => setForm((f) => ({ ...f, logoInitial: e.target.value }))}
            placeholder="e.g. A"
          />
        </Field>

        <Field label="Display Order">
          <Input
            type="number"
            className="font-mono"
            value={form.displayOrder}
            onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
          />
        </Field>

        {isEdit && (
          <Checkbox
            label="Active (visible on storefront)"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
        )}
      </form>
    </Modal>
  );
}