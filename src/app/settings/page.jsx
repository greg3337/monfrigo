'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';

import { auth, db } from '../firebase/firebase-config'; // chemin depuis /settings
import useAuth from '../hooks/useAuth'; // ton hook existant
import './settings.css'; // le CSS juste en-dessous

const MEAL_SLOTS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Goûter'];

export default function SettingsPage() {
const pathname = usePathname();
const { user } = useAuth();

const [loading, setLoading] = useState(true);
const [profileName, setProfileName] = useState('');
const [editingName, setEditingName] = useState(false);

// préférences
const [prefs, setPrefs] = useState({
notifExpiry: false,
notifSound: false,
dailyReminder: '', // "08:30"
theme: 'system', // 'light' | 'dark' | 'system'
language: 'fr', // 'fr' | 'en'
units: 'metric', // 'metric' | 'imperial'
defaultLocation: '', // texte libre (ex: "Frigo de la cuisine")
weekStartsMonday: true,
mealSlots: ['Déjeuner', 'Dîner'], // sous-ensemble de MEAL_SLOTS
});

// Charger le profil + préférences
useEffect(() => {
if (!user) return;
const userRef = doc(db, 'users', user.uid);

// 1) snapshot profil (name/email stockés côté users)
getDoc(userRef).then(snap => {
const data = snap.data() || {};
setProfileName(data.name || (user.displayName || ''));
});

// 2) snapshot des préférences
const unsub = onSnapshot(userRef, (snap) => {
const data = snap.data() || {};
setPrefs(prev => ({
...prev,
...(
data.settings || {} // on stocke tout dans users/{uid}.settings
)
}));
setLoading(false);
});

return () => unsub();
}, [user]);

const userEmail = useMemo(() => user?.email ?? '', [user]);

// Helpers Firestore
const ensureUserDoc = async () => {
if (!user) return;
const ref = doc(db, 'users', user.uid);
const s = await getDoc(ref);
if (!s.exists()) {
await setDoc(ref, { settings: { ...prefs }, name: profileName || '' }, { merge: true });
}
return ref;
};

const updateSetting = async (key, value) => {
if (!user) return;
const ref = await ensureUserDoc();
await updateDoc(ref, {
[`settings.${key}`]: value,
});
};

const saveProfileName = async () => {
if (!user) return;
const ref = await ensureUserDoc();
await updateDoc(ref, { name: profileName });
setEditingName(false);
};

// Notifications: demander la permission navigateur (facultatif)
const requestNotifPermission = async () => {
if (!('Notification' in window)) return alert("Notifications non supportées par ce navigateur.");
const perm = await Notification.requestPermission();
if (perm !== 'granted') alert("Permission refusée.");
};

// Déconnexion
const handleLogout = async () => {
await signOut(auth);
window.location.href = '/login';
};

// Suppression de compte
const handleDeleteAccount = async () => {
const confirmMsg = "Supprimer définitivement votre compte et vos données ? C'est irréversible.";
if (!confirm(confirmMsg)) return;
try {
await deleteUser(auth.currentUser);
window.location.href = '/signup';
} catch (err) {
// Cas fréquent : requires-recent-login
alert(
"Impossible de supprimer le compte : " +
(err?.message || "ré-authentification requise. Déconnectez-vous puis reconnectez-vous et réessayez.")
);
}
};

if (!user) {
return (
<div className="wrap settingsWrap">
<h2>Paramètres</h2>
<p>Veuillez vous connecter.</p>
</div>
);
}

return (
<>
<div className="wrap settingsWrap">
<header className="settingsHeader">
<div className="settingsIcon">⚙️</div>
<div>
<h1 className="brandTitle">Paramètres</h1>
<div className="brandSub">Personnalisez votre expérience</div>
</div>
</header>

{loading ? (
<p>Chargement…</p>
) : (
<>
{/* PROFIL */}
<section className="card settings-item">
<h2 className="sectionTitle">Profil</h2>
<div className="row">
<div className="col">
<div className="profileName">
<strong>{editingName ? 'Nom' : profileName || 'Sans nom'}</strong>
</div>
<div className="profileEmail">{userEmail}</div>
</div>
<div className="col actionsRight">
{editingName ? (
<div className="editName">
<input
autoFocus
className="input"
value={profileName}
placeholder="Votre nom"
onChange={(e) => setProfileName(e.target.value)}
/>
<button className="btnPrimary" onClick={saveProfileName}>Enregistrer</button>
<button className="btnGhost" onClick={() => setEditingName(false)}>Annuler</button>
</div>
) : (
<button className="btnGhost" onClick={() => setEditingName(true)}>Modifier</button>
)}
</div>
</div>
</section>

{/* NOTIFICATIONS */}
<section className="card settings-item">
<h2 className="sectionTitle">Notifications</h2>

<label className="switchRow">
<input
type="checkbox"
checked={!!prefs.notifExpiry}
onChange={(e) => updateSetting('notifExpiry', e.target.checked)}
/>
<span>
<strong>Notifications d’expiration</strong>
<small>Recevoir des alertes pour les produits qui expirent</small>
</span>
</label>

<label className="switchRow">
<input
type="checkbox"
checked={!!prefs.notifSound}
onChange={(e) => updateSetting('notifSound', e.target.checked)}
/>
<span>
<strong>Son des notifications</strong>
<small>Jouer un son lors des alertes</small>
</span>
</label>

<div className="row">
<div className="col">
<label className="fieldLabel">Rappel quotidien</label>
<input
type="time"
value={prefs.dailyReminder || ''}
onChange={(e) => updateSetting('dailyReminder', e.target.value)}
className="input"
placeholder="08:30"
/>
</div>
<div className="col actionsRight">
<button className="btnGhost" onClick={requestNotifPermission}>
Diagnostiquer les notifications
</button>
</div>
</div>
</section>

{/* APP */}
<section className="card settings-item">
<h2 className="sectionTitle">Application</h2>

<div className="row">
<div className="col">
<label className="fieldLabel">Thème</label>
<select
className="select"
value={prefs.theme}
onChange={(e) => updateSetting('theme', e.target.value)}
>
<option value="system">Système</option>
<option value="light">Clair</option>
<option value="dark">Sombre</option>
</select>
</div>
<div className="col">
<label className="fieldLabel">Langue</label>
<select
className="select"
value={prefs.language}
onChange={(e) => updateSetting('language', e.target.value)}
>
<option value="fr">Français</option>
<option value="en">English</option>
</select>
</div>
</div>
</section>

{/* FRIGO */}
<section className="card settings-item">
<h2 className="sectionTitle">Frigo</h2>

<div className="row">
<div className="col">
<label className="fieldLabel">Unités</label>
<select
className="select"
value={prefs.units}
onChange={(e) => updateSetting('units', e.target.value)}
>
<option value="metric">Métrique (g, kg, L)</option>
<option value="imperial">Impérial (oz, lb)</option>
</select>
</div>
<div className="col">
<label className="fieldLabel">Lieu par défaut</label>
<input
className="input"
placeholder="ex : Frigo cuisine"
value={prefs.defaultLocation || ''}
onChange={(e) => updateSetting('defaultLocation', e.target.value)}
/>
</div>
</div>
</section>

{/* REPAS */}
<section className="card settings-item">
<h2 className="sectionTitle">Repas</h2>

<label className="switchRow">
<input
type="checkbox"
checked={!!prefs.weekStartsMonday}
onChange={(e) => updateSetting('weekStartsMonday', e.target.checked)}
/>
<span>
<strong>La semaine commence le lundi</strong>
</span>
</label>

<div className="chips">
{MEAL_SLOTS.map((slot) => {
const active = prefs.mealSlots?.includes(slot);
return (
<button
key={slot}
className={`chip ${active ? 'is-active' : ''}`}
onClick={() => {
const next = new Set(prefs.mealSlots || []);
if (active) next.delete(slot); else next.add(slot);
updateSetting('mealSlots', Array.from(next));
}}
>
{slot}
</button>
);
})}
</div>
</section>

{/* SUPPORT */}
<section className="card settings-item">
<h2 className="sectionTitle">Support</h2>
<ul className="links">
<li><Link href="/help">Aide et FAQ</Link></li>
<li><a href="mailto:support@monfrigo.dev">Nous contacter</a></li>
<li><Link href="/privacy">Confidentialité</Link></li>
</ul>
</section>

{/* DANGER ZONE */}
<section className="card settings-item">
<div className="dangerRow">
<button className="btnGhost" onClick={handleLogout}>Se déconnecter</button>
<button className="btnDanger" onClick={handleDeleteAccount}>Supprimer mon compte</button>
</div>
</section>
</>
)}
</div>

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}>
<span className="tab_icon">🧊</span><span className="tab_label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname?.startsWith('/repas') ? 'is-active' : ''}`}>
<span className="tab_icon">🍽️</span><span className="tab_label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith('/settings') ? 'is-active' : ''}`}>
<span className="tab_icon">⚙️</span><span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
