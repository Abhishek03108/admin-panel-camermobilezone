/** Labels for users.deactivationReason. */
export const DEACTIVATION_LABEL = {
  FAKE_PAYMENT: { text: "Fake payment screenshot", tone: "danger" },
  ADMIN: { text: "Deactivated by admin", tone: "accent" },
  SELF: { text: "Deactivated by customer", tone: "neutral" },
  DELETED: { text: "Deleted by customer", tone: "neutral" },
};

export const deactivationLabel = (reason) => DEACTIVATION_LABEL[reason] || { text: "Deactivated", tone: "neutral" };
