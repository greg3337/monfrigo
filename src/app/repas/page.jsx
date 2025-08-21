'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {collection, onSnapshot, getDocs, addDoc,serverTimestamp, writeBatch, doc, deleteDoc} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function RepasPage() {
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]); // [{id, day, slot, name, products:[{id,name}]}]
const [loadingMeals, setLoadingMeals] = useState(true);

// panneau "ajouter" inline (pas de modal)
const [panelOpen, setPanelOpen] = useState(false);
const [day, setDay] = useState('Lundi');
const [slot, setSlot] = useState('Déjeuner');
const [name, setName] = useState('');
const [fridge, setFridge] = useState([]); // produits du frigo [{id,name,expirationDate?}]
const [checked, setChecked] = useState([]); // ids sélectionnés
const [loadingFridge, setLoadingFridge] = useState(false);
const [saving, setSaving] = useState(false);
const [errorFridge, setErrorFridge] = useState('');
const [errorMeals, setErrorMeals] = useState('');

// Auth (client-only)
useEffect(() => {
const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
return () => unsub();
}, []);

// Stream des repas
useEffect(() => {
if (!user?.uid) { setMeals([]); setLoadingMeals(false); return; }
setLoadingMeals(true);
setErrorMeals('');
const colRef = collection(db, 'users', user.uid, 'meals');
const unsub = onSnapshot(colRef, (snap) => {
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(rows);
setLoadingMeals(false);
}, (e) => {
console.error(e);
setErrorMeals("Impossible de charger les repas.");
setLoadingMeals(false);
});
return () => unsub();
}, [user?.uid]);

// ouvrir le panneau d'ajout (et charger le frigo)
const openAdd = async (d='Lundi', s='Déjeuner') => {
setDay(d); setSlot(s); setName('');
setPanelOpen(true);
await loadFridge();
};

// charger frigo
const loadFridge = async () => {
if (!user?.uid) return;
setLoadingFridge(true);
setErrorFridge('');
setChecked([]);
try {
// on lit ICI: users/{uid}/fridge
const snap = await getDocs(collection(db, 'users', user.uid, 'fridge'));
const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setFridge(items);
if (items.length === 0) setErrorFridge("Aucun produit trouvé dans le frigo.");
} catch (e) {
console.error(e);
setErrorFridge("Impossible de charger les produits du frigo.");
setFridge([]);
} finally {
setLoadingFridge(false);
}
};

const toggle = (id) => {
setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

const saveMeal = async () => {
if (!user?.uid) return;
setSaving(true);
try {
const selected = fridge
.filter(f => checked.includes(f.id))
.map(f => ({ id: f.id, name: f.name || f.nom || 'Produit' }));

const payload = {
day, slot,
name: name.trim() || null,
products: selected,
createdAt: serverTimestamp(),
};

// 1) créer le repas
const ref = await addDoc(collection(db, 'users', user.uid, 'meals'), payload);

// 2) supprimer du frigo
if (checked.length > 0) {
const batch = writeBatch(db);
checked.forEach(id => batch.delete(doc(db, 'users', user.uid, 'fridge', id)));
await batch.commit();
}

// reset UI
setPanelOpen(false);
setName('');
setChecked([]);
} catch (e) {
console.error(e);
alert("Échec de l’enregistrement du repas.");
} finally {
setSaving(false);
}
};

const deleteMeal = async (id) => {
if (!user?.uid) return;
try {
await deleteDoc(doc(db, 'users', user.uid, 'meals', id));
} catch(e) {
console.error(e);
alert("Suppression impossible.");
}
};

// groupage pour l'affichage
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

return (
<div style={styles.page}>
<header style={styles.header}>
<div style={styles.hLeft}>
<span style={styles.emoji}>🍽️</span>
<div>
<h1 style={styles.h1}>Mes repas</h1>
<p style={styles.sub}>Planifie tes repas de la semaine</p>
</div>
</div>
<button style={styles.btnPrimary} onClick={() => openAdd('Lundi','Déjeuner')}>+ Ajouter</button>
</header>

{!user && <div style={styles.alert}>Connecte-toi pour gérer tes repas.</div>}
{user && errorMeals && <div style={{...styles.alert, ...styles.alertErr}}>{errorMeals}</div>}
{user && loadingMeals && <div style={{...styles.alert, ...styles.alertMuted}}>Chargement…</div>}

{user && !loadingMeals && (
<div style={styles.grid}>
{DAYS.map((d) => (
<section key={d} style={styles.dayCard}>
<h3 style={styles.dayTitle}>{d}</h3>

{SLOTS.map((s) => (
<div key={s} style={styles.slotBox}>
<div style={styles.slotHead}>
<strong>{s}</strong>
<button style={styles.link} onClick={() => openAdd(d, s)}>+ Ajouter</button>
</div>

<div>
{grouped[d][s].length === 0 ? (
<div style={styles.empty}>Aucun repas</div>
) : (
grouped[d][s].map(m => (
<div key={m.id} style={styles.mealItem}>
<div style={styles.mealRow}>
<div>
<div style={styles.mealName}>{m.name || '(sans nom)'}</div>
{Array.isArray(m.products) && m.products.length > 0 && (
<ul style={styles.mealList}>
{m.products.map(p => (
<li key={p.id || p}>{p.name || p}</li>
))}
</ul>
)}
</div>
<button style={styles.btnDanger} onClick={() => deleteMeal(m.id)}>Supprimer</button>
</div>
</div>
))
)}
</div>
</div>
))}
</section>
))}
</div>
)}

{/* PANNEAU D'AJOUT INLINE */}
{panelOpen && (
<div style={styles.overlay} onClick={() => setPanelOpen(false)}>
<div style={styles.panel} onClick={(e)=>e.stopPropagation()}>
<div style={styles.panelHead}>
<h3 style={{margin:0}}>Ajouter un repas</h3>
<button onClick={() => setPanelOpen(false)} style={styles.close}>×</button>
</div>

<div style={styles.two}>
<label style={styles.label}>Jour
<select value={day} onChange={e=>setDay(e.target.value)} style={styles.input}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>
<label style={styles.label}>Créneau
<select value={slot} onChange={e=>setSlot(e.target.value)} style={styles.input}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label style={styles.label}>Nom du repas (facultatif)
<input
style={styles.input}
placeholder="Ex : Salade de poulet"
value={name}
onChange={e=>setName(e.target.value)}
/>
</label>

<div style={{marginTop:12}}>
<div style={{fontWeight:700, marginBottom:6}}>Produits du frigo</div>

{loadingFridge && <p style={styles.muted}>Chargement…</p>}
{!loadingFridge && errorFridge && <p style={styles.err}>{errorFridge}</p>}

{!loadingFridge && !errorFridge && (
<ul style={styles.fridgeList}>
{fridge.map(p => (
<li key={p.id} style={styles.line}>
<label style={{display:'flex',alignItems:'center',gap:8,width:'100%'}}>
<input
type="checkbox"
checked={checked.includes(p.id)}
onChange={() => toggle(p.id)}
/>
<span style={{fontWeight:600}}>{p.name || p.nom || 'Produit'}</span>
{p.expirationDate && (
<small style={styles.muted}>— {String(p.expirationDate)}</small>
)}
</label>
</li>
))}
{(!loadingFridge && fridge.length === 0 && !errorFridge) && (
<li className="muted">Aucun produit trouvé.</li>
)}
</ul>
)}
</div>

<div style={styles.panelActions}>
<button style={styles.btnGhost} onClick={()=>setPanelOpen(false)} disabled={saving}>Annuler</button>
<button style={styles.btnPrimary} onClick={saveMeal} disabled={saving}>
{saving ? '…' : 'Sauvegarder'}
</button>
</div>
</div>
</div>
)}
</div>
);
}

/* ---------------- Styles inline basiques (pas de CSS externe) ---------------- */
const styles = {
page:{maxWidth:1100, margin:'0 auto', padding:'20px 16px 80px'},
header:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16},
hLeft:{display:'flex',gap:12,alignItems:'center'},
emoji:{fontSize:26},
h1:{margin:0,fontSize:22},
sub:{margin:'2px 0 0',color:'#6b7280',fontSize:14},
btnPrimary:{background:'#0ea5e9',color:'#fff',border:'none',borderRadius:10,padding:'8px 12px',cursor:'pointer'},
grid:{display:'grid',gridTemplateColumns:'repeat(2, minmax(0,1fr))',gap:16},
dayCard:{background:'#fff',border:'1px solid #ececec',borderRadius:10,padding:12},
dayTitle:{margin:'0 0 8px',fontSize:16},
slotBox:{background:'#fafafa',border:'1px dashed #ddd',borderRadius:10,padding:10,marginBottom:10},
slotHead:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8},
link:{background:'transparent',border:'none',color:'#0ea5e9',cursor:'pointer'},
empty:{color:'#9ca3af',fontSize:14},
mealItem:{background:'#fff',border:'1px solid #eee',borderRadius:10,padding:10,marginTop:8},
mealRow:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10},
mealName:{fontWeight:700},
mealList:{margin:'6px 0 0 18px',padding:0},
btnDanger:{background:'#ef4444',color:'#fff',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer'},

alert:{background:'#f7f7f7',border:'1px solid #eee',padding:10,borderRadius:8,margin:'10px 0'},
alertMuted:{opacity:.9},
alertErr:{background:'#fee2e2',color:'#991b1b',borderColor:'#fecaca'},

overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:18},
panel:{width:'min(620px, 92vw)',background:'#fff',borderRadius:14,boxShadow:'0 10px 30px rgba(0,0,0,.2)',border:'1px solid #e5e7eb',padding:14},
panelHead:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8},
close:{background:'#f3f4f6',border:'none',borderRadius:8,width:34,height:34,cursor:'pointer'},
two:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10},
label:{display:'block',fontSize:14,color:'#374151',marginTop:8},
input:{width:'100%',marginTop:6,padding:'8px 10px',border:'1px solid #e5e7eb',borderRadius:8},
muted:{color:'#888'},
err:{color:'#dc2626'},
fridgeList:{listStyle:'none',margin:'8px 0 0',padding:0,maxHeight:240,overflow:'auto'},
line:{padding:'6px 0',borderBottom:'1px dashed #eee'},
panelActions:{display:'flex',gap:10,justifyContent:'flex-end',marginTop:12},
btnGhost:{background:'#f3f4f6',border:'1px solid #e5e7eb',borderRadius:10,padding:'8px 12px',cursor:'pointer'},
};


