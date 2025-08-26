'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
onAuthStateChanged,
updateProfile,
sendPasswordResetEmail,
signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase-config';
import './settings.css';
import '../styles/tabbar.css'; // <-- styles des onglets

export default function SettingsPage() {
const pathname = usePathname();

const [user, setUser] = useState(null);
const [displayName, setDisplayName] = useState('');
const [email, setEmail] = useState('');
const [saving, setSaving] = useState(false);
const [msg, setMsg] = useState('');

// Charge l’utilisateur + son doc Firestore
useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);
setMsg('');
if (!u) return;

setEmail(u.email || '');
try {
const snap = await getDoc(doc(db, 'users', u.uid));
const nameFromDb = snap.exists() ? snap.data().name : '';
setDisplayName(nameFromDb || u.displayName || '');
} catch {
setDisplayName(u.displayName || '');
}
});
return () => unsub();
}, []);

const handleSave = async () => {
if (!user) return;
setSaving(true);
setMsg('');
try {
await updateProfile(user, { displayName: displayName || '' });
await setDoc(
doc(db, 'users', user.uid),
{ name: displayName || '' },
{ merge: true }
);
setMsg('✅ Modifications enregistrées.');
} catch (e) {
setMsg("❌ Impossible d'enregistrer. Réessaie.");
console.warn(e);
} finally {
setSaving(false);
setTimeout(() => setMsg(''), 3000);
}
};

const handleChangePassword = async () => {
if (!email) return;
try {
await sendPasswordResetEmail(auth, email);
setMsg('📨 Email de réinitialisation envoyé.');
} catch (e) {
setMsg("❌ Envoi impossible. Vérifie l’email.");
console.warn(e);
} finally {
setTimeout(() => setMsg(''), 3500);
}
};

const handleLogout = async () => {
try {
await signOut(auth);
} catch (e) {
console.warn(e);
}
};

if (!user) {
return (
<div className="settings-container">
<h1>Paramètres</h1>
<p>Connecte-toi pour gérer ton profil.</p>

{/* Onglets bas */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}>
<span className="tab__icon">🧊</span><span className="tab__label">Frigo</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith('/settings') ? 'is-active' : ''}`}>
<span className="tab__icon">⚙️</span><span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}

return (
<div className="settings">
<h1>Paramètres</h1>
<p className="subtitle">Personnalisez votre expérience</p>

{/* Carte Profil */}
<div className="profile-card card">
<label className="block-label">Profil</label>

<input
type="email"
value={email || ""}
readOnly
aria-label="Adresse e-mail"
/>

<div className="row">
<input
type="text"
placeholder="Ex. Grégoire"
value={name || ""}
onChange={(e) => setName(e.target.value)}
aria-label="Votre prénom"
/>

<button
type="button"
className="btn-ghost"
onClick={handleChangePassword}
>
Modifier le mot de passe
</button>
</div>

<div className="actions">
<button type="button" className="btn-primary" onClick={handleSave}>
Enregistrer
</button>
</div>

{msg ? <div className={`alert ${msg.type === 'error' ? 'error' : ''}`}>{msg.text}</div> : null}
</div>

{/* Carte Support */}
<div className="support-card card">
<label className="block-label">Support</label>
<div className="links">
<a href="/settings/faq">Aide et FAQ</a>
<a href="/settings/privacy">Confidentialité</a>
<a href="mailto:contact@monfrigo.app">Nous contacter</a>
</div>
</div>

{/* Déconnexion */}
<div className="logout-card card">
<button type="button" onClick={handleLogout}>
Se déconnecter
</button>
</div>
</div>
);
}