import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  ImagePlus, 
  X, 
  Loader2, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  ShieldCheck,
  FileText,
  Sliders,
  Images,
  Package,
  ChevronDown,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productsApi } from "../../api/products.api.js";
import { categoriesApi, brandsApi } from "../../api/taxonomy.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { CONDITION_GRADES } from "../../utils/constants.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Loader from "../../components/common/Loader.jsx";
import { Field, Input, Textarea } from "../../components/common/FormField.jsx";

const TABS = [
  { id: "Details", label: "Details", icon: FileText },
  { id: "Images", label: "Images", icon: Images },
  { id: "Specs", label: "Specs", icon: Sliders },
  { id: "Inspection Report", label: "Inspection Report", icon: ShieldCheck },
];

const emptyForm = {
  name: "",
  brandId: "",
  categoryId: "",
  subCategoryId: "",
  shortDescription: "",
  description: "",
  condition: CONDITION_GRADES[0] || "Like New",
  originalPrice: "",
  sellingPrice: "",
  warrantyMonths: 6,
  stock: 0,
  isNewArrival: true,
  isBestDeal: false,
  isTrending: false,
  isActive: true,
};

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState("Details");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchInitialData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          categoriesApi.list(),
          brandsApi.list(),
        ]);
        if (!mounted) return;
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);

        if (isEdit) {
          const res = await productsApi.get(id);
          const p = res.data.data;
          setProduct(p);
          setForm({
            name: p.name || "",
            brandId: p.brandId || "",
            categoryId: p.categoryId || "",
            subCategoryId: p.subCategoryId || "",
            shortDescription: p.shortDescription || "",
            description: p.description || "",
            condition: p.condition || CONDITION_GRADES[0],
            originalPrice: p.originalPrice ?? "",
            sellingPrice: p.sellingPrice ?? "",
            warrantyMonths: p.warrantyMonths ?? 0,
            stock: p.stock ?? 0,
            isNewArrival: !!p.isNewArrival,
            isBestDeal: !!p.isBestDeal,
            isTrending: !!p.isTrending,
            isActive: !!p.isActive,
          });
        }
      } catch (err) {
        if (mounted) toast.error(getErrorMessage(err));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === form.categoryId),
    [categories, form.categoryId]
  );
  const isAccessories = selectedCategory?.name === "Accessories";
  const subCategoryOptions = selectedCategory?.subCategories || [];

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const refetchProduct = async () => {
    try {
      const res = await productsApi.get(id);
      setProduct(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveDetails = async (e) => {
    if (e) e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter a product name.");
      return;
    }
    if (!form.brandId) {
      toast.error("Please select a brand.");
      return;
    }
    if (!form.categoryId) {
      toast.error("Please select a category.");
      return;
    }
    if (Number(form.originalPrice) < 0 || Number(form.sellingPrice) < 0) {
      toast.error("Prices cannot be negative values.");
      return;
    }
    if (Number(form.sellingPrice) > Number(form.originalPrice)) {
      toast.error("Selling price cannot be higher than the original price.");
      return;
    }

    setIsSaving(true);
    try {
      await delay(350);
      const payload = {
        ...form,
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        originalPrice: Number(form.originalPrice),
        sellingPrice: Number(form.sellingPrice),
        stock: Math.max(0, Number(form.stock)),
        warrantyMonths: Math.max(0, Number(form.warrantyMonths)),
        subCategoryId: isAccessories ? form.subCategoryId || null : null,
      };

      if (isEdit) {
        await productsApi.update(id, payload);
        toast.success("Product updated successfully.");
        await refetchProduct();
      } else {
        const res = await productsApi.create(payload);
        toast.success("Product created successfully.");
        navigate(`/products/${res.data.data.id}`, { replace: true });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loader full />;

  return (
    <div className="font-body text-ink max-w-5xl mx-auto space-y-6">
      <Seo title={isEdit ? `Edit: ${form.name}` : "New Product"} />

      {/* Header Bar */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors mb-3 group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to products
        </Link>
        <PageHeader
          title={
            <span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">
              {isEdit ? form.name || "Edit Product" : "Create New Product"}
            </span>
          }
          description={
            isEdit
              ? "Update product catalog details, media assets, specifications, and quality checklists."
              : "Enter details to create and configure a new product in the store database."
          }
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-panel border border-line p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          const isDisabled = !isEdit && t.id !== "Details";

          return (
            <button
              key={t.id}
              onClick={() => !isDisabled && setTab(t.id)}
              disabled={isDisabled}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed text-muted"
                  : isActive
                  ? "text-accentDark font-bold"
                  : "text-muted hover:text-ink hover:bg-white/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-white rounded-xl shadow-2xs border border-line"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={16} className={isActive ? "text-accent" : "text-muted"} />
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {!isEdit && tab !== "Details" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-panel border border-line flex items-center gap-3 text-muted text-sm font-semibold"
        >
          <AlertCircle size={18} className="shrink-0 text-accent" />
          <span>Save the basic product details first to unlock additional management tabs.</span>
        </motion.div>
      )}

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {tab === "Details" && (
          <motion.form
            key="details-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSaveDetails}
            className="bg-white rounded-2xl border border-line p-6 md:p-8 space-y-6 shadow-xs max-w-4xl"
          >
            {/* Header with Package Icon */}
            <div className="flex items-center gap-2.5 border-b border-line pb-4">
              <div className="w-8 h-8 rounded-lg bg-panel flex items-center justify-center border border-line text-ink">
                <Package size={18} />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-ink">Basic Product Information</h3>
            </div>

            <Field label="Product Name" required>
              <Input
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="e.g. Apple iPhone 13 (128GB) - Midnight"
              />
            </Field>

            {/* Custom Styled Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Brand" required>
                <div className="relative">
                  <select
                    value={form.brandId}
                    onChange={(e) => update({ brandId: e.target.value })}
                    className="w-full appearance-none bg-panel/60 border border-line hover:border-accent/40 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition-all pr-10 cursor-pointer"
                  >
                    <option value="" disabled>Select brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id} className="text-ink font-normal bg-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </Field>

              <Field label="Category" required>
                <div className="relative">
                  <select
                    value={form.categoryId}
                    onChange={(e) => update({ categoryId: e.target.value, subCategoryId: "" })}
                    className="w-full appearance-none bg-panel/60 border border-line hover:border-accent/40 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition-all pr-10 cursor-pointer"
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="text-ink font-normal bg-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </Field>
            </div>

            {isAccessories && (
              <Field label="Sub-category" hint="Specific sub-category classification for accessories.">
                <div className="relative">
                  <select
                    value={form.subCategoryId}
                    onChange={(e) => update({ subCategoryId: e.target.value })}
                    className="w-full appearance-none bg-panel/60 border border-line hover:border-accent/40 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition-all pr-10 cursor-pointer"
                  >
                    <option value="">None</option>
                    {subCategoryOptions.map((s) => (
                      <option key={s.id} value={s.id} className="text-ink font-normal bg-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </Field>
            )}

            <Field label="Short Description" required hint="Used for product cards and search snippets (max 500 chars).">
              <Input
                value={form.shortDescription}
                onChange={(e) => update({ shortDescription: e.target.value })}
                placeholder="e.g. 6.1-inch Super Retina XDR display, A15 Bionic chip, Dual 12MP camera system"
                maxLength={500}
              />
            </Field>

            <Field label="Full Description" required>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Provide comprehensive details regarding the product specifications, usage, and key features..."
              />
            </Field>

            <div className="pt-2 border-t border-line" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label="Condition Grade" required>
                <div className="relative">
                  <select
                    value={form.condition}
                    onChange={(e) => update({ condition: e.target.value })}
                    className="w-full appearance-none bg-panel/60 border border-line hover:border-accent/40 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition-all pr-10 cursor-pointer"
                  >
                    {CONDITION_GRADES.map((c) => (
                      <option key={c} value={c} className="text-ink font-normal bg-white">
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </Field>

              <Field label="Warranty (Months)">
                <Input
                  type="number"
                  min={0}
                  value={form.warrantyMonths}
                  onChange={(e) => update({ warrantyMonths: Math.max(0, Number(e.target.value)) })}
                />
              </Field>

              <Field label="Stock Inventory" required>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => update({ stock: Math.max(0, Number(e.target.value)) })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Original Price (₹)" required>
                <Input
                  type="number"
                  min={0}
                  value={form.originalPrice}
                  onChange={(e) => update({ originalPrice: e.target.value })}
                  placeholder="0.00"
                />
              </Field>

              <Field label="Selling Price (₹)" required>
                <Input
                  type="number"
                  min={0}
                  value={form.sellingPrice}
                  onChange={(e) => update({ sellingPrice: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
            </div>

            {Number(form.originalPrice) > 0 && Number(form.sellingPrice) > 0 && (
              <div className="p-3.5 bg-panel border border-line rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-muted">Discount Calculation</span>
                <span className="font-bold text-ink">
                  {formatDiscount(form.originalPrice, form.sellingPrice)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-line" />

            {/* Pill Style Storefront Display Tags */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag size={15} className="text-muted" />
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Storefront Display Tags
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "isNewArrival", label: "New Arrival" },
                  { key: "isBestDeal", label: "Best Deal" },
                  { key: "isTrending", label: "Trending" },
                  { key: "isActive", label: "Active" },
                ].map((item) => {
                  const isActive = form[item.key];
                  return (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => update({ [item.key]: !isActive })}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 select-none ${
                        isActive
                          ? "bg-accent/10 border-accent/40 text-accentDark shadow-2xs"
                          : "bg-panel/50 border-line text-muted hover:border-line/80 hover:text-ink"
                      }`}
                    >
                      <span>{item.label}</span>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                          isActive ? "bg-accent text-white" : "bg-line/40 text-transparent"
                        }`}
                      >
                        <Check size={11} strokeWidth={3} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-accent hover:bg-accentDark text-white shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </motion.form>
        )}

        {tab === "Images" && isEdit && product && (
          <ImagesTab key="images-tab" productId={id} images={product.images || []} onChange={refetchProduct} />
        )}

        {tab === "Specs" && isEdit && product && (
          <SpecsTab key="specs-tab" productId={id} specs={product.specs || []} onChange={refetchProduct} />
        )}

        {tab === "Inspection Report" && isEdit && product && (
          <InspectionTab key="inspection-tab" productId={id} points={product.inspectionPoints || []} onChange={refetchProduct} />
        )}
      </AnimatePresence>
    </div>
  );
}

function formatDiscount(original, selling) {
  const o = Number(original);
  const s = Number(selling);
  if (!o || o <= 0) return "—";
  if (s > o) return "Selling price exceeds original price";
  const diff = o - s;
  const pct = ((diff / o) * 100).toFixed(1);
  return `₹${diff.toLocaleString("en-IN")} discount (${pct}% off)`;
}

// ---------------------------------------------------------------------
// Images Tab
// ---------------------------------------------------------------------
function ImagesTab({ productId, images, onChange }) {
  const [isUploading, setIsUploading] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const toast = useToast();

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      await delay(300);
      await productsApi.addImages(productId, files);
      toast.success("Images uploaded successfully.");
      await onChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    setDeletingId(imageId);
    try {
      await delay(250);
      await productsApi.deleteImage(productId, imageId);
      toast.success("Image removed.");
      await onChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const move = async (index, direction) => {
    const newOrder = [...images].sort((a, b) => a.displayOrder - b.displayOrder).map((i) => i.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    setReorderingId(newOrder[index]);
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

    try {
      await productsApi.reorderImages(productId, newOrder);
      await onChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReorderingId(null);
    }
  };

  const sorted = useMemo(
    () => [...(images || [])].sort((a, b) => a.displayOrder - b.displayOrder),
    [images]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white rounded-2xl border border-line p-6 md:p-8 space-y-6 shadow-xs max-w-4xl"
    >
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-ink">Product Gallery</h3>
          <p className="text-xs font-semibold text-muted">Upload high-resolution media. The primary image is displayed first.</p>
        </div>
      </div>

      <label
        className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          isUploading
            ? "bg-accent/5 border-accent opacity-80 pointer-events-none"
            : "bg-panel/50 border-line hover:border-accent hover:bg-panel"
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-accent">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm font-semibold">Uploading media assets...</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-panel text-ink flex items-center justify-center border border-line shadow-2xs">
              <ImagePlus size={22} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-ink">Click to upload or drag files here</p>
              <p className="text-xs text-muted mt-0.5">PNG, JPG, WEBP formats supported</p>
            </div>
          </>
        )}
        <input
          type="file"
          multiple
          disabled={isUploading}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">No product images uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {sorted.map((img, idx) => {
              const isDeletingThis = deletingId === img.id;
              const isMovingThis = reorderingId === img.id;

              return (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group rounded-2xl overflow-hidden border border-line bg-panel aspect-square shadow-2xs"
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />

                  {(isDeletingThis || isMovingThis) && (
                    <div className="absolute inset-0 bg-ink/60 flex items-center justify-center z-20">
                      <Loader2 size={20} className="animate-spin text-white" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                    <button
                      type="button"
                      disabled={idx === 0 || isMovingThis}
                      onClick={() => move(idx, -1)}
                      className="w-8 h-8 rounded-xl bg-white text-ink hover:text-accent shadow-sm flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                      title="Move Left"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sorted.length - 1 || isMovingThis}
                      onClick={() => move(idx, 1)}
                      className="w-8 h-8 rounded-xl bg-white text-ink hover:text-accent shadow-sm flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                      title="Move Right"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingThis}
                      onClick={() => handleDelete(img.id)}
                      className="w-8 h-8 rounded-xl bg-white text-danger hover:bg-dangerLight shadow-sm flex items-center justify-center transition-all active:scale-90"
                      title="Remove Image"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {idx === 0 && (
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-accent text-white font-semibold text-[10px] tracking-wide shadow-2xs z-10">
                      Primary
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// Specs Tab
// ---------------------------------------------------------------------
function SpecsTab({ productId, specs, onChange }) {
  const [rows, setRows] = useState(
    specs?.length ? specs.map((s) => ({ id: crypto.randomUUID(), label: s.label, value: s.value })) : []
  );
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const addRow = () => setRows((r) => [...r, { id: crypto.randomUUID(), label: "", value: "" }]);
  const removeRow = (idToRemove) => setRows((r) => r.filter((row) => row.id !== idToRemove));
  const updateRow = (idToUpdate, field, val) =>
    setRows((r) => r.map((row) => (row.id === idToUpdate ? { ...row, [field]: val } : row)));

  const handleSave = async (e) => {
    e.preventDefault();
    const clean = rows
      .map((r) => ({ label: r.label.trim(), value: r.value.trim() }))
      .filter((r) => r.label && r.value);

    setIsSaving(true);
    try {
      await delay(350);
      await productsApi.replaceSpecs(productId, clean);
      toast.success("Specifications updated.");
      await onChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      onSubmit={handleSave}
      className="bg-white rounded-2xl border border-line p-6 md:p-8 space-y-6 shadow-xs max-w-3xl"
    >
      <div className="border-b border-line pb-4">
        <h3 className="font-heading font-extrabold text-lg text-ink">Technical Specifications</h3>
        <p className="text-xs font-semibold text-muted mt-0.5">Define attribute key-value pairs (e.g., Memory, Processor, Storage).</p>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {rows.map((row) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="flex-1">
                <Input
                  placeholder="Label (e.g. RAM)"
                  value={row.label}
                  onChange={(e) => updateRow(row.id, "label", e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Value (e.g. 12 GB)"
                  value={row.value}
                  onChange={(e) => updateRow(row.id, "value", e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="p-2.5 rounded-xl text-muted hover:text-danger hover:bg-dangerLight transition-colors border border-transparent hover:border-danger/20 shrink-0"
                title="Remove spec"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {rows.length === 0 && (
          <p className="text-sm text-muted text-center py-6">No specifications added yet. Click below to add your first spec.</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-line">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-panel hover:bg-line/60 text-ink border border-line transition-all active:scale-95"
        >
          <Plus size={14} /> Add Spec Field
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent hover:bg-accentDark text-white shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? "Saving..." : "Save Specs"}
        </button>
      </div>
    </motion.form>
  );
}

// ---------------------------------------------------------------------
// Inspection Report Tab (Pill Toggles & Redesigned Checkpoints)
// ---------------------------------------------------------------------
function InspectionTab({ productId, points, onChange }) {
  const [rows, setRows] = useState(
    points?.length
      ? points.map((p) => ({ id: crypto.randomUUID(), label: p.label, passed: !!p.passed }))
      : []
  );
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const addRow = () => setRows((r) => [...r, { id: crypto.randomUUID(), label: "", passed: true }]);
  const removeRow = (idToRemove) => setRows((r) => r.filter((row) => row.id !== idToRemove));
  const updateRow = (idToUpdate, field, val) =>
    setRows((r) => r.map((row) => (row.id === idToUpdate ? { ...row, [field]: val } : row)));

  const handleSave = async (e) => {
    e.preventDefault();
    const clean = rows
      .map((r) => ({ label: r.label.trim(), passed: r.passed }))
      .filter((r) => r.label);

    setIsSaving(true);
    try {
      await delay(350);
      await productsApi.replaceInspectionPoints(productId, clean);
      toast.success("Inspection checklist updated.");
      await onChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      onSubmit={handleSave}
      className="bg-white rounded-2xl border border-line p-6 md:p-8 space-y-6 shadow-xs max-w-3xl"
    >
      <div className="border-b border-line pb-4">
        <h3 className="font-heading font-extrabold text-lg text-ink">Inspection Checklist</h3>
        <p className="text-xs font-semibold text-muted mt-0.5">
          Quality assurance checkpoints displayed on the customer-facing inspection report.
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {rows.map((row) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 p-3 bg-panel/40 rounded-2xl border border-line"
            >
              <div className="flex-1">
                <Input
                  placeholder="Checkpoint (e.g. Battery Health > 85%)"
                  value={row.label}
                  onChange={(e) => updateRow(row.id, "label", e.target.value)}
                />
              </div>

              {/* Segmented Pill Toggle for Passed / Failed */}
              <div className="bg-white border border-line rounded-xl p-1 flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => updateRow(row.id, "passed", true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    row.passed
                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      row.passed ? "bg-emerald-500" : "bg-muted/40"
                    }`}
                  />
                  Passed
                </button>

                <button
                  type="button"
                  onClick={() => updateRow(row.id, "passed", false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    !row.passed
                      ? "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      !row.passed ? "bg-rose-500" : "bg-muted/40"
                    }`}
                  />
                  Failed
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="p-2.5 rounded-xl text-muted hover:text-danger hover:bg-dangerLight transition-colors border border-transparent hover:border-danger/20 shrink-0"
                title="Remove checkpoint"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {rows.length === 0 && (
          <p className="text-sm text-muted text-center py-6">No inspection checkpoints added yet.</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-line">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-panel hover:bg-line/60 text-ink border border-line transition-all active:scale-95"
        >
          <Plus size={14} /> Add Checkpoint
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent hover:bg-accentDark text-white shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? "Saving..." : "Save Checklist"}
        </button>
      </div>
    </motion.form>
  );
}