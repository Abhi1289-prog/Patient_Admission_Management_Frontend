import { useEffect, useState } from "react";

const getTodayLocal = () => new Date().toLocaleDateString("en-CA");

const INITIAL_FORM = {
  name: "",
  age: "",
  gender: "",
  wardId: "",
  departmentId: "",
  doctorId: "",
  admissionDate: getTodayLocal(),
  status: "ADMITTED",
};

export default function PatientFormModal({ isOpen, onClose, onSubmit, lookups, initialData }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setServerError("");
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        age: String(initialData.age ?? ""),
        gender: initialData.gender ?? "",
        wardId: String(initialData.wardId ?? ""),
        departmentId: String(initialData.departmentId ?? ""),
        doctorId: String(initialData.doctorId ?? ""),
        admissionDate: initialData.admissionDate ?? getTodayLocal(),
        status: initialData.status ?? "ADMITTED",
      });
    } else {
      setForm({ ...INITIAL_FORM, admissionDate: getTodayLocal() });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const next = {};
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      next.name = "Name is required";
    } else if (!/^[A-Za-z ]+$/.test(trimmedName)) {
      next.name = "Name must contain letters only";
    }

    if (form.age === "" || form.age === null) {
      next.age = "Age is required";
    } else {
      const ageNum = Number(form.age);
      if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) {
        next.age = "Age must be a whole number between 0 and 120";
      }
    }

    if (!form.gender) next.gender = "Gender is required";
    if (!form.wardId) next.wardId = "Ward is required";
    if (!form.departmentId) next.departmentId = "Department is required";
    if (!form.doctorId) next.doctorId = "Doctor is required";

    if (!form.admissionDate) {
      next.admissionDate = "Admission date is required";
    } else if (form.admissionDate > getTodayLocal()) {
      next.admissionDate = "Admission date cannot be a future date";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        wardId: Number(form.wardId),
        departmentId: Number(form.departmentId),
        doctorId: Number(form.doctorId),
        admissionDate: form.admissionDate,
        status: form.status,
      });
      onClose();
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      }
      setServerError(err.message || "Failed to save patient");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Patient" : "Admit New Patient"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {serverError && <div className="alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <div className="form-field full-span">
            <label>Patient Name *</label>
            <input
              type="text"
              placeholder="e.g. Ananya Sharma"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-field">
            <label>Age *</label>
            <input
              type="number"
              min="0"
              max="120"
              placeholder="0 - 120"
              value={form.age}
              onChange={(e) => handleChange("age", e.target.value)}
            />
            {errors.age && <span className="field-error">{errors.age}</span>}
          </div>

          <div className="form-field">
            <label>Gender *</label>
            <select value={form.gender} onChange={(e) => handleChange("gender", e.target.value)}>
              <option value="">Select gender</option>
              {lookups.genders.map((g) => (
                <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>
              ))}
            </select>
            {errors.gender && <span className="field-error">{errors.gender}</span>}
          </div>

          <div className="form-field">
            <label>Ward *</label>
            <select value={form.wardId} onChange={(e) => handleChange("wardId", e.target.value)}>
              <option value="">Select ward</option>
              {lookups.wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {errors.wardId && <span className="field-error">{errors.wardId}</span>}
          </div>

          <div className="form-field">
            <label>Department *</label>
            <select value={form.departmentId} onChange={(e) => handleChange("departmentId", e.target.value)}>
              <option value="">Select department</option>
              {lookups.departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.departmentId && <span className="field-error">{errors.departmentId}</span>}
          </div>

          <div className="form-field">
            <label>Doctor *</label>
            <select value={form.doctorId} onChange={(e) => handleChange("doctorId", e.target.value)}>
              <option value="">Select doctor</option>
              {lookups.doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
            {errors.doctorId && <span className="field-error">{errors.doctorId}</span>}
          </div>

          <div className="form-field">
            <label>Admission Date *</label>
            <input
              type="date"
              max={getTodayLocal()}
              value={form.admissionDate}
              onChange={(e) => handleChange("admissionDate", e.target.value)}
            />
            {errors.admissionDate && <span className="field-error">{errors.admissionDate}</span>}
          </div>

          {isEdit && (
            <div className="form-field full-span">
              <label>Status</label>
              <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                {lookups.statuses.map((s) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
          )}

          <div className="modal-actions full-span">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update Patient" : "Admit Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}