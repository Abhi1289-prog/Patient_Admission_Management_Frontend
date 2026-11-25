import { useCallback, useEffect, useMemo, useState } from "react";
import { patientApi } from "./api/patientApi";
import PatientFormModal from "./components/PatientFormModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

const EMPTY_LOOKUPS = {
  wards: [],
  departments: [],
  doctors: [],
  genders: ["MALE", "FEMALE", "OTHER"],
  statuses: ["ADMITTED", "DISCHARGED"],
};

export default function App() {
  const [lookups, setLookups] = useState(EMPTY_LOOKUPS);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filters
  const [searchInput, setSearchInput] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [wardId, setWardId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load dropdown options once
  useEffect(() => {
    patientApi
      .getLookups()
      .then((data) => setLookups(data))
      .catch(() => setError("Could not connect to backend. Make sure the Spring Boot server is running."));
  }, []);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await patientApi.getPatients({
        name: debouncedName,
        wardId,
        departmentId,
        doctorId,
      });
      setPatients(data);
    } catch (err) {
      setError(err.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [debouncedName, wardId, departmentId, doctorId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const stats = useMemo(() => {
    const admitted = patients.filter((p) => p.status === "ADMITTED").length;
    return {
      total: patients.length,
      admitted,
      discharged: patients.length - admitted,
    };
  }, [patients]);

  const handleSavePatient = async (payload) => {
    if (editingPatient) {
      await patientApi.updatePatient(editingPatient.id, payload);
    } else {
      await patientApi.createPatient(payload);
    }
    await fetchPatients();
  };

  const handleDischarge = async (patient) => {
    try {
      await patientApi.dischargePatient(patient.id);
      await fetchPatients();
    } catch (err) {
      setError(err.message || "Failed to discharge patient");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPatient) return;
    setDeleting(true);
    try {
      await patientApi.deletePatient(deletingPatient.id);
      setDeletingPatient(null);
      await fetchPatients();
    } catch (err) {
      setError(err.message || "Failed to delete patient");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setWardId("");
    setDepartmentId("");
    setDoctorId("");
  };

  const hasActiveFilters = searchInput || wardId || departmentId || doctorId;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Patient Admission Management</h1>
          <p className="subtitle">Manage admitted patients, wards, departments, and discharges</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingPatient(null);
            setFormOpen(true);
          }}
        >
          + Admit Patient
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Showing Patients</span>
          <strong className="stat-value">{stats.total}</strong>
        </div>
        <div className="stat-card stat-admitted">
          <span className="stat-label">Currently Admitted</span>
          <strong className="stat-value">{stats.admitted}</strong>
        </div>
        <div className="stat-card stat-discharged">
          <span className="stat-label">Discharged</span>
          <strong className="stat-value">{stats.discharged}</strong>
        </div>
      </section>

      <section className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Search patient by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <select value={wardId} onChange={(e) => setWardId(e.target.value)}>
          <option value="">All Wards</option>
          {lookups.wards.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All Departments</option>
          {lookups.departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">All Doctors</option>
          {lookups.doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>{doc.name}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button type="button" className="btn-ghost" onClick={clearFilters}>
            Reset
          </button>
        )}
      </section>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className="empty-state">
          <p>No patients found{hasActiveFilters ? " matching your filters" : ""}.</p>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table */}
          <div className="table-wrapper desktop-only">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age / Gender</th>
                  <th>Ward</th>
                  <th>Department</th>
                  <th>Doctor</th>
                  <th>Admission Date</th>
                  <th>Status</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td>{p.age} yrs · {p.gender.charAt(0) + p.gender.slice(1).toLowerCase()}</td>
                    <td>{p.wardName}</td>
                    <td>{p.departmentName}</td>
                    <td>{p.doctorName}</td>
                    <td>{p.admissionDate}</td>
                    <td>
                      <span className={`badge ${p.status === "ADMITTED" ? "badge-admitted" : "badge-discharged"}`}>
                        {p.status === "ADMITTED" ? "Admitted" : "Discharged"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {p.status === "ADMITTED" && (
                        <button type="button" className="btn-sm btn-success" onClick={() => handleDischarge(p)}>
                          Discharge
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-sm btn-outline"
                        onClick={() => {
                          setEditingPatient(p);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-danger-outline"
                        onClick={() => setDeletingPatient(p)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="mobile-cards mobile-only">
            {patients.map((p) => (
              <div key={p.id} className="patient-card">
                <div className="card-top">
                  <div>
                    <h3>{p.name}</h3>
                    <span className="muted">{p.age} yrs · {p.gender.charAt(0) + p.gender.slice(1).toLowerCase()}</span>
                  </div>
                  <span className={`badge ${p.status === "ADMITTED" ? "badge-admitted" : "badge-discharged"}`}>
                    {p.status === "ADMITTED" ? "Admitted" : "Discharged"}
                  </span>
                </div>
                <div className="card-details">
                  <div><span>Ward:</span> {p.wardName}</div>
                  <div><span>Department:</span> {p.departmentName}</div>
                  <div><span>Doctor:</span> {p.doctorName}</div>
                  <div><span>Admitted:</span> {p.admissionDate}</div>
                </div>
                <div className="card-actions">
                  {p.status === "ADMITTED" && (
                    <button type="button" className="btn-sm btn-success" onClick={() => handleDischarge(p)}>
                      Discharge
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-sm btn-outline"
                    onClick={() => {
                      setEditingPatient(p);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-sm btn-danger-outline"
                    onClick={() => setDeletingPatient(p)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <PatientFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSavePatient}
        lookups={lookups}
        initialData={editingPatient}
      />

      <DeleteConfirmModal
        patient={deletingPatient}
        onCancel={() => setDeletingPatient(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}