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

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function EditBookSet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    school_name: "",
    grade: "",
    is_active: true,
    items: []
  });

  useEffect(() => {
    fetchBookSet();
  }, [id]);

  const fetchBookSet = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/book-sets/${id}`, { headers: authH() });
      const bookSet = response.data.bookSet;
      setFormData({
        school_name: bookSet.school_name,
        grade: bookSet.grade,
        is_active: bookSet.is_active,
        items: bookSet.items.map(item => ({
          product_id: item.product_id,
          title: item.title,
          author: item.author,
          publisher: item.publisher,
          publication_year: item.publication_year,
          isbn: item.isbn || "",
          price: item.price,
          subject_name: item.subject_name || "",
        }))
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load book set");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          title: "",
          author: "",
          publisher: "",
          publication_year: new Date().getFullYear(),
          isbn: "",
          price: "",
          subject_name: "",
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      showToast("At least one book is required", "error");
      return;
    }
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
    if (!formData.grade.trim()) {
      showToast("Grade is required", "error");
      return;
    }
    if (formData.items.length === 0) {
      showToast("At least one book is required", "error");
      return;
    }

    // Validate items
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.title.trim() || !item.author.trim() || !item.publisher.trim() || 
          !item.publication_year || !item.price) {
        showToast(`Book ${i + 1}: All required fields must be filled`, "error");
        return;
      }
      if (item.price <= 0) {
        showToast(`Book ${i + 1}: Price must be greater than 0`, "error");
        return;
      }
    }

    setSaving(true);
    try {
      await axios.put(`${API}/admin/book-sets/${id}`, formData, { headers: authH() });
      showToast("Book set updated successfully");
      setTimeout(() => {
        navigate(`/admin/book-sets/${id}`);
      }, 1200);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update book set", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <AdminLayout activeTab="book-sets">
      <LoadingSpinner />
    </AdminLayout>
  );

  if (error) return (
    <AdminLayout activeTab="book-sets">
      <ErrorMessage error={error} />
    </AdminLayout>
  );

  return (
    <AdminLayout activeTab="book-sets">
      <Toast msg={toast.msg} type={toast.type} onClose={clearToast} />

      <PageHeader 
        title="Edit Book Set"
        subtitle="BOOK SETS"
        backPath={`/admin/book-sets/${id}`}
        backLabel="Back"
      />

      <BookSetForm
        formData={formData}
        onFieldChange={handleFieldChange}
        onItemChange={handleItemChange}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onSubmit={handleSubmit}
        loading={saving}
        cancelPath={() => navigate(`/admin/book-sets/${id}`)}
        submitLabel="Save Changes"
        showActiveToggle={true}
        isRequest={false}
      />
    </AdminLayout>
  );
}

export default EditBookSet;
