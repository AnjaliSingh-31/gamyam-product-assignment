import React, { useEffect, useMemo, useState } from "react";

function useDebounced(v, d) {
  const [deb, setDeb] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setDeb(v), d);
    return () => clearTimeout(id);
  }, [v, d]);
  return deb;
}

let nextId = 1000;

export default function App() {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("card");
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 500);

  const [page, setPage] = useState(1);
  const perPage = 8;

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    fetch("/products.json")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        const max = data.reduce((m, p) => Math.max(m, p.id || 0), 0);
        nextId = max + 1;
      });
  }, []);

  const filtered = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, debounced]);

  const pageCount = Math.ceil(filtered.length / perPage);
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  function saveProduct(f) {
    if (f.id) {
      setProducts((p) => p.map((x) => (x.id === f.id ? { ...x, ...f } : x)));
    } else {
      setProducts((p) => [{ ...f, id: nextId++ }, ...p]);
    }
    setFormOpen(false);
  }

  return (
    <div>
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <h3 className="brand-title">Product Management System</h3>
          <h1 className="dashboard-title">Inventory Dashboard</h1>
        </div>
        <button
          className="primary big-btn"
          onClick={() => {
            setEditItem(null);
            setFormOpen(true);
          }}
        >
          ＋ Add New Product
        </button>
      </div>

      <div className="container">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card purple">Total Products <h2>{products.length}</h2></div>
          <div className="stat-card pink">Low Stock Items <h2>{products.filter(p => p.stock < 5).length}</h2></div>
          <div className="stat-card blue">Total Stock <h2>{products.reduce((s,p) => s + Number(p.stock), 0)}</h2></div>
          <div className="stat-card green">
            Total Value
            <h2>₹{products.reduce((s,p) => s + p.price * p.stock, 0).toLocaleString()}</h2>
          </div>
        </div>

        {/* Search + View Toggle */}
        <div className="controls-group">
          <input
            className="search-box"
            placeholder="Search products by name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <div className="toggle-view">
            <button className={view === "card" ? "active" : ""} onClick={() => setView("card")}>
              Grid View
            </button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
              List View
            </button>
          </div>
        </div>

        {/* Product Rendering */}
        {view === "card" ? (
          <div className="card-grid">
            {visible.map((p) => (
              <div className="card" key={p.id}>
                <div className="category-tag">{p.category}</div>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <div className="price-tag">₹{p.price}</div>
                <div className="stock-badge">{p.stock} units</div>
                <button onClick={() => { setEditItem(p); setFormOpen(true); }}>Edit</button>
              </div>
            ))}
          </div>
        ) : (
          <table className="product-table">
            <thead>
              <tr>
                <th>Name</th><th>Price</th><th>Category</th><th>Stock</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>₹{p.price}</td>
                  <td>{p.category}</td>
                  <td>{p.stock}</td>
                  <td><button onClick={() => { setEditItem(p); setFormOpen(true); }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(1)}>First</button>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {pageCount}</span>
          <button disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</button>
          <button disabled={page === pageCount} onClick={() => setPage(pageCount)}>Last</button>
        </div>
      </div>

      {/* Modal */}
      {formOpen && (
        <ProductForm product={editItem} onClose={() => setFormOpen(false)} onSave={saveProduct} />
      )}
    </div>
  );
}

function ProductForm({ product, onClose, onSave }) {
  const [f, setF] = useState({
    id: product?.id,
    name: product?.name || "",
    price: product?.price ?? "",
    category: product?.category || "",
    stock: product?.stock ?? 0,
    description: product?.description || "",
  });

  const [err, setErr] = useState({});

  function validate() {
    const e = {};
    if (!f.name.trim()) e.name = "Required";
    if (f.price === "" || isNaN(Number(f.price))) e.price = "Invalid";
    if (!f.category.trim()) e.category = "Required";
    return e;
  }

  function submit(e) {
    e.preventDefault();
    const eobj = validate();
    setErr(eobj);
    if (!Object.keys(eobj).length) onSave({ ...f, price: Number(f.price), stock: Number(f.stock) });
  }

  return (
    <div className="modal">
      <form className="modal-card" onSubmit={submit}>
        <h2>{f.id ? "Edit Product" : "Add Product"}</h2>
        {["name", "price", "category", "stock", "description"].map((key) => (
          <label key={key}>
            {key}
            {key !== "description" && " *"}
            {key === "description" ? (
              <textarea value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
            ) : (
              <input value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
            )}
            {err[key] && <div className="error">{err[key]}</div>}
          </label>
        ))}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="primary">Save</button>
        </div>
      </form>
    </div>
  );
}
