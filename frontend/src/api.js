const API_BASE = "http://localhost:8000/api/v1";

export function getStoredToken() {
  return localStorage.getItem("brightloop_token");
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem("brightloop_token", token);
  } else {
    localStorage.removeItem("brightloop_token");
  }
}

export function getStoredUser() {
  const u = localStorage.getItem("brightloop_user");
  try {
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem("brightloop_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("brightloop_user");
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || JSON.stringify(errorJson);
    } catch (e) {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => request("/auth/me"),
  forgotPassword: (email) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, new_password) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),

  
  getUsers: (role) => request(`/users/${role ? `?role=${role}` : ""}`),
  getCustomers: () => request("/users/customers"),
  createStaff: (data) =>
    request("/users/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  toggleUserStatus: (id) =>
    request(`/users/${id}/toggle-status`, { method: "PATCH" }),

  
  getProducts: (includeArchived = false) =>
    request(`/products/?include_archived=${includeArchived}`),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) =>
    request("/products/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProduct: (id, data) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  archiveProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),
  addVariant: (productId, data) =>
    request(`/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  archiveVariant: (variantId) =>
    request(`/products/variants/${variantId}`, { method: "DELETE" }),

  
  getPlans: (includeInactive = false) =>
    request(`/plans/?include_inactive=${includeInactive}`),
  getPlan: (id) => request(`/plans/${id}`),
  createPlan: (data) =>
    request("/plans/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePlan: (id, data) =>
    request(`/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  togglePlanActive: (id) => request(`/plans/${id}`, { method: "DELETE" }),

  
  getTaxes: () => request("/taxes/"),
  createTax: (data) =>
    request("/taxes/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteTax: (id) => request(`/taxes/${id}`, { method: "DELETE" }),

  
  getDiscounts: () => request("/discounts/"),
  createDiscount: (data) =>
    request("/discounts/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteDiscount: (id) => request(`/discounts/${id}`, { method: "DELETE" }),

  
  getTemplates: () => request("/quotations/templates"),
  createTemplate: (data) =>
    request("/quotations/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteTemplate: (id) =>
    request(`/quotations/templates/${id}`, { method: "DELETE" }),

  getQuotations: (statusFilter) =>
    request(`/quotations/${statusFilter ? `?status_filter=${statusFilter}` : ""}`),
  getQuotation: (id) => request(`/quotations/${id}`),
  createQuotation: (data) =>
    request("/quotations/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateQuotationStatus: (id, status) =>
    request(`/quotations/${id}/status?status=${status}`, { method: "PATCH" }),
  convertQuotation: (id) =>
    request(`/quotations/${id}/convert`, { method: "POST" }),

  
  getSubscriptions: (statusFilter) =>
    request(`/subscriptions/${statusFilter ? `?status_filter=${statusFilter}` : ""}`),
  getSubscription: (id) => request(`/subscriptions/${id}`),
  createSubscription: (data) =>
    request("/subscriptions/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSubscriptionStatus: (id, status, notes) =>
    request(`/subscriptions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    }),
  renewSubscription: (id) =>
    request(`/subscriptions/${id}/renew`, { method: "POST" }),

  
  getInvoices: (statusFilter) =>
    request(`/invoices/${statusFilter ? `?status_filter=${statusFilter}` : ""}`),
  getInvoice: (id) => request(`/invoices/${id}`),
  updateInvoiceStatus: (id, newStatus) =>
    request(`/invoices/${id}/status?new_status=${newStatus}`, { method: "PATCH" }),
  generateDueInvoices: () => request("/invoices/generate-due", { method: "POST" }),

  
  getPayments: (invoiceId) =>
    request(`/payments/${invoiceId ? `?invoice_id=${invoiceId}` : ""}`),
  recordPayment: (data) =>
    request("/payments/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  
  getDashboardSummary: (startDate, endDate) => {
    let q = "";
    if (startDate && endDate) q = `?start_date=${startDate}&end_date=${endDate}`;
    return request(`/reports/dashboard${q}`);
  },
  getPlanDistribution: () => request("/reports/plan-distribution"),
  getMonthlyCollections: () => request("/reports/monthly-collections"),
  getOverdueInvoices: () => request("/reports/overdue-invoices"),

  
  runBillingJob: (asOfDate) => {
    const q = asOfDate ? `?as_of_date=${asOfDate}` : "";
    return request(`/billing/run-job${q}`, { method: "POST" });
  },
  getBillingLogs: () => request("/billing/logs"),
};
