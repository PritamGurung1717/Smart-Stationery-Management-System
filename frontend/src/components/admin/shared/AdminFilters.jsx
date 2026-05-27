import { FaSearch } from "react-icons/fa";
import "../../../styles/landing.css";

export const TotalCount = ({ value }) => (
  <span className="admin-toolbar-total">Total: {value ?? 0}</span>
);

export const SearchInput = ({ value, onChange, onSearch, placeholder, style }) => (
  <div className="landing-search admin-toolbar-search" style={style}>
    <input
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={e => e.key === "Enter" && onSearch?.()}
    />
    <button
      type="button"
      className="landing-search-icon border-0 bg-transparent p-0"
      style={{ pointerEvents: "auto", cursor: "pointer" }}
      onClick={onSearch}
      aria-label="Search"
    >
      <FaSearch />
    </button>
  </div>
);

export const FilterSelect = ({ value, onChange, options, style }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="form-select form-select-sm admin-filter-select"
    style={style}
  >
    {options.map(([v, l]) => (
      <option key={v} value={v}>{l}</option>
    ))}
  </select>
);

export const AdminFilterRow = ({ filters, actions }) => (
  <div className="admin-sub-filters mb-3">
    {filters && <div className="admin-page-toolbar__filters">{filters}</div>}
    {actions && (
      <div className="admin-page-toolbar__footer mt-2">
        <div className="admin-page-toolbar__actions">{actions}</div>
      </div>
    )}
  </div>
);

const AdminPageToolbar = ({ label, title, total, filters, actions }) => (
  <div className="admin-page-toolbar mb-4 w-100">
    <div className="d-flex justify-content-between align-items-center w-100 flex-wrap gap-3">
      <div className="d-flex align-items-center flex-wrap gap-2">
        {filters && <div className="admin-page-toolbar__filters" style={{ justifyContent: "flex-start" }}>{filters}</div>}
        {actions && <div className="admin-page-toolbar__actions" style={{ marginLeft: "0.25rem" }}>{actions}</div>}
      </div>
      {total != null && (
        <div style={{ marginLeft: "auto" }}>
          <TotalCount value={total} />
        </div>
      )}
    </div>
  </div>
);

export default AdminPageToolbar;
