// -------- Next.js: empêcher le prérendu statique de casser le build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
collection, getDocs, addDoc, writeBatch, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase-config"; // <-- chemin OK d'après ta capture
import useAuth from "../hooks/useAuth"; // <-- ton hook d’auth

// Constantes d’affichage
const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const SLOTS = ["Déjeuner","Dîner"];

// ---------- Modal interne (aucune dépendance externe)
function Modal({ open, onClose, defaultDay, defaultSlot, user, onSaved }) {
const [day, setDay] = useState(defaultDay ?? "Lundi");
const [slot, setSlot] = useState(defaultSlot ?? "Déjeuner");
const [name, setName] = useState("");
const [fridge, setFridge] = useState([]);
const [selectedIds, setSelectedIds] = useState(new Set());
const [loading, setLoading] = useState(false);
const [loadErr, setLoadErr] = useState("");

// Charger les produits du frigo
useEffect(() => {
if (!open || !user) return;
let mounted = true;
(async () => {
setLoading(true);
setLoadErr("");
try {
const snap = await getDocs(collection(db, "users", user.uid, "fridge"));
const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
if (mounted) setFridge(items);
} catch (e) {
if (mounted) setLoadErr("Impossible de charger les produits du frigo.");
} finally {
if (mounted) setLoading(false);
}
})();
return () => { mounted = false; };
}, [open, user]);

useEffect(() => {
// réinitialiser quand on (ré)ouvre
if (open) {
setDay(defaultDay ?? "Lundi");
setSlot(defaultSlot ?? "Déjeuner");
setName("");
setSelectedIds(new Set());
setLoadErr("");
}
}, [open, defaultDay, defaultSlot]);

const toggle = (id) => {
const next = new Set(selectedIds);
next.has(id) ? next.delete(id) : next.add(id);
setSelectedIds(next);
};

const selectedProducts = useMemo(
() => fridge.filter(f => selectedIds.has(f.id)),
[fridge, selectedIds]
);

const save = async () => {
if (!user) return;
// on autorise : nom OU produits (au moins l’un des deux)
if (!name.trim() && selectedProducts.length === 0) {
alert("Ajoute un nom de repas ou sélectionne au moins un produit.");
return;
}

const payload = {
day, slot,
name: name.trim() || null,
products: selectedProducts.map(p => ({ id: p.id, name: p.name || p.label || p.title || "Produit" })),
createdAt: serverTimestamp(),
};

// 1) créer le repas 2) supprimer les produits consommés du frigo
const batch = writeBatch(db);
const ref = collection(db, "users", user.uid, "meals");
const mealRef = await addDoc(ref, payload);
selectedProducts.forEach(p => {
batch.delete(doc(db, "users", user.uid, "fridge", p.id));
});
await batch.commit();

onSaved?.({ id: mealRef.id, ...payload, createdAt: new Date() });
onClose?.();
};

if (!open) return null;

return (
<div style={styles.backdrop} onClick={onClose}>
<div style={styles.modal} onClick={(e)=>e.stopPropagation()}>
<div style={styles.modalHeader}>
<h3 style={{margin:0}}>Ajouter un repas</h3>
<button onClick={onClose} aria-label="Fermer" style={styles.close}>×</button>
</div>

<div style={styles.row}>
<div style={{flex:1, marginRight:8}}>
<label style={styles.label}>Jour</label>
<select value={day} onChange={e=>setDay(e.target.value)} style={styles.input}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</div>
<div style={{flex:1, marginLeft:8}}>
<label style={styles.label}>Créneau</label>
<select value={slot} onChange={e=>setSlot(e.target.value)} style={styles.input}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</div>
</div>

<div>
<label style={styles.label}>Nom du repas (facultatif)</label>
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={e=>setName(e.target.value)}
style={styles.input}
/>
</div>

<div style={{marginTop:14}}>
<strong>Produits du frigo</strong>
<div style={{marginTop:8, maxHeight:180, overflowY:"auto", border:"1px solid #eee", borderRadius:8, padding:8}}>
{loading && <div style={{opacity:.7}}>Chargement…</div>}
{!!loadErr && <div style={{color:"#c62828"}}>{loadErr}</div>}
{!loading && !loadErr && fridge.length === 0 && (
<div style={{opacity:.7}}>Aucun produit trouvé. Ajoute d’abord des produits dans l’onglet Frigo.</div>
)}
{!loading && !loadErr && fridge.map(p => (
<label key={p.id} style={styles.checkLine}>
<input type="checkbox" checked={selectedIds.has(p.id)} onChange={()=>toggle(p.id)} />
<span style={{marginLeft:8}}>
{(p.name || p.label || p.title || "Produit")}
{p.expiryDate ? <span style={{opacity:.6}}> — {p.expiryDate}</span> : null}
</span>
</label>
))}
</div>
</div>

<div style={styles.actions}>
<button onClick={onClose} style={styles.btnGhost}>Annuler</button>
<button onClick={save} style={styles.btnPrimary}>Sauvegarder</button>
</div>
</div>
</div>
);
}

// ---------- Page principale
export default function RepasPage() {
const { user } = useAuth();
const [meals, setMeals] = useState([]); // {id, day, slot, name, products[]}
const [open, setOpen] = useState(false);
const [defaults, setDefaults] = useState({ day: "Lundi", slot: "Déjeuner" });
const [loading, setLoading] = useState(false);

const refreshMeals = async () => {
if (!user) return;
setLoading(true);
try {
const snap = await getDocs(collection(db, "users", user.uid, "meals"));
setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
} finally {
setLoading(false);
}
};

useEffect(() => { refreshMeals(); /* au login */ }, [user?.uid]);

const grouped = useMemo(() => {
const map = {};
DAYS.forEach(d => {
map[d] = {};
SLOTS.forEach(s => (map[d][s] = []));
});
meals.forEach(m => {
const d = m.day || "Lundi";
const s = m.slot || "Déjeuner";
if (map[d]?.[s]) map[d][s].push(m);
});
return map;
}, [meals]);

const openModal = (day, slot) => {
setDefaults({ day, slot });
setOpen(true);
};

return (
<div style={styles.page}>
<header style={styles.header}>
<div style={{display:"flex", alignItems:"center", gap:10}}>
<span style={{fontSize:22}}>🍽️</span>
<div>
<h1 style={{margin:"0 0 2px 0", fontSize:22}}>Mes repas</h1>
<div style={{opacity:.7, fontSize:13}}>Planifie tes repas de la semaine</div>
</div>
</div>
<button onClick={()=>openModal("Lundi","Déjeuner")} style={styles.btnPrimarySm}>+ Ajouter un repas</button>
</header>

<div style={styles.grid}>
{DAYS.map(day => (
<section key={day} style={styles.card}>
<h3 style={styles.cardTitle}>{day}</h3>

{SLOTS.map(slot => (
<div key={slot} style={{marginTop:10}}>
<div style={styles.slotHeader}>
<strong>{slot}</strong>
<button onClick={()=>openModal(day, slot)} style={styles.linkBtn}>+ Ajouter</button>
</div>

{(grouped[day][slot] ?? []).length === 0 ? (
<div style={styles.muted}>Aucun repas</div>
) : (
<ul style={styles.list}>
{grouped[day][slot].map(m => (
<li key={m.id} style={styles.listItem}>
<div>
{m.name ? <div><strong>{m.name}</strong></div> : null}
{m.products?.length ? (
<div style={{opacity:.8, fontSize:13}}>
{m.products.map(p => p.name).join(", ")}
</div>
) : null}
</div>
</li>
))}
</ul>
)}
</div>
))}
</section>
))}
</div>

<Modal
open={open}
onClose={()=>setOpen(false)}
defaultDay={defaults.day}
defaultSlot={defaults.slot}
user={user}
onSaved={(created)=> {
// rafraîchir l’écran de façon simple
setMeals(prev => [created, ...prev]);
}}
/>
</div>
);
}

/* ------------------ styles inline sobres (pas de CSS externe) ------------------ */
const styles = {
page: { padding: "20px 16px 80px" },
header: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 },
grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12 },

card: { border:"1px solid #eaeaea", borderRadius:12, padding:12, background:"#fff" },
cardTitle: { margin:0, fontSize:16 },
slotHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 },

muted: { opacity:.7, fontSize:13 },
list: { listStyle:"none", padding:0, margin:"6px 0 0 0" },
listItem:{ border:"1px solid #eee", borderRadius:8, padding:"8px 10px", marginBottom:8, background:"#fafafa" },

linkBtn: { border:"none", background:"transparent", color:"#0a84ff", cursor:"pointer", fontSize:13 },

btnPrimarySm: {
background:"#0ea5e9", color:"#fff", border:"none", borderRadius:8, padding:"8px 12px",
cursor:"pointer", fontWeight:600
},

// Modal
backdrop: { position:"fixed", inset:0, background:"rgba(0,0,0,.25)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 },
modal: { width:"min(580px, 92vw)", background:"#fff", borderRadius:12, padding:16, boxShadow:"0 10px 30px rgba(0,0,0,.15)" },
modalHeader:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
close: { border:"none", background:"#f3f4f6", width:28, height:28, borderRadius:6, cursor:"pointer", fontSize:18, lineHeight:"26px" },

row: { display:"flex", gap:0, marginTop:8 },
label: { display:"block", fontSize:12, opacity:.8, margin:"10px 0 6px" },
input: { width:"100%", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 12px", outline:"none" },

checkLine: { display:"flex", alignItems:"center", padding:"6px 4px", borderRadius:6 },

actions: { display:"flex", justifyContent:"flex-end", gap:10, marginTop:16 },
btnGhost: { background:"#f3f4f6", border:"none", borderRadius:8, padding:"10px 14px", cursor:"pointer" },
btnPrimary:{ background:"#0ea5e9", color:"#fff", border:"none", borderRadius:8, padding:"10px 14px", cursor:"pointer", fontWeight:600 },
};
