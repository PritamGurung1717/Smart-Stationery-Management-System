import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout.jsx";
import Toast from "../../components/admin/shared/Toast";
import PageHeader from "../../components/admin/shared/PageHeader";
import BookSetForm from "../../components/admin/booksets/BookSetForm";
import { useBookSetForm } from "../../hooks/useBookSetForm";
import { useToast } from "../../hooks/useToast";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function AddBookSet() {
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const {
    formData,
    handleFieldChange,
    handleItemChange,
    addItem,
    removeItem,
    validateForm
  } = useBookSetForm(null, false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm(showToast)) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/book-sets`, formData, { headers: authH() });
      showToast("Book set created successfully");
      setTimeout(() => {
        navigate(`/admin/book-sets/${response.data.bookSet._id}`);
      }, 1200);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to create book set", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout activeTab="book-sets">
      <Toast msg={toast.msg} type={toast.type} onClose={clearToast} />
      
      <PageHeader 
        title="Create New Book Set"
        subtitle="BOOK SETS"
        backPath="/admin-dashboard"
        backLabel="Back"
      />

      <BookSetForm
        formData={formData}
        onFieldChange={handleFieldChange}
        onItemChange={handleItemChange}
        onAddItem={addItem}
        onRemoveItem={(index) => removeItem(index, showToast)}
        onSubmit={handleSubmit}
        loading={loading}
        cancelPath={() => navigate("/admin-dashboard", { state: { tab: "book-sets" } })}
        submitLabel="Create Book Set"
        showActiveToggle={true}
        isRequest={false}
      />
    </AdminLayout>
  );
}

export default AddBookSet;
