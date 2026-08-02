import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { deliveriesApi } from "../../api/deliveries.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDate } from "../../utils/formatters.js";
import { DELIVERY_STATUSES } from "../../utils/constants.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import { Select } from "../../components/common/FormField.jsx";

const TONE = {
  "Not Dispatched": "neutral",
  Packed: "accent",
  Shipped: "accent",
  "Out For Delivery": "accent",
  Delivered: "verify",
  "Delivery Failed": "danger",
  Returned: "danger",
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      const res = await deliveriesApi.list(params);
      setDeliveries(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      <Seo title="Deliveries" description="Track courier and delivery status for every order." />
      <PageHeader title="Deliveries" description="Edit courier/tracking details from an order's detail page." />

      <div className="card">
        <div className="flex items-center gap-2 p-4 border-b border-line">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-56">
            <option value="">All delivery statuses</option>
            {DELIVERY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          isLoading={isLoading}
          rows={deliveries}
          emptyTitle="No deliveries found"
          columns={[
            {
              key: "order",
              header: "Order",
              render: (d) => (
                <Link to={`/orders/${d.order?.id}`} className="text-sm text-accent-dark hover:underline flex items-center gap-1">
                  {d.order?.publicId} <ExternalLink size={11} />
                </Link>
              ),
            },
            {
              key: "location",
              header: "Location",
              render: (d) => (
                <span className="text-sm text-muted">
                  {d.order?.shippingCity}, {d.order?.shippingCountry}
                </span>
              ),
            },
            {
              key: "courier",
              header: "Courier",
              render: (d) => <span className="text-sm text-ink">{d.courierName || "—"}</span>,
            },
            {
              key: "tracking",
              header: "Tracking #",
              render: (d) => <span className="text-sm text-ink">{d.trackingNumber || "—"}</span>,
            },
            {
              key: "eta",
              header: "Est. delivery",
              render: (d) => <span className="text-sm text-muted">{d.estimatedDeliveryDate ? formatDate(d.estimatedDeliveryDate) : "—"}</span>,
            },
            {
              key: "status",
              header: "Status",
              render: (d) => <Badge tone={TONE[d.status] || "neutral"}>{d.status}</Badge>,
            },
          ]}
        />
      </div>
    </div>
  );
}
