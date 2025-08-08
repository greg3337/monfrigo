"use client";
import React, { useState } from "react";
import AddProductModal from "./AddProductModal";

export default function FridgePage() {
const [products, setProducts] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);

const addProduct = (product) => {
setProducts([...products, product]);
setIsModalOpen(false);
};

return (
<div style={{ padding: "20px" }}>
<h1>Mon Frigo</h1>

<button onClick={() => setIsModalOpen(true)}>Ajouter un produit</button>

<ul>
{products.map((p, index) => (
<li key={index}>
{p.name} - {p.expiration}
</li>
))}
</ul>

{isModalOpen && (
<AddProductModal
onClose={() => setIsModalOpen(false)}
onAdd={addProduct}
/>
)}
</div>
);
}
