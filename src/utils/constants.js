// Mirrors backend `src/constants/enums.js` exactly — keep in sync.

export const CONDITION_GRADES = [
  "Grade A+ (Like New)",
  "Grade A (Excellent)",
  "Grade B (Very Good)",
];

export const PAYMENT_STATUSES = ["Pending", "Verified", "Rejected"];

export const ORDER_STATUSES = [
  "Payment Verification Pending",
  "Payment Verified",
  "Order Confirmed",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
];

export const NEXT_ORDER_STATUSES = [
  "Order Confirmed",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
];

export const DELIVERY_STATUSES = [
  "Not Dispatched",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Delivery Failed",
  "Returned",
];

export const COUNTRY_CODES = ["Nepal", "India"];

export const CONTACT_REASONS = [
  "Order Support",
  "Product Enquiry",
  "Warranty Claim",
  "Bulk / Corporate Order",
  "Sell Your Device",
  "Other",
];
