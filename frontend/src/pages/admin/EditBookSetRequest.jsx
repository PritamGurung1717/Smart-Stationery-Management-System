import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout.jsx";
import Toast from "../../components/admin/shared/Toast";
import PageHeader from "../../components/admin/shared/PageHeader";
import LoadingSpinner from "../../components/admin/shared/LoadingSpinner";
import BookSetForm from "../../components/admin/booksets/BookSetForm";
import { useToast } from "../../hooks/useToast";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function EditBookSetRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  
  const [formData, setFormData] = useState({
    school_name: "",
    grade: "",
    items: []
  });

  useEffect(() => { fetchRequest(); }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/admin/book-set-requests/${id}`, { headers: authH() });
      const req = r.data.request;
      setFormData({
        school_name: req.school_name || "",
        grade: req.grade || "",
        items: req.items || []
      });
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to load request", "error");
    } finally { setLoading(false); }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        book_title: "",
        subject_name: "",
        author: "",
        publisher: "",
        publication_year: new Date().getFullYear(),
        isbn: "",
        estimated_price: 0
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
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

    // Validate each item
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.book_title.trim()) {
        showToast(`Book title is required for item ${i + 1}`, "error");
        return;
      }
      if (!item.subject_name.trim()) {
        showToast(`Subject is required for item ${i + 1}`, "error");
        return;
      }
      if (!item.estimated_price || item.estimated_price <= 0) {
        showToast(`Valid price is required for item ${i + 1}`, "error");
        return;
      }
    }

    setSaving(true);
    try {
      const total = formData.items.reduce((sum, item) => sum + Number(item.estimated_price), 0);
      await axios.put(`${API}/admin/book-set-requests/${id}`, {
        ...formData,
        total_estimated_price: total
      }, { headers: authH() });
      showToast("Book set request updated successfully");
      setTimeout(() => navigate(`/admin/book-set-requests/${id}`), 1500);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to update request", "error");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <AdminLayout activeTab="book-sets">
      <LoadingSpinner />
    </AdminLayout>
  );

  return (
    <AdminLayout activeTab="book-sets">
      <Toast msg={toast.msg} type={toast.type} onClose={clearToast} />

      <PageHeader 
        title="Edit Request"
        subtitle="EDIT BOOK SET REQUEST"
        backPath={`/admin/book-set-requests/${id}`}
        backLabel="Back to Request Details"
      />

      <BookSetForm
        formData={formData}
        onFieldChange={handleFieldChange}
        onItemChange={handleItemChange}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onSubmit={handleSubmit}
        loading={saving}
        cancelPath={() => navigate(`/admin/book-set-requests/${id}`)}
        submitLabel="Save Changes"
        showActiveToggle={false}
        isRequest={true}
      />
    </AdminLayout>
  );
}

export default EditBookSetRequest;
