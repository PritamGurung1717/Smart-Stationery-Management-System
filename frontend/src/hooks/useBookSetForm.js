import { useState } from "react";

export const useBookSetForm = (initialData = null, isRequest = false) => {
  const [formData, setFormData] = useState(initialData || {
    school_name: "",
    grade: "",
    is_active: true,
    items: [{
      [isRequest ? "book_title" : "title"]: "",
      author: "",
      publisher: "",
      publication_year: new Date().getFullYear(),
      isbn: "",
      [isRequest ? "estimated_price" : "price"]: "",
      subject_name: "",
    }]
  });

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
          [isRequest ? "book_title" : "title"]: "",
          author: "",
          publisher: "",
          publication_year: new Date().getFullYear(),
          isbn: "",
          [isRequest ? "estimated_price" : "price"]: "",
          subject_name: "",
        }
      ]
    }));
  };

  const removeItem = (index, showToast) => {
    if (formData.items.length === 1) {
      showToast("At least one book is required", "error");
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (showToast) => {
    if (!formData.school_name.trim()) {
      showToast("School name is required", "error");
      return false;
    }
    if (!formData.grade.trim()) {
      showToast("Grade is required", "error");
      return false;
    }
    if (formData.items.length === 0) {
      showToast("At least one book is required", "error");
      return false;
    }

    const titleField = isRequest ? "book_title" : "title";
    const priceField = isRequest ? "estimated_price" : "price";

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      
      if (!item[titleField]?.trim()) {
        showToast(`Book ${i + 1}: Title is required`, "error");
        return false;
      }
      
      if (isRequest && !item.subject_name?.trim()) {
        showToast(`Book ${i + 1}: Subject is required`, "error");
        return false;
      }
      
      if (!isRequest) {
        if (!item.author?.trim() || !item.publisher?.trim() || !item.publication_year) {
          showToast(`Book ${i + 1}: All required fields must be filled`, "error");
          return false;
        }
      }
      
      if (!item[priceField] || item[priceField] <= 0) {
        showToast(`Book ${i + 1}: Valid price is required`, "error");
        return false;
      }
    }

    return true;
  };

  return {
    formData,
    setFormData,
    handleFieldChange,
    handleItemChange,
    addItem,
    removeItem,
    validateForm
  };
};
