import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  Tag,
  Layers,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { productsApi } from "../../api/products.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";

// Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

export default function ProductsListPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = async (p = page) => {
    setIsLoading(true);
    try {
      const res = await productsApi.list({ page: p, limit: 15 });
      setProducts(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 text-gray-900"
    >
      <Seo title="Products" description="Manage the product catalog." />

      <PageHeader
        title="Product Catalog"
        description="Every field shown on the storefront — pricing, specs, inspection reports, and media."
        actions={
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA6A0A] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus size={16} /> New Product
          </Link>
        }
      />

      {/* Main Table Card */}
      <motion.div
        variants={cardVariants}
        className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden"
      >
        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              className="w-full text-xs font-medium text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all outline-none"
              placeholder="Search catalog by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {meta && (
            <span className="text-xs font-semibold text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100">
              Showing {filtered.length} of {meta.totalItems || products.length} Items
            </span>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          isLoading={isLoading}
          rows={filtered}
          emptyTitle="No products found"
          emptyDescription="Add your first product to start populating the store catalog."
          columns={[
            {
              key: "product",
              header: "Product Detail",
              render: (p) => (
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  {p.images?.[0]?.imageUrl ? (
                    <img
                      src={p.images[0].imageUrl}
                      alt={p.name}
                      className="w-11 h-11 rounded-xl object-cover bg-gray-50 border border-gray-100 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <Package size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 line-clamp-1">
                      {p.name}
                    </p>
                    <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mt-0.5">
                      <Tag size={11} className="text-gray-300" />
                      {p.brand?.name || "Unbranded"}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "category",
              header: "Category",
              render: (p) => (
                <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Layers size={13} className="text-gray-400" />
                  <span>
                    {p.category?.name || "—"}
                    {p.subCategory && (
                      <span className="text-gray-400"> / {p.subCategory.name}</span>
                    )}
                  </span>
                </div>
              ),
            },
            {
              key: "price",
              header: "Pricing",
              render: (p) => (
                <div>
                  <p className="text-xs font-extrabold text-gray-900 font-heading">
                    {formatCurrency(p.sellingPrice)}
                  </p>
                  {p.originalPrice && p.originalPrice > p.sellingPrice && (
                    <p className="text-[11px] font-medium text-gray-400 line-through">
                      {formatCurrency(p.originalPrice)}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "stock",
              header: "Stock Level",
              render: (p) => (
                <Badge
                  tone={
                    p.stock === 0
                      ? "danger"
                      : p.stock < 5
                      ? "accent"
                      : "verify"
                  }
                >
                  {p.stock === 0 ? "Out of Stock" : `${p.stock} units`}
                </Badge>
              ),
            },
            {
              key: "status",
              header: "Visibility",
              render: (p) => (
                <Badge tone={p.isActive ? "verify" : "neutral"}>
                  {p.isActive ? "Active" : "Hidden"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              headClassName: "text-right",
              className: "text-right",
              render: (p) => (
                <div className="flex justify-end items-center gap-1">
                  <Link
                    to={`/products/${p.id}`}
                    className="p-2 text-gray-500 hover:text-[#F97316] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Product"
                  >
                    <Pencil size={15} />
                  </Link>
                  <button
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    onClick={() => setDeleteTarget(p)}
                    title="Delete Product"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
        />

        <div className="p-4 border-t border-gray-100">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Product?"
        description={`"${deleteTarget?.name}" along with its images, specifications, and associated customer reviews will be permanently removed.`}
        confirmLabel="Delete Product"
        onConfirm={async () => {
          try {
            await productsApi.remove(deleteTarget.id);
            toast.success("Product deleted successfully.");
            setDeleteTarget(null);
            load();
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        }}
      />
    </motion.div>
  );
}