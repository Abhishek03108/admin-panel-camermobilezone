import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Image as ImageIcon,
  HelpCircle,
  MessageSquareQuote,
  Loader2,
  X,
  UploadCloud,
  CheckCircle2,
  EyeOff
} from "lucide-react";
import { testimonialsApi, faqsApi, heroBannersApi } from "../../api/content.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Badge from "../../components/common/Badge.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { Field, Input, Textarea, Checkbox } from "../../components/common/FormField.jsx";
import ImageUploader from "../../components/common/ImageUploader.jsx";

const TABS = ["Testimonials", "FAQs", "Hero Banners"];

// Helper for smooth minimal loader delay to prevent layout flickering
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ContentPage() {
  const [tab, setTab] = useState("Testimonials");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="font-body text-ink max-w-6xl mx-auto space-y-6"
    >
      <Seo title="Site Content" description="Manage testimonials, FAQs, and homepage hero banners." />
      <PageHeader
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Site Content</span>}
        description="Configure storefront testimonials, dynamic FAQ accordion lists, and hero banner sliders."
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-line bg-panel/30 p-1 rounded-2xl max-w-md">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              tab === t
                ? "bg-white text-ink shadow-2xs border border-line"
                : "text-muted hover:text-ink hover:bg-panel/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "Testimonials" && <TestimonialsTab />}
          {tab === "FAQs" && <FaqsTab />}
          {tab === "Hero Banners" && <HeroBannersTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// Testimonials Tab
// ---------------------------------------------------------------------
function TestimonialsTab() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const res = await testimonialsApi.list();
      setItems(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 350) await delay(350 - elapsed);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-line shadow-2xs">
        <Loader2 size={24} className="animate-spin text-accent mb-2" />
        <span className="text-xs font-mono text-muted">Loading testimonials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-muted">Total Reviews: {items.length}</span>
        <button
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-accent text-white hover:bg-accent/90 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
          onClick={() => setModal(null)}
        >
          <Plus size={15} /> Add Testimonial
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-line shadow-2xs p-8">
          <EmptyState icon={MessageSquareQuote} title="No testimonials configured" description="Add customer reviews to showcase social proof on the homepage." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-line shadow-2xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {t.avatarUrl ? (
                      <img src={t.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover bg-panel border border-line" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent font-heading font-extrabold flex items-center justify-center text-sm border border-accent/20">
                        {t.customerName?.[0] || "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-base font-bold font-heading text-ink">{t.customerName}</p>
                      <p className="text-xs font-mono text-muted">{t.location || "Verified Buyer"}</p>
                    </div>
                  </div>
                  <Badge tone={t.isActive ? "verify" : "neutral"}>
                    {t.isActive ? "Active" : "Hidden"}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-accent mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < t.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                  ))}
                </div>

                <p className="text-sm text-ink/80 leading-relaxed mt-2.5 line-clamp-3 font-body">{t.comment}</p>
                {t.productName && (
                  <div className="mt-3 text-xs font-mono text-muted bg-panel/50 px-2.5 py-1 rounded-lg inline-block border border-line/50">
                    Product: <span className="font-semibold text-ink">{t.productName}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-line">
                <button
                  className="p-2 rounded-xl border border-line text-muted hover:text-accent hover:border-accent/40 hover:bg-panel transition-all cursor-pointer"
                  onClick={() => setModal(t)}
                  title="Edit Testimonial"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="p-2 rounded-xl border border-line text-muted hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-all cursor-pointer"
                  onClick={() => setDeleteTarget(t)}
                  title="Delete Testimonial"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== undefined && (
        <TestimonialModal testimonial={modal} onClose={() => setModal(undefined)} onSaved={load} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Testimonial?"
        description={`The testimonial review from "${deleteTarget?.customerName}" will be permanently removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          try {
            await testimonialsApi.remove(deleteTarget.id);
            toast.success("Testimonial removed.");
            setDeleteTarget(null);
            load();
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}

function TestimonialModal({ testimonial, onClose, onSaved }) {
  const isEdit = !!testimonial;
  const [form, setForm] = useState({
    customerName: testimonial?.customerName || "",
    location: testimonial?.location || "",
    rating: testimonial?.rating || 5,
    comment: testimonial?.comment || "",
    productName: testimonial?.productName || "",
    avatarUrl: testimonial?.avatarUrl || "",
    displayOrder: testimonial?.displayOrder ?? 0,
    isActive: testimonial?.isActive ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (!form.customerName.trim() || !form.comment.trim()) {
      toast.error("Customer name and comment body are required.");
      return;
    }
    setIsSaving(true);
    try {
      if (isEdit) {
        await testimonialsApi.update(testimonial.id, form);
        toast.success("Testimonial updated.");
      } else {
        await testimonialsApi.create(form);
        toast.success("Testimonial created.");
      }
      onSaved();
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
      title={isEdit ? "Edit Testimonial" : "Create Testimonial"}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button className="py-2 px-4 rounded-xl border border-line text-xs font-semibold hover:bg-panel transition-all cursor-pointer" onClick={onClose}>
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-accent text-white hover:bg-accent/90 font-semibold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>{isSaving ? "Saving..." : "Save Testimonial"}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Customer Name" required>
            <Input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="e.g. Sarah Jenkins" />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. New York, USA" />
          </Field>
        </div>

        <Field label="Rating (1-5 Stars)" required>
          <Input
            type="number"
            min={1}
            max={5}
            value={form.rating}
            onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
          />
        </Field>

        <Field label="Testimonial Body" required>
          <Textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Enter customer feedback..." rows={3} />
        </Field>

        <Field label="Associated Product Name">
          <Input value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} placeholder="e.g. Premium Leather Tote" />
        </Field>

        <ImageUploader
          label="Avatar Image"
          value={form.avatarUrl}
          folder="testimonials"
          onUploaded={(res) => setForm((f) => ({ ...f, avatarUrl: res?.url || "" }))}
        />

        {isEdit && (
          <div className="pt-2">
            <Checkbox label="Active (Visible on storefront)" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------
// FAQs Tab
// ---------------------------------------------------------------------
function FaqsTab() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const res = await faqsApi.list();
      setItems(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 350) await delay(350 - elapsed);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-line shadow-2xs">
        <Loader2 size={24} className="animate-spin text-accent mb-2" />
        <span className="text-xs font-mono text-muted">Loading FAQ entries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-muted">Total Questions: {items.length}</span>
        <button
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-accent text-white hover:bg-accent/90 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
          onClick={() => setModal(null)}
        >
          <Plus size={15} /> Add FAQ
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-line shadow-2xs p-8">
          <EmptyState icon={HelpCircle} title="No FAQs created yet" description="Create frequently asked questions to answer common store customer inquiries." />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-line shadow-2xs divide-y divide-line overflow-hidden">
          {items.map((f) => (
            <div key={f.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-panel/20 transition-colors">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold font-heading text-ink">{f.question}</p>
                  <Badge tone={f.isActive ? "verify" : "neutral"}>
                    {f.isActive ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <p className="text-sm text-muted leading-relaxed line-clamp-2">{f.answer}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  className="p-2 rounded-xl border border-line text-muted hover:text-accent hover:border-accent/40 hover:bg-panel transition-all cursor-pointer"
                  onClick={() => setModal(f)}
                  title="Edit FAQ"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="p-2 rounded-xl border border-line text-muted hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-all cursor-pointer"
                  onClick={() => setDeleteTarget(f)}
                  title="Delete FAQ"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== undefined && <FaqModal faq={modal} onClose={() => setModal(undefined)} onSaved={load} />}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete FAQ?"
        description={`The question "${deleteTarget?.question}" will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          try {
            await faqsApi.remove(deleteTarget.id);
            toast.success("FAQ entry deleted.");
            setDeleteTarget(null);
            load();
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}

function FaqModal({ faq, onClose, onSaved }) {
  const isEdit = !!faq;
  const [form, setForm] = useState({
    question: faq?.question || "",
    answer: faq?.answer || "",
    displayOrder: faq?.displayOrder ?? 0,
    isActive: faq?.isActive ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }
    setIsSaving(true);
    try {
      if (isEdit) {
        await faqsApi.update(faq.id, form);
        toast.success("FAQ updated.");
      } else {
        await faqsApi.create(form);
        toast.success("FAQ created.");
      }
      onSaved();
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
      title={isEdit ? "Edit FAQ Item" : "Create FAQ Item"}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button className="py-2 px-4 rounded-xl border border-line text-xs font-semibold hover:bg-panel transition-all cursor-pointer" onClick={onClose}>
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-accent text-white hover:bg-accent/90 font-semibold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>{isSaving ? "Saving..." : "Save FAQ"}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Question Title" required>
          <Input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="e.g. What is your return policy?" />
        </Field>

        <Field label="Answer Text" required>
          <Textarea value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} placeholder="Provide a detailed response..." rows={4} />
        </Field>

        <Field label="Display Priority Order">
          <Input
            type="number"
            value={form.displayOrder}
            onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
          />
        </Field>

        {isEdit && (
          <div className="pt-2">
            <Checkbox label="Active (Visible in FAQ section)" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------
// Hero Banners Tab
// ---------------------------------------------------------------------
function HeroBannersTab() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const res = await heroBannersApi.list();
      setItems(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 350) await delay(350 - elapsed);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      await heroBannersApi.create(file, true);
      toast.success("Hero banner uploaded successfully.");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const toggleActive = async (banner) => {
    try {
      await heroBannersApi.update(banner.id, { isActive: !banner.isActive });
      toast.success(banner.isActive ? "Banner hidden from homepage." : "Banner activated on storefront.");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-line shadow-2xs">
        <Loader2 size={24} className="animate-spin text-accent mb-2" />
        <span className="text-xs font-mono text-muted">Loading hero banners...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Drag Drop Area */}
      <label className="flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-2xl border-2 border-dashed border-line bg-panel/30 hover:bg-panel/60 hover:border-accent/50 transition-all cursor-pointer text-center group">
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-accent" />
            <span className="text-xs font-mono font-semibold text-muted">Uploading hero image asset...</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-white border border-line flex items-center justify-center text-accent shadow-2xs group-hover:scale-105 transition-transform">
              <UploadCloud size={20} />
            </div>
            <div>
              <p className="text-sm font-bold font-heading text-ink">Upload Hero Banner</p>
              <p className="text-xs font-mono text-muted mt-0.5">Click to choose image (PNG, JPG, WebP supported)</p>
            </div>
          </>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          disabled={isUploading}
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
      </label>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-line shadow-2xs p-8">
          <EmptyState icon={ImageIcon} title="No hero banners configured" description="Upload banner images to display in the main homepage hero slider." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden flex flex-col justify-between">
              <div className="relative group aspect-video bg-panel overflow-hidden">
                <img src={b.imageUrl} alt="Hero Banner" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>

              <div className="p-4 flex items-center justify-between border-t border-line bg-panel/20">
                <button 
                  onClick={() => toggleActive(b)}
                  className="cursor-pointer"
                  title="Toggle Display Status"
                >
                  <Badge tone={b.isActive ? "verify" : "neutral"}>
                    <span className="flex items-center gap-1">
                      {b.isActive ? <CheckCircle2 size={12} /> : <EyeOff size={12} />}
                      {b.isActive ? "Active Banner" : "Hidden"}
                    </span>
                  </Badge>
                </button>

                <button
                  className="p-2 rounded-xl border border-line text-muted hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-all cursor-pointer"
                  onClick={() => setDeleteTarget(b)}
                  title="Delete Banner"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Hero Banner?"
        description="This hero banner image asset will be permanently removed from the homepage slider."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          try {
            await heroBannersApi.remove(deleteTarget.id);
            toast.success("Banner asset removed.");
            setDeleteTarget(null);
            load();
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}