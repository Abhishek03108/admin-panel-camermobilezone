import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Search, Package, Clock, Loader2, Calendar, Save, ListPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trendingApi, recentlyAddedApi, dealsOfWeekApi } from "../../api/curated.api.js";
import { productsApi } from "../../api/products.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Modal from "../../components/common/Modal.jsx";

// Helper for smooth manual loader delays (prevents flash of loading content)
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const TABS = [
  { key: "trending", label: "Trending Products", api: trendingApi },
  { key: "deals", label: "Deals of the Week", api: dealsOfWeekApi },
  { key: "recent", label: "Recently Added", api: recentlyAddedApi },
];

export default function CuratedListsPage() {
  const [activeTab, setActiveTab] = useState("trending");
  const tabConfig = TABS.find((t) => t.key === activeTab);

  return (
    <div className="font-body text-ink max-w-6xl mx-auto space-y-7">
      <Seo title="Curated Lists" description="Manage trending products, deals of the week, and recently added." />

      <PageHeader 
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Curated Lists</span>} 
        description="Manually curated product collections featured across store sections and homepage showcases." 
      />

      {/* Tab Navigation */}
      <div className="relative border-b border-line flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative px-5 py-3.5 text-base font-semibold transition-colors whitespace-nowrap cursor-pointer select-none ${
                isActive ? "text-accent font-bold" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
          className="space-y-6"
        >
          {activeTab === "deals" && <DealsSettingsCard />}
          <CuratedListManager api={tabConfig.api} label={tabConfig.label} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DealsSettingsCard() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ title: "", subtitle: "", endsAt: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const res = await dealsOfWeekApi.getSettings();
      const s = res.data.data;
      setSettings(s);
      setForm({
        title: s?.title || "Best Deals of the Week",
        subtitle: s?.subtitle || "",
        endsAt: s?.endsAt ? toLocalInput(s.endsAt) : "",
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 400) await delay(400 - elapsed);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!form.endsAt) {
      toast.error("Please set the countdown end date and time.");
      return;
    }
    setIsSaving(true);
    const start = Date.now();
    try {
      await dealsOfWeekApi.updateSettings({
        title: form.title,
        subtitle: form.subtitle,
        endsAt: new Date(form.endsAt).toISOString(),
      });
      const elapsed = Date.now() - start;
      if (elapsed < 500) await delay(500 - elapsed);

      toast.success("Countdown settings updated.");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-line p-10 flex flex-col items-center justify-center text-muted shadow-2xs">
        <Loader2 size={26} className="animate-spin text-accent mb-2.5" />
        <p className="text-sm font-mono font-medium">Loading countdown settings...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-line p-6 shadow-2xs space-y-6"
    >
      <div className="flex items-center gap-3 pb-4 border-b border-line">
        <div className="w-10 h-10 rounded-xl bg-panel text-ink border border-line flex items-center justify-center shrink-0">
          <Clock size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-ink font-heading">Countdown Settings</h3>
          <p className="text-sm text-muted">Configure banner headings and the exact expiration timer for storefront deals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Section Title Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold tracking-wide uppercase text-muted">
            Section Title
          </label>
          <div className="relative">
            <input 
              type="text"
              value={form.title} 
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} 
              placeholder="e.g. Best Deals of the Week"
              className="w-full bg-panel/50 hover:bg-panel focus:bg-white border border-line rounded-xl px-4 py-2.5 text-base font-semibold text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </div>
        </div>
        
        {/* Subtitle / Tagline Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold tracking-wide uppercase text-muted">
            Subtitle / Tagline
          </label>
          <div className="relative">
            <input 
              type="text"
              value={form.subtitle} 
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} 
              placeholder="e.g. Grab them before time runs out!"
              className="w-full bg-panel/50 hover:bg-panel focus:bg-white border border-line rounded-xl px-4 py-2.5 text-base font-semibold text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </div>
        </div>
        
        {/* Ends At (Date & Time) Native Selector Fix */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold tracking-wide uppercase text-muted">
            Ends At (Date & Time) <span className="text-accent">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="datetime-local"
              id="deals-ends-at-picker"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              onClick={(e) => {
                if ("showPicker" in HTMLInputElement.prototype) {
                  try { e.target.showPicker(); } catch {}
                }
              }}
              className="w-full bg-panel/50 hover:bg-panel focus:bg-white border border-line rounded-xl pl-11 pr-4 py-2.5 text-base font-mono font-semibold text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all cursor-pointer [color-scheme:light]"
            />
            <Calendar 
              size={18} 
              className="absolute left-3.5 text-muted pointer-events-none" 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-line/60">
        <button 
          className="px-5 py-2.5 bg-accent text-white rounded-xl text-base font-bold hover:bg-accent-dark transition-all flex items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer" 
          onClick={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? "Saving Settings..." : "Save Countdown Settings"}
        </button>
      </div>
    </motion.div>
  );
}

function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CuratedListManager({ api, label }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const res = await api.list();
      setEntries(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 400) await delay(400 - elapsed);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (productId) => {
    setProcessingId(productId);
    const start = Date.now();
    try {
      await api.remove(productId);
      const elapsed = Date.now() - start;
      if (elapsed < 350) await delay(350 - elapsed);
      toast.success(`Removed from ${label}.`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const move = async (index, direction) => {
    const sorted = [...entries].sort((a, b) => a.displayOrder - b.displayOrder);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    
    [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];
    try {
      await api.reorder(sorted.map((e) => e.productId));
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const sorted = [...entries].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-5 border-b border-line bg-panel/30">
        <div>
          <h2 className="text-base font-extrabold text-ink font-heading">{label}</h2>
          <p className="text-sm text-muted mt-0.5">{sorted.length} product(s) currently active in this collection</p>
        </div>
        <button 
          className="px-4 py-2.5 bg-accent text-white rounded-xl text-base font-bold hover:bg-accent-dark transition-all flex items-center gap-2 shadow-2xs cursor-pointer" 
          onClick={() => setPickerOpen(true)}
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* List / Loading / Empty state */}
      {isLoading ? (
        <div className="p-14 flex flex-col items-center justify-center text-muted">
          <Loader2 size={26} className="animate-spin text-accent mb-2.5" />
          <p className="text-sm font-mono font-medium">Fetching curated items...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="p-10">
          <EmptyState icon={Package} title="No products in this list yet" description={`Add items to feature them in the ${label} section.`} />
        </div>
      ) : (
        <div className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {sorted.map((entry, idx) => (
              <motion.div
                key={entry.id || entry.productId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-panel/40 transition-colors group"
              >
                {/* Index badge */}
                <span className="w-6 text-center text-sm font-mono font-bold text-muted/60">
                  {idx + 1}
                </span>

                {/* Product Thumbnail */}
                {entry.product?.images?.[0]?.imageUrl ? (
                  <img 
                    src={entry.product.images[0].imageUrl} 
                    alt={entry.product.name} 
                    className="w-12 h-12 rounded-xl object-cover bg-panel border border-line shrink-0" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-panel flex items-center justify-center border border-line shrink-0 text-muted">
                    <Package size={20} />
                  </div>
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-ink truncate font-heading">{entry.product?.name || "Unnamed Product"}</p>
                  <p className="text-sm font-mono font-semibold text-muted mt-0.5">{formatCurrency(entry.product?.sellingPrice || 0)}</p>
                </div>

                {/* Action Reorder / Delete Controls */}
                <div className="flex items-center gap-1.5">
                  <button 
                    className="p-2 rounded-xl border border-line text-muted hover:text-ink hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer" 
                    disabled={idx === 0} 
                    onClick={() => move(idx, -1)}
                    title="Move Up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button 
                    className="p-2 rounded-xl border border-line text-muted hover:text-ink hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer" 
                    disabled={idx === sorted.length - 1} 
                    onClick={() => move(idx, 1)}
                    title="Move Down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button 
                    className="p-2 rounded-xl border border-transparent text-muted hover:text-danger hover:bg-dangerLight hover:border-danger/20 transition-all ml-1 cursor-pointer" 
                    onClick={() => handleRemove(entry.productId)}
                    disabled={processingId === entry.productId}
                    title="Remove product"
                  >
                    {processingId === entry.productId ? <Loader2 size={16} className="animate-spin text-danger" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Product Picker Modal */}
      {pickerOpen && (
        <ProductPickerModal
          onClose={() => setPickerOpen(false)}
          existingIds={entries.map((e) => e.productId)}
          onPick={async (productId) => {
            try {
              await api.add(productId);
              toast.success(`Added to ${label}.`);
              setPickerOpen(false);
              load();
            } catch (err) {
              toast.error(getErrorMessage(err));
            }
          }}
        />
      )}
    </div>
  );
}

function ProductPickerModal({ onClose, onPick, existingIds }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      setIsLoading(true);
      const start = Date.now();
      try {
        const res = await productsApi.list({ search, limit: 20 });
        setResults(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        const elapsed = Date.now() - start;
        if (elapsed < 350) await delay(350 - elapsed);
        setIsLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const handlePickProduct = async (id) => {
    setAddingId(id);
    const start = Date.now();
    await onPick(id);
    const elapsed = Date.now() - start;
    if (elapsed < 350) await delay(350 - elapsed);
    setAddingId(null);
  };

  return (
    <Modal open onClose={onClose} title={<span className="text-lg font-bold font-heading">Add Product to List</span>} size="lg">
      <div className="space-y-4">
        {/* Search Input with styled panel background */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            className="w-full bg-panel/50 hover:bg-panel focus:bg-white border border-line rounded-xl pl-10 pr-4 py-3 text-base font-body text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
            placeholder="Search products by title, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Results List */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted">
            <Loader2 size={24} className="animate-spin text-accent mb-2" />
            <p className="text-sm font-mono">Searching catalog...</p>
          </div>
        ) : results.length === 0 ? (
          <EmptyState title="No products found" description="Try adjusting your search query." />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {results.map((p) => {
              const already = existingIds.includes(p.id);
              const isAddingThis = addingId === p.id;
              return (
                <button
                  key={p.id}
                  disabled={already || isAddingThis}
                  onClick={() => handlePickProduct(p.id)}
                  className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-panel border border-transparent hover:border-line disabled:opacity-50 disabled:cursor-not-allowed text-left transition-all cursor-pointer group"
                >
                  {p.images?.[0]?.imageUrl ? (
                    <img src={p.images[0].imageUrl} alt={p.name} className="w-11 h-11 rounded-xl object-cover bg-panel border border-line shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-panel flex items-center justify-center border border-line shrink-0 text-muted">
                      <Package size={18} />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-ink truncate font-heading group-hover:text-accent transition-colors">{p.name}</p>
                    <p className="text-sm font-mono text-muted">{formatCurrency(p.sellingPrice)}</p>
                  </div>

                  {isAddingThis ? (
                    <Loader2 size={18} className="animate-spin text-accent" />
                  ) : already ? (
                    <span className="text-xs font-semibold text-muted bg-panel border border-line px-2.5 py-1 rounded-lg">
                      Already in List
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <ListPlus size={14} /> Add Item
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}