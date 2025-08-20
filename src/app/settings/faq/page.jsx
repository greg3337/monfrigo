'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './faq.css'; // le CSS ci-dessous
import '../../styles/tabbar.css'; // ta tabbar existante

// Petit composant Accordéon
function QA({ q, children, defaultOpen=false }) {
const [open, setOpen] = useState(defaultOpen);
return (
<div className={`faqItem ${open ? 'is-open' : ''}`}>
<button className="faqQ" onClick={() => setOpen(o => !o)} aria-expanded={open}>
<span className="arrow">{open ? '▾' : '▸'}</span>
{q}
</button>
{open && <div className="faqA">{children}</div>}
</div>
);
}

export default function FAQPage() {
const pathname = usePathname();

return (
<>
<main className="wrap">
<header className="faqHeader">
<div className="icon">❓</div>
<div>
<h1>Aide & FAQ</h1>
<p>Réponses rapides aux questions fréquentes</p>
</div>
</header>

{/* ====== Général ====== */}
<section className="faqSection">
<h2>Général</h2>

<QA q="Comment ajouter un produit dans le frigo ?" defaultOpen>
Depuis l’onglet <strong>Frigo</strong>, clique sur <em>« Ajouter un produit »</em>, remplis les champs puis <em>Enregistrer</em>.
</QA>

<QA q="Comment planifier un repas ?">
Va dans l’onglet <strong>Repas</strong>, clique sur <em>« Ajouter un repas »</em>, choisis un jour et un créneau (déjeuner/dîner), nomme le repas et sélectionne des produits du frigo.
</QA>

<QA q="Pourquoi un produit disparaît du frigo quand je l’utilise ?">
Lorsqu’un produit est utilisé dans un repas, il est retiré automatiquement du frigo pour éviter les doublons. C’est normal.
</QA>
</section>

{/* ====== Fonctionnement ====== */}
<section className="faqSection">
<h2>Fonctionnement</h2>

<QA q="Puis-je utiliser l’app sans connexion internet ?">
Oui. Les données sont stockées localement. Quand la connexion revient, tout se synchronise automatiquement.
</QA>

<QA q="Comment activer/désactiver les notifications d’expiration ?">
Dans <Link href="/settings"><strong>Paramètres</strong></Link> &rarr; <em>Notifications</em>, bascule l’interrupteur selon ton besoin.
</QA>

<QA q="Puis-je renommer/supprimer un repas ?">
Oui. Dans <strong>Repas</strong>, ouvre la carte du jour/créneau et utilise le bouton <em>Supprimer</em>. (L’édition fine arrivera bientôt.)
</QA>
</section>

{/* ====== Sécurité & données ====== */}
<section className="faqSection">
<h2>Sécurité & données</h2>

<QA q="Mes données sont-elles sécurisées ?">
Oui. Les communications sont chiffrées (HTTPS) et aucune donnée sensible (mot de passe bancaire, etc.) n’est collectée. Voir aussi
{' '}<Link href="/settings/privacy">la page Confidentialité</Link>.
</QA>

<QA q="Comment exporter ou supprimer mes données ?">
Depuis <Link href="/settings"><strong>Paramètres</strong></Link>, utilise les options d’export et de suppression de compte / données.
</QA>
</section>

{/* ====== Compte ====== */}
<section className="faqSection">
<h2>Compte</h2>

<QA q="Comment me déconnecter ?">
Dans <Link href="/settings">Paramètres</Link> &rarr; bouton <em>Se déconnecter</em>.
</QA>

<QA q="Comment supprimer mon compte ?">
Dans <Link href="/settings">Paramètres</Link> &rarr; <em>Supprimer mon compte</em> (action définitive).
</QA>

<QA q="Comment vous contacter ?">
Écris-nous à <a href="mailto:smonfrigo@gmail.com">smonfrigo@gmail.com</a> — réponse sous 48 h max.
</QA>
</section>

<div className="faqFooterNote">
Besoin d’autre chose ? <a href="mailto:smonfrigo@gmail.com">Contacte-nous</a>, on répond vite 👋
</div>
</main>

{/* ===== Tabbar ===== */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname?.startsWith('/repas') ? 'is-active' : ''}`}>
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith('/settings') && !pathname?.includes('/faq') && !pathname?.includes('/privacy') ? 'is-active' : ''}`}>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
