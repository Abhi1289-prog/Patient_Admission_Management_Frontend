const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.fieldErrors = data.errors || {};
    throw error;
  }
  return data;
}

export const patientApi = {
  getLookups: () => request("/api/lookups"),

  getPatients: ({ name, wardId, departmentId, doctorId } = {}) => {
    const params = new URLSearchParams();
    if (name?.trim()) params.set("name", name.trim());
    if (wardId) params.set("wardId", wardId);
    if (departmentId) params.set("departmentId", departmentId);
    if (doctorId) params.set("doctorId", doctorId);
    const query = params.toString();
    return request(`/api/patients${query ? `?${query}` : ""}`);
  },

  createPatient: (payload) =>
    request("/api/patients", { method: "POST", body: JSON.stringify(payload) }),

  updatePatient: (id, payload) =>
    request(`/api/patients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  dischargePatient: (id) =>
    request(`/api/patients/${id}/discharge`, { method: "PATCH" }),

  deletePatient: (id) =>
    request(`/api/patients/${id}`, { method: "DELETE" }),
};