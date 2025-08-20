'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import useAuth from '../hooks/useAuth'; // <-- ton hook existant
import { auth } from '../firebase/firebase-config'; // <-- ta config Firebase
import { signOut } from 'firebase/auth';

import './settings.css';

export default function SettingsPage() {
const pathname = usePathname();
const user = useAuth();

// États locaux pour la démo (tu pourras les brancher à Firestore plus tard)
const [lang, setLang] = useState('fr');
const [theme, setTheme] = useState('system');
const [units, setUnits] = useState('metric');
const [expNotif, setExpNotif] = useState(false);
const [soundNotif, setSoundNotif] = useState(false);

const handleLogout = async () => {
try {
await signOut(auth);
// Next gère la redirection via tes guards; sinon:
// window.location.href = '/login';
} catch (e) {
alert("Échec de la déconnexion");
console.error(e);
}
};

const handleDeleteAccount = () => {
// A brancher plus tard (suppression sécurisée du compte + données)
alert("Suppression de compte : à brancher côté serveur / Firestore.");
};

const savePreferences = (e) => {
e.preventDefault();
// Ici tu pourras enregistrer en base (Firestore, user doc, etc.)
alert('Préférences enregistrées ✅');
};

return (
<>
<div className="settings-container">
<header className="settings-header">
<div className="icon">⚙️</div>
<div>
<h1>Paramètres</h1>
<p>Personnalisez votre expérience</p>
</div>
</header>

{/* Profil */}
<section className="settings-section">
<h2>Profil</h2>
<div className="row between">
<div>
<div className="userName">{user?.displayName || user?.email?.split('@')[0] || 'Utilisateur'}</div>
<div className="userEmail">{user?.email || '—'}</div>
</div>
<button className="btn ghost" type="button" onClick={() => alert('Édition profil à venir')}>
Modifier
</button>
</div>
</section>

{/* Notifications */}
<section className="settings-section">
<h2>Notifications</h2>

<label className="switchRow">
<input
type="checkbox"
checked={expNotif}
onChange={(e) => setExpNotif(e.target.checked)}
/>
<div>
<div className="label">Notifications d’expiration</div>
<div className="sub">Recevoir des alertes pour les produits qui expirent</div>
</div>
</label>

<label className="switchRow">
<input
type="checkbox"
checked={soundNotif}
onChange={(e) => setSoundNotif(e.target.checked)}
/>
<div>
<div className="label">Son des notifications</div>
<div className="sub">Jouer un son lors des notifications</div>
</div>
</label>

<button type="button" className="btn ghost" onClick={() => alert('Diagnostic notifications à venir')}>
Diagnostiquer les notifications
</button>
</section>

{/* Préférences d’application */}
<form className="settings-section" onSubmit={savePreferences}>
<h2>Application</h2>

<div className="field">
<label>Langue</label>
<select value={lang} onChange={(e) => setLang(e.target.value)}>
<option value="fr">Français</option>
<option value="en">English</option>
</select>
</div>

<div className="field">
<label>Thème</label>
<select value={theme} onChange={(e) => setTheme(e.target.value)}>
<option value="system">Système</option>
<option value="light">Clair</option>
<option value="dark">Sombre</option>
</select>
</div>

<div className="field">
<label>Unités</label>
<select value={units} onChange={(e) => setUnits(e.target.value)}>
<option value="metric">Métrique (g, kg, L)</option>
<option value="imperial">Impérial (oz, lb, cup)</option>
</select>
</div>

<button className="btn primary" type="submit">Enregistrer</button>
</form>

{/* Support */}
<section className="settings-section">
<h2>Support</h2>
<ul className="links">
<li><a href="#" onClick={(e)=>e.preventDefault()}>Aide et FAQ</a></li>
<li><a href="#" onClick={(e)=>e.preventDefault()}>Nous contacter</a></li>
<li><a href="#" onClick={(e)=>e.preventDefault()}>Confidentialité</a></li>
</ul>
</section>

{/* Zone danger */}
<section className="settings-section dangerBox">
<div className="row">
<button className="btn ghost" type="button" onClick={handleLogout}>
Se déconnecter
</button>
</div>
<button className="btn danger" type="button" onClick={handleDeleteAccount}>
Supprimer mon compte
</button>
</section>
</div>

{/* Tabbar en bas */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname?.startsWith('/repas') ? 'is-active' : ''}`}>
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith('/settings') ? 'is-active' : ''}`}>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
