// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
* ✅ Adapter la ligne d'import Firebase si besoin:
* - Si dans FRIGO tu fais: import { auth, db } from '../firebase/firebase-config' (depuis /fridge)
* alors ici (depuis /repas) c'est la même: ../firebase/firebase-config
* - Si tu utilises '@/app/firebase/firebase-config', remplace la ligne par celle-là.
*/
import { auth, db } from '../firebase/firebase-config';
// import { auth, db } from '@/app/firebase/firebase-config';

import React, { useEffect, useMemo, useState } from 'react';
import {
collection, onSnapshot, getDocs, addDoc,
writeBatch, doc, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const [user, setUser] = useState(null);

// Repas
const [meals, setMeals] = useState([]);
const [loadingMeals, setLoadingMeals] = useState(true);

// Panneau ajout
const [open, setOpen] = useState(false);
const [day, setDay] = useState('Lundi');
const [slot, setSlot] = useState('Déjeuner');
const [name, setName] = useState('');

// Frigo
const [fridge, setFridge] = useState([]);
const [checked, setChecked] = useState(new Set());
const [fridgeLoading, setFridgeLoading] = useState(false);
const [fridgeErr, setFridgeErr] = useState('');

// ----- AUTH (même logique que tes autres pages)
useEffect(() => {
const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
return () => unsub();
}, []);

// ----- STREAM REPAS (users/{uid}/meals)
useEffect(() => {
if (!user?.uid) { setMeals([]); setLoadingMeals(false); return; }
setLoadingMeals(true);
const ref = collection(db, 'users', user.uid, 'meals');
const unsub = onSnapshot(ref, (snap) => {
setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
setLoadingMeals(false);
}, () => setLoadingMeals(false));
return () => unsub();
}, [user?.uid]);

// ----- GROUPAGE UI
const grouped = useMemo(() => {
const by = {};
DAYS.forEach(d => { by[d] = { 'Déjeuner': [], 'Dîner': [] }; });
meals.forEach(m => {
const d = DAYS.includes(m.day) ? m.day : 'Lundi';
const s = SLOTS.includes(m.slot) ? m.slot : 'Déjeuner';
by[d][s].push(m);
});
return by;
}, [meals]);

// ----- OUVRIR AJOUT + CHARGER FRIGO (users/{uid}/fridge)
const openAdd = async (d='Lundi', s='Déjeuner') => {
setDay(d); setSlot(s); setName(''); setChecked(new Set()); setOpen(true);
if (!user?.uid) return;
setFridgeLoading(true); setFridgeErr('');
try {
const snap = await getDocs(collection(db, 'users', user.uid, 'fridge'));
const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setFridge(items);
if (items.length === 0) setFridgeErr("Aucun produit trouvé dans le frigo.");
} catch (e) {
setFridge([]); setFridgeErr("Impossible de charger les produits du frigo.");
} finally {
setFridgeLoading(false);
}
};

const toggle = (id) => {
setChecked(prev => {
const n = new Set(prev);
n.has(id) ? n.delete(id) : n.add(id);
return n;
});
};

// ----- SAUVEGARDER LE REPAS + SUPPRIMER DU FRIGO
const saveMeal = async () => {
if (!user?.uid) return;
const selected = fridge
.filter(f => checked.has(f.id))
.map(f => ({ id:f.id, name:f.name || f.label || 'Produit' }));

try {
// 1) créer le repas
await addDoc(collection(db, 'users', user.uid, 'meals'), {
day, slot, name: name.trim(), products: selected, createdAt: serverTimestamp(),
});

// 2) supprimer les produits choisis du frigo
if (selected.length) {
const batch = writeBatch(db);
selected.forEach(it => batch.delete(doc(db, 'users', user.uid, 'fridge', it.id)));
await batch.commit();
}

setOpen(false);
} catch (e) {
alert("Échec de l’enregistrement du repas.");
}
};

const deleteMeal = async (id) => {
if (!user?.uid) return;
try { await deleteDoc(doc(db, 'users', user.uid, 'meals', id)); }
catch { alert("Suppression impossible."); }
};

return (
<div style={sx.page}>
{/* Header */}
<div style={sx.header}>
<div style={sx.hleft}>
<span style={sx.emoji}>🍽️</span>
<div>
<h1 style={sx.h1}>Mes repas</h1>
<p style={sx.sub}>Planifie tes repas de la semaine</p>
</div>
</div>
<button style={sx.btnPrimary} onClick={() => openAdd('Lundi','Déjeuner')}>+ Ajouter</button>
</div>

{!user && <div style={sx.alert}>Connecte-toi pour gérer tes repas.</div>}

{/* Grille semaine */}
{user && !loadingMeals && (
<div style={sx.grid}>
{DAYS.map(d => (
<section key={d} style={sx.dayCard}>
<h3 style={sx.dayTitle}>{d}</h3>
{SLOTS.map(s => (
<div key={s} style={sx.slotBox}>
<div style={sx.slotHead}>
<strong>{s}</strong>
<button style={sx.link} onClick={() => openAdd(d, s)}>+ Ajouter</button>
</div>
{grouped[d][s].length === 0 ? (
<div style={sx.empty}>Aucun repas</div>
) : grouped[d][s].map(m => (
<div key={m.id} style={sx.mealItem}>
<div style={sx.mealRow}>
<div>
<div style={sx.mealName}>{m.name || '(sans nom)'}</div>
{Array.isArray(m.products) && m.products.length > 0 && (
<ul style={sx.mealList}>
{m.products.map(p => <li key={p.id || p}>{p.name || p}</li>)}
</ul>
)}
</div>
<button style={sx.btnDanger} onClick={() => deleteMeal(m.id)}>Supprimer</button>
</div>
</div>
))}
</div>
))}
</section>
))}
</div>
)}

{/* Modale simple (inline) */}
{open && (
<div style={sx.overlay} onClick={() => setOpen(false)}>
<div style={sx.panel} onClick={(e)=>e.stopPropagation()}>
<div style={sx.panelHead}>
<h3 style={{margin:0}}>Ajouter un repas</h3>
<button style={sx.close} onClick={()=>setOpen(false)}>×</button>
</div>

<div style={sx.two}>
<label style={sx.label}>Jour
<select value={day} onChange={e=>setDay(e.target.value)} style={sx.input}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>
<label style={sx.label}>Créneau
<select value={slot} onChange={e=>setSlot(e.target.value)} style={sx.input}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label style={sx.label}>Nom du repas (facultatif)
<input style={sx.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex : Salade de poulet"/>
</label>

<div style={{marginTop:12}}>
<div style={{fontWeight:700, marginBottom:6}}>Produits du frigo</div>
{fridgeLoading && <div style={sx.muted}>Chargement…</div>}
{fridgeErr && <div style={sx.err}>{fridgeErr}</div>}
{!fridgeLoading && !fridgeErr && (
<ul style={sx.fridgeList}>
{fridge.map(p => (
<li key={p.id} style={sx.line}>
<label style={{display:'flex',alignItems:'center',gap:8}}>
<input type="checkbox" checked={checked.has(p.id)} onChange={()=>toggle(p.id)} />
<span style={{fontWeight:600}}>{p.name || p.label || 'Produit'}</span>
</label>
</li>
))}
{fridge.length === 0 && <li style={sx.muted}>Aucun produit.</li>}
</ul>
)}
</div>

<div style={sx.panelActions}>
<button style={sx.btnGhost} onClick={()=>setOpen(false)}>Annuler</button>
<button style={sx.btnPrimary} onClick={saveMeal}>Sauvegarder</button>
</div>
</div>
</div>
)}

{/* Tabbar simple inline */}
<nav style={sx.tabbar}>
<a href="/fridge" style={sx.tab}><span style={sx.tabIcon}>🧊</span><span>Frigo</span></a>
<a href="/repas" style={{...sx.tab, color:'#0ea5e9', fontWeight:700}}><span style={sx.tabIcon}>🍽️</span><span>Repas</span></a>
<a href="/settings" style={sx.tab}><span style={sx.tabIcon}>⚙️</span><span>Paramètres</span></a>
</nav>
</div>
);
}

/* -------- styles inline -------- */
const sx = {
page:{maxWidth:1100, margin:'0 auto', padding:'20px 16px 90px'},
header:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16},
hleft:{display:'flex',gap:12,alignItems:'center'},
emoji:{fontSize:26}, h1:{margin:0,fontSize:22}, sub:{margin:'2px 0 0',color:'#6b7280',fontSize:14},
btnPrimary:{background:'#0ea5e9',color:'#fff',border:0,borderRadius:10,padding:'8px 12px',cursor:'pointer'},

grid:{display:'grid',gridTemplateColumns:'repeat(2, minmax(0,1fr))',gap:16},
dayCard:{background:'#fff',border:'1px solid #ececec',borderRadius:10,padding:12},
dayTitle:{margin:'0 0 8px',fontSize:16},
slotBox:{background:'#fafafa',border:'1px dashed #ddd',borderRadius:10,padding:10,marginBottom:10},
slotHead:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8},
link:{background:'transparent',border:0,color:'#0ea5e9',cursor:'pointer'},
empty:{color:'#9ca3af',fontSize:14},

mealItem:{background:'#fff',border:'1px solid #eee',borderRadius:10,padding:10,marginTop:8},
mealRow:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10},
mealName:{fontWeight:700}, mealList:{margin:'6px 0 0 18px',padding:0},
btnDanger:{background:'#ef4444',color:'#fff',border:0,borderRadius:8,padding:'6px 10px',cursor:'pointer'},

overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:18},
panel:{width:'min(620px, 92vw)',background:'#fff',borderRadius:14,boxShadow:'0 10px 30px rgba(0,0,0,.2)',border:'1px solid #e5e7eb',padding:14},
panelHead:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8},
close:{background:'#f3f4f6',border:'none',borderRadius:8,width:34,height:34,cursor:'pointer'},
two:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10},
label:{display:'block',fontSize:14,color:'#374151',marginTop:8},
input:{width:'100%',marginTop:6,padding:'8px 10px',border:'1px solid #e5e7eb',borderRadius:8},
muted:{color:'#888'},

fridgeList:{listStyle:'none',margin:'8px 0 0',padding:0,maxHeight:240,overflow:'auto'},
line:{padding:'6px 0',borderBottom:'1px dashed #eee'},

panelActions:{display:'flex',gap:10,justifyContent:'flex-end',marginTop:12},
btnGhost:{background:'#f3f4f6',border:'1px solid #e5e7eb',borderRadius:10,padding:'8px 12px',cursor:'pointer'},

tabbar:{position:'fixed',left:0,right:0,bottom:0,background:'#fff',borderTop:'1px solid #eee',display:'flex',justifyContent:'space-around',padding:'10px 0',zIndex:40},
tab:{textDecoration:'none',color:'#444',display:'flex',flexDirection:'column',alignItems:'center',fontSize:12},
tabIcon:{fontSize:18},
};
