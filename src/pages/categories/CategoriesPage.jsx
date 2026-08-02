import { useEffect, useState } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  Tags, 
  Loader2, 
  FolderTree, 
  Layers 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { categoriesApi, subCategoriesApi } from "../../api/taxonomy.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Loader from "../../components/common/Loader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { Field, Input } from "../../components/common/FormField.jsx";
import ImageUploader from "../../components/common/ImageUploader.jsx";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState({});
  const toast = useToast();

  const [categoryModal, setCategoryModal] = useState(null);
  const [subModal, setSubModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    try {
      const res = await categoriesApi.list();
      setCategories(res.data.data || []);
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

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      const res = await categoriesApi.seedDefaults();
      toast.success(res.data.message);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSeeding(false);
    }
  };

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleDeleteSubCategory = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await subCategoriesApi.remove(deleteTarget.id);
      toast.success("Sub-category deleted.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <Loader full />;

  return (
    <div className="font-body text-ink max-w-6xl mx-auto space-y-6">
      <Seo title="Categories" description="Manage top-level categories and Accessories sub-categories." />

      <PageHeader
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Categories</span>}
        description="Mobile, Laptop, DSLR, and Accessories are fixed. Accessories can have customizable sub-categories."
        actions={
          categories.length === 0 && (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-accent hover:bg-accentDark text-white shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
              onClick={handleSeedDefaults}
              disabled={isSeeding}
            >
              {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Create Default Categories
            </button>
          )
        }
      />

      {categories.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-panel rounded-2xl border border-line p-8 text-center shadow-xs"
        >
          <EmptyState
            icon={Tags}
            title="No Categories Configured"
            description="Create the 4 primary categories (Mobile, Laptop, DSLR, Accessories) to get started."
            action={
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent hover:bg-accentDark text-white shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
              >
                {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Create Default Categories
              </button>
            }
          />
        </motion.div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const isExpanded = !!expanded[cat.id];
            const hasSub = cat.subCategories && cat.subCategories.length > 0;

            return (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden transition-colors duration-200 hover:border-line/80"
              >
                {/* Category Bar */}
                <div className="flex items-center gap-3 px-5 py-4 bg-white">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-panel transition-colors cursor-pointer"
                    aria-label={isExpanded ? "Collapse category" : "Expand category"}
                  >
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight size={18} />
                    </motion.div>
                  </button>

                  {cat.iconSvgUrl ? (
                    <img
                      src={cat.iconSvgUrl}
                      alt={cat.name}
                      className="w-10 h-10 rounded-xl object-contain bg-panel p-1.5 border border-line shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-accentLight flex items-center justify-center text-accentDark font-display text-base font-bold border border-accent/20 shrink-0">
                      {cat.name[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-extrabold text-base text-ink tracking-tight">{cat.name}</p>
                      {hasSub && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-panel text-[11px] font-mono font-medium text-muted border border-line">
                          <Layers size={11} /> {cat.subCategories.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-muted">/{cat.slug}</p>
                  </div>

                  {cat.name === "Accessories" && (
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent/10 text-accentDark hover:bg-accent/20 transition-colors border border-accent/20 active:scale-95 cursor-pointer"
                      onClick={() => {
                        setExpanded((prev) => ({ ...prev, [cat.id]: true }));
                        setSubModal({ categoryId: cat.id, subCategory: null });
                      }}
                    >
                      <Plus size={14} /> Sub-category
                    </button>
                  )}

                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-ink hover:bg-panel border border-transparent hover:border-line transition-all active:scale-95 cursor-pointer"
                    onClick={() => setCategoryModal(cat)}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                </div>

                {/* Subcategories Container */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-line bg-panel/40 px-5 py-4 overflow-hidden"
                    >
                      {hasSub ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {cat.subCategories.map((sub) => (
                            <motion.div
                              key={sub.id}
                              layout
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-3 bg-white rounded-xl border border-line px-4 py-3 shadow-2xs hover:shadow-xs transition-all"
                            >
                              <FolderTree size={16} className="text-muted shrink-0" />

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-ink">{sub.name}</p>
                                <p className="text-xs font-mono text-muted">/{sub.slug}</p>
                              </div>

                              <button
                                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-panel transition-colors cursor-pointer"
                                onClick={() => setSubModal({ categoryId: cat.id, subCategory: sub })}
                                aria-label={`Edit ${sub.name}`}
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-dangerLight transition-colors cursor-pointer"
                                onClick={() => setDeleteTarget(sub)}
                                aria-label={`Delete ${sub.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs font-mono text-muted">
                            {cat.name === "Accessories"
                              ? "No sub-categories created yet. Click '+ Sub-category' above to add one."
                              : "This category does not support sub-categories."}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Category Modal */}
      {categoryModal && (
        <CategoryEditModal category={categoryModal} onClose={() => setCategoryModal(null)} onSaved={load} />
      )}

      {/* Subcategory Modal */}
      {subModal && (
        <SubCategoryModal
          categoryId={subModal.categoryId}
          subCategory={subModal.subCategory}
          onClose={() => setSubModal(null)}
          onSaved={load}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete sub-category?"
        description={`"${deleteTarget?.name}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Sub-category"}
        onConfirm={handleDeleteSubCategory}
      />
    </div>
  );
}

function CategoryEditModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    iconSvgUrl: category.iconSvgUrl || "",
    imageUrl: category.imageUrl || "",
    displayOrder: category.displayOrder ?? 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await categoriesApi.update(category.id, form);
      toast.success("Category updated.");
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-heading font-extrabold text-lg text-ink">
            Edit Category:
          </span>
          <span className="font-heading font-extrabold text-lg text-accentDark bg-accentLight/60 px-2.5 py-0.5 rounded-lg border border-accent/20">
            {category.name}
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:text-ink hover:bg-panel transition-colors cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="category-edit-form"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent hover:bg-accentDark text-white shadow-xs transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
            disabled={isSaving}
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      }
    >
      <form id="category-edit-form" onSubmit={handleSubmit} className="space-y-5 font-body">
        {/* Visual Assets Section */}
        <div className="space-y-4">
          <p className="text-xs font-mono font-bold tracking-wider text-muted uppercase">
            Visual Assets
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploader
              label="Icon (SVG)"
              value={form.iconSvgUrl}
              folder="categories"
              onUploaded={(res) => setForm((f) => ({ ...f, iconSvgUrl: res?.url || "" }))}
            />
            <ImageUploader
              label="Banner Image"
              value={form.imageUrl}
              folder="categories"
              onUploaded={(res) => setForm((f) => ({ ...f, imageUrl: res?.url || "" }))}
            />
          </div>
        </div>

        <hr className="border-line" />

        {/* Sorting Section */}
        <div className="space-y-4">
          <p className="text-xs font-mono font-bold tracking-wider text-muted uppercase">
            Sorting & Priority
          </p>

          {/* Display Order Interactive Stepper */}
          <div className="p-3.5 rounded-xl bg-panel/60 border border-line flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-ink">Display Priority Order</p>
              <p className="text-xs text-muted">Lower values appear first on the storefront header.</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-line rounded-lg p-1 shadow-2xs">
              <button
                type="button"
                className="w-7 h-7 rounded-md border border-line bg-panel hover:bg-gray-100 flex items-center justify-center font-bold text-ink text-sm transition-colors cursor-pointer select-none"
                onClick={() => setForm((f) => ({ ...f, displayOrder: Math.max(0, f.displayOrder - 1) }))}
              >
                -
              </button>
              <Input
                type="number"
                min="0"
                className="w-14 text-center font-mono font-bold text-sm border-none shadow-none focus:ring-0 p-0"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: Math.max(0, Number(e.target.value)) }))}
              />
              <button
                type="button"
                className="w-7 h-7 rounded-md border border-line bg-panel hover:bg-gray-100 flex items-center justify-center font-bold text-ink text-sm transition-colors cursor-pointer select-none"
                onClick={() => setForm((f) => ({ ...f, displayOrder: f.displayOrder + 1 }))}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function SubCategoryModal({ categoryId, subCategory, onClose, onSaved }) {
  const isEdit = !!subCategory;
  const [form, setForm] = useState({
    name: subCategory?.name || "",
    iconSvgUrl: subCategory?.iconSvgUrl || "",
    imageUrl: subCategory?.imageUrl || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = form.name.trim();
    if (!cleanName) {
      toast.error("Please enter a sub-category name.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...form, name: cleanName };
      if (isEdit) {
        await subCategoriesApi.update(subCategory.id, payload);
        toast.success("Sub-category updated.");
      } else {
        await subCategoriesApi.create({ categoryId, ...payload });
        toast.success("Sub-category created.");
      }
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="font-heading font-extrabold text-lg text-ink">
          {isEdit ? "Edit Sub-category" : "Create New Sub-category"}
        </span>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:text-ink hover:bg-panel transition-colors cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="subcategory-form"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent hover:bg-accentDark text-white shadow-xs transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
            disabled={isSaving}
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save Sub-category"}
          </button>
        </div>
      }
    >
      <form id="subcategory-form" onSubmit={handleSubmit} className="space-y-4 font-body">
        <Field label="Sub-category Name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Wireless Headphones"
            autoFocus
          />
        </Field>

        <ImageUploader
          label="Icon (SVG)"
          value={form.iconSvgUrl}
          folder="sub-categories"
          onUploaded={(res) => setForm((f) => ({ ...f, iconSvgUrl: res?.url || "" }))}
        />
      </form>
    </Modal>
  );
}