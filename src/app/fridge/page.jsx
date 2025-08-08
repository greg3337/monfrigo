'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth, db } from '@/app/firebase/firebase-config';
import {
collection,
query,
orderBy,
onSnapshot,
addDoc,
deleteDoc,
doc,
Timestamp,
} from 'firebase/firestore';

import AddProductModal from '@/app/fridge/AddProductModal';

const DAYS_URGENT = 3;

function isExpired(ts) {
if (!ts) return false;
const d = ts.toDate ? ts.toDate() : new Date(ts);
const today = new Date();
today.setHours(0, 0, 0, 0);
return d < today;
}

function isUrgent(ts) {
if (!ts) return false;
const d = ts.toDate ? ts.toDate() : new Date(ts);
const today = new Date();
today.setHours(0, 0, 0, 0);
const diff = (d - today) / 86400000; // jours
return diff >= 0 && diff <= DAYS_URGENT;
}

export default function FridgePage() {
const [items, setItems] = useState([]);
const [openModal, setOpenModal] = useState(false);
const [search, setSearch] = useState('');
const [category, setCategory] = useState('all');
const [loading, setLoading] = useState(true);

// Chargement en temps réel
useEffect(() => {
const uid = auth.currentUser?.uid;
if (!uid) return;

const q = query(
collection(db, 'users', uid, 'products'),
orderBy('expirationDate', 'asc')
);

const unsub = onSnapshot(q, (snap) => {
const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setItems(rows);
setLoading(false);
});

return () => unsub();
}, []);

// Compteurs
const { total, urgent, expired } = useMemo(() => {
const t = items.length;
const u = items.filter((it) => isUrgent(it.expirationDate)).length;
const e = items.filter((it) => isExpired(it.expirationDate)).length;
return { total: t, urgent: u, expired: e };
}, [items]);

// Catégories pour le filtre
const categories = useMemo(() => {
const set = new Set(items.map((i) => i.category).filter(Boolean));
return ['all', ...Array.from(set)];
}, [items]);

// Liste filtrée + recherchée
const filtered = useMemo(() => {
const term = search.trim().toLowerCase();
return items.filter((it) => {
const okCat = category === 'all' || it.category === category;
const okSearch =
!term ||
(it.name || '').toLowerCase().includes(term) ||
(it.category || '').toLowerCase().includes(term);
return okCat && okSearch;
});
}, [items, category, search]);

const onDelete = async (id) => {
const uid = auth.currentUser?.uid;
if (!uid) return;
await deleteDoc(doc(db, 'users', uid, 'products', id));
};

const formatDate = (ts) => {
if (!ts) return '-';
const d = ts.toDate ? ts.toDate() : new Date(ts);
return d.toLocaleDateString('fr-FR');
};

const userLabel = auth.currentUser?.displayName || auth.currentUser?.email || 'Utilisateur';

return (
<div className="min-h-screen bg-gray-50">
{/* Barre supérieure */}
<header className="border-b bg-white sticky top-0 z-10">
<div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center">
<div className="w-2 h-2 bg-white rounded-sm" />
</div>
<div className="font-semibold">Mon Frigo</div>
<div className="text-gray-400">•</div>
<div className="text-gray-600">Salut {userLabel} !</div>
</div>
<button
onClick={() => setOpenModal(true)}
className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
>
+ Ajouter un produit
</button>
</div>
</header>

<main className="max-w-5xl mx-auto px-4 py-6">
<h1 className="text-center text-xl font-semibold mb-1">Mes Produits</h1>
<p className="text-center text-gray-500 mb-6">Gérez vos aliments intelligemment</p>

{/* Compteurs */}
<div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-5">
<div className="bg-green-500 text-white rounded-lg py-3 text-center shadow-sm">
<div className="text-2xl font-bold">{total}</div>
<div className="text-sm opacity-90">Total</div>
</div>
<div className="bg-orange-500 text-white rounded-lg py-3 text-center shadow-sm">
<div className="text-2xl font-bold">{urgent}</div>
<div className="text-sm opacity-90">Urgent</div>
</div>
<div className="bg-rose-500 text-white rounded-lg py-3 text-center shadow-sm">
<div className="text-2xl font-bold">{expired}</div>
<div className="text-sm opacity-90">Expirés</div>
</div>
</div>

{/* Recherche + filtres */}
<div className="flex flex-col sm:flex-row gap-3 mb-4">
<input
type="text"
className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
placeholder="Rechercher un produit…"
value={search}
onChange={(e) => setSearch(e.target.value)}
/>
<select
className="bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
value={category}
onChange={(e) => setCategory(e.target.value)}
>
{categories.map((c) => (
<option key={c} value={c}>
{c === 'all' ? 'Toutes les catégories' : c}
</option>
))}
</select>
</div>

{/* Bouton ajouter (mobile) */}
<button
onClick={() => setOpenModal(true)}
className="sm:hidden w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg transition mb-4"
>
+ Ajouter un produit
</button>

{/* Liste */}
{loading ? (
<div className="text-center text-gray-500 py-16">Chargement…</div>
) : filtered.length === 0 ? (
<div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
<div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 mx-auto mb-3 flex items-center justify-center">
📦
</div>
<div className="font-medium mb-1">Votre frigo est vide</div>
<div className="text-sm text-gray-500 mb-4">
Commencez par ajouter vos premiers produits.
</div>
<button
onClick={() => setOpenModal(true)}
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
>
+ Ajouter un produit
</button>
<p className="text-xs text-gray-400 mt-3">
Astuce : ajoutez les dates d’expiration pour recevoir des alertes intelligentes.
</p>
</div>
) : (
<div className="bg-white border border-gray-200 rounded-xl divide-y">
{filtered.map((it) => {
const expiredFlag = isExpired(it.expirationDate);
const urgentFlag = isUrgent(it.expirationDate);
return (
<div key={it.id} className="flex items-center justify-between p-4">
<div>
<div className="font-medium">{it.name}</div>
<div className="text-xs text-gray-500">
{it.category || 'Sans catégorie'} • Expire le {formatDate(it.expirationDate)}
</div>
</div>

<div className="flex items-center gap-2">
{expiredFlag && (
<span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
Expiré
</span>
)}
{!expiredFlag && urgentFlag && (
<span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
Urgent
</span>
)}
<button
onClick={() => onDelete(it.id)}
className="text-sm text-rose-600 hover:text-rose-700"
title="Supprimer"
>
Supprimer
</button>
</div>
</div>
);
})}
</div>
)}
</main>

{/* Modal d’ajout */}
<AddProductModal
open={openModal}
onClose={() => setOpenModal(false)}
onSaved={() => setOpenModal(false)}
/>
</div>
);
}
