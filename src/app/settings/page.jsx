'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import useAuth from '../hooks/useAuth';
import { auth } from '../firebase/firebase-config';
import { signOut } from 'firebase/auth';

import './settings.css';

export default function SettingsPage() {
const pathname = usePathname();
const user = useAuth();

const [expNotif, setExpNotif] = useState(false);
const [soundNotif, setSoundNotif] = useState(false);

const handleLogout = async () => {
try {
await signOut(auth);
} catch (e) {
alert('Échec de la déconnexion');
console.error(e);
}
};

const handleDeleteAccount = () => {
alert('Suppression de compte : à brancher côté serveur / Firestore.');
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
<div className="userName">
{user?.displayName || user?.email?.split('@')[0] || 'Utilisateur'}
</div>
<div className="userEmail">{user?.email || '—'}</div>
</div>
<button
className="btn ghost"
type="button"
onClick={() => alert('Édition profil à venir')}
>
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
</section>

{/* Support (liens cliquables) */}
<section className="settings-section">
<h2>Support</h2>
<ul className="links">
<li>
<Link href="/settings/faq">Aide et FAQ</Link>
</li>
<li>
<Link href="/settings/contact" onClick={(e)=>{e.preventDefault(); alert('Contact : à venir (formulaire / mail)')}}>
Nous contacter
</Link>
</li>
<li>
<Link href="/settings/privacy">Confidentialité</Link>
</li>
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

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>

<Link href="/settings" className={`tab ${pathname?.startsWith('/settings') ? 'is-active' : ''}`}>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
