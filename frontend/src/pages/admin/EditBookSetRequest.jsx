import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout.jsx";
import Toast from "../../components/admin/shared/Toast";
import PageHeader from "../../components/admin/shared/PageHeader";
import LoadingSpinner from "../../components/admin/shared/LoadingSpinner";
import ErrorMessage from "../../components/admin/shared/ErrorMessage";
import BookSetForm from "../../components/admin/booksets/BookSetForm";
import { useToast } from "../../hooks/useToast";
import { API_URL } from "../../utils/api.js";

const API = API_URL;
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function EditBookSetRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const { toast, showToast, clearToast } = useToast();

  const [formData, setFormData] = useState({
    school_name: "",
    grade: "",
    items: [],
  });

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const r = await axios.get(`${API}/admin/book-set-requests/${id}`, { headers: authH() });
      const req = r.data.request;
      setFormData({
        school_name: req.school_name || "",
        grade: req.grade || "",
        items: (req.items || []).map((item) => ({
          book_title: item.book_title || item.title || "",
          subject_name: item.subject_name || "",
          author: item.author || "",
          publisher: item.publisher || "",
          publication_year: item.publication_year || new Date().getFullYear(),
          isbn: item.isbn || "",
          estimated_price: item.estimated_price ?? item.price ?? "",
        })),
      });
    } catch (e) {
      setLoadError(e.response?.data?.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          book_title: "",
          subject_name: "",
          author: "",
          publisher: "",
          publication_year: new Date().getFullYear(),
          isbn: "",
          estimated_price: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      showToast("At least one book is required", "error");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.school_name.trim()) {
      showToast("School name is required", "error");
      return;
    }
    if (!formData.grade) {
      showToast("Grade is required", "error");
      return;
    }
    if (formData.items.length === 0) {
      showToast("At least one book is required", "error");
      return;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.book_title?.trim()) {
        showToast(`Book title is required for item ${i + 1}`, "error");
        return;
      }
      if (!item.subject_name?.trim()) {
        showToast(`Subject is required for item ${i + 1}`, "error");
        return;
      }
      if (!item.estimated_price || Number(item.estimated_price) <= 0) {
        showToast(`Valid estimated price is required for item ${i + 1}`, "error");
        return;
      }
    }

    setSaving(true);
    try {
      const total = formData.items.reduce((sum, item) => sum + Number(item.estimated_price), 0);
      await axios.put(
        `${API}/admin/book-set-requests/${id}`,
        { ...formData, total_estimated_price: total },
        { headers: authH() }
      );
      showToast("Book set request updated successfully");
      setTimeout(() => navigate(`/admin/book-set-requests/${id}`), 1200);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to update request", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout activeTab="book-sets">
        <LoadingSpinner message="Loading request…" />
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout activeTab="book-sets">
        <ErrorMessage
          error={loadError}
          backPath="/admin-dashboard"
          backState={{ tab: "book-sets" }}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="book-sets">
      <Toast msg={toast.msg} type={toast.type} onClose={clearToast} />

      <PageHeader
        subtitle="BOOK SET REQUEST"
        title={`Edit request — ${formData.school_name || "Institute"}`}
        backPath={`/admin/book-set-requests/${id}`}
        backLabel="Back to request details"
      />
      <p className="text-muted mb-4" style={{ marginTop: "-0.75rem", fontSize: "0.9rem" }}>
        Update the institute&apos;s requested book list and estimated prices before approval.
      </p>

      <BookSetForm
        formData={formData}
        onFieldChange={handleFieldChange}
        onItemChange={handleItemChange}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onSubmit={handleSubmit}
        loading={saving}
        cancelPath={() => navigate(`/admin/book-set-requests/${id}`)}
        submitLabel="Save Request"
        showActiveToggle={false}
        isRequest={true}
      />
    </AdminLayout>
  );
}

export default EditBookSetRequest;
