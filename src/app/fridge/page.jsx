"use client";
import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./global.css";
import "./tabbar.css";

export default function FridgePage() {
const [user, setUser] = useState(null);
const [products, setProducts] = useState([]);
const [newProduct, setNewProduct] = useState({ name: "", expirationDate: "", category: "Autre", location: "Frigo" });

useEffect(() => {
const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
setUser(currentUser);
if (currentUser) {
const q = query(collection(db, "products"), where("userId", "==", currentUser.uid));
onSnapshot(q, (snapshot) => {
const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
setProducts(data);
});
} else {
setProducts([]);
}
});
return () => unsubscribeAuth();
}, []);

const addProduct = async () => {
if (!newProduct.name || !newProduct.expirationDate) {
alert("Veuillez remplir tous les champs !");
return;
}
try {
await addDoc(collection(db, "products"), {
...newProduct,
userId: user.uid,
});
setNewProduct({ name: "", expirationDate: "", category: "Autre", location: "Frigo" });
} catch (error) {
alert("Erreur lors de l'ajout du produit.");
}
};

const deleteProduct = async (id) => {
try {
await deleteDoc(doc(db, "products", id));
} catch (error) {
alert("Erreur lors de la suppression.");
}
};

const total = products.length;
const urgent = products.filter(p => {
const today = new Date();
const expiry = new Date(p.expirationDate);
const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
return diffDays <= 3 && diffDays >= 0;
}).length;
const expired = products.filter(p => new Date(p.expirationDate) < new Date()).length;

return (
<div className="page">
<h1>Mon Frigo</h1>
<p>Salut {user ? user.displayName || "utilisateur" : "utilisateur"} 👋</p>

{/* Stats */}
<div className="stats">
<div className="card green">Total<br />{total}</div>
<div className="card orange">Urgent<br />{urgent}</div>
<div className="card red">Expirés<br />{expired}</div>
</div>

{/* Recherche + filtres */}
<div className="filters">
<input
type="text"
placeholder="Rechercher un produit..."
/>
<select>
<option>Toutes les catégories</option>
</select>
<select>
<option>Tous les lieux</option>
</select>
<button className="primary">+ Ajouter un produit</button>
</div>

{/* Liste produits */}
{products.length > 0 ? (
<ul className="product-list">
{products.map((p) => (
<li key={p.id} className="product-item">
<span className="product-name">{p.name}</span>
{p.expirationDate && <span className="pill">{p.expirationDate}</span>}
<button className="deleteBtn" onClick={() => deleteProduct(p.id)}>Supprimer</button>
</li>
))}
</ul>
) : (
<div className="empty">
<div className="emptyIcon">🛒</div>
<p>Votre frigo est vide</p>
<small>Ajoutez vos premiers produits pour commencer.</small>
<button onClick={() => {}}>Ajouter un produit</button>
</div>
)}

{/* Formulaire inline */}
<div className="add-form">
<input
type="text"
placeholder="Nom ex : Poulet"
value={newProduct.name}
onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
/>
<input
type="date"
value={newProduct.expirationDate}
onChange={(e) => setNewProduct({ ...newProduct, expirationDate: e.target.value })}
/>
<select
value={newProduct.category}
onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
>
<option>Autre</option>
<option>Viandes</option>
<option>Légumes</option>
<option>Fruits</option>
</select>
<select
value={newProduct.location}
onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
>
<option>Frigo</option>
<option>Congélateur</option>
<option>Placard</option>
</select>
<button onClick={addProduct}>Ajouter</button>
<button onClick={() => setNewProduct({ name: "", expirationDate: "", category: "Autre", location: "Frigo" })}>
Annuler
</button>
</div>
</div>
);
}
