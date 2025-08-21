'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './privacy.css';

export default function PrivacyPage() {
const pathname = usePathname();

return (
<>
<main className="wrap privacyWrap" role="main" aria-labelledby="pageTitle">
<header className="pageHeader">
<div className="iconCube" aria-hidden>🛡️</div>
<div>
<h1 id="pageTitle">Confidentialité</h1>
<p className="subtitle">Comment nous traitons vos données</p>
</div>
</header>

{/* Données collectées */}
<section className="card">
<h2 className="cardTitle">Données collectées</h2>
<p className="muted">
Nous collectons uniquement les données nécessaires au fonctionnement de l’application.
</p>

<ul className="list">
<li><strong>Informations de compte</strong> : nom, adresse email</li>
<li><strong>Données d’utilisation</strong> : produits ajoutés, repas planifiés</li>
<li><strong>Préférences</strong> : notifications, langue</li>
</ul>

<div className="banner bannerOk">
<span className="bannerIcon" aria-hidden>✅</span>
<span>Aucune donnée sensible (mot de passe, données bancaires) n’est collectée.</span>
</div>
</section>

{/* Stockage & sécurité */}
<section className="card">
<h2 className="cardTitle">Stockage et sécurité</h2>
<ul className="list">
<li><strong>Stockage local</strong> : vos données sont enregistrées sur votre appareil.</li>
<li><strong>Chiffrement</strong> : communications sécurisées (HTTPS).</li>
<li><strong>Accès limité</strong> : seul vous avez accès à vos données.</li>
<li><strong>Pas de serveur</strong> : aucune donnée n’est envoyée sur nos serveurs.</li>
</ul>

<div className="note">
🔒 Vos données restent privées et sous votre contrôle.
</div>
</section>

{/* Utilisation des données */}
<section className="card">
<h2 className="cardTitle">Utilisation des données</h2>
<ul className="list">
<li>Fonctionnement de l’application (frigo & repas)</li>
<li>Personnalisation de votre expérience</li>
<li>Envoi de notifications (si activées)</li>
<li>Amélioration des suggestions de repas</li>
</ul>

<div className="banner bannerWarn">
<span className="bannerIcon" aria-hidden>❌</span>
<span>Aucune donnée n’est vendue, partagée ou utilisée à des fins publicitaires.</span>
</div>
</section>

{/* Vos droits */}
<section className="card">
<h2 className="cardTitle">Vos droits</h2>
<ul className="list">
<li><strong>Accès</strong> : consulter toutes vos données</li>
<li><strong>Modification</strong> : corriger vos informations</li>
<li><strong>Suppression</strong> : supprimer votre compte et vos données</li>
<li><strong>Portabilité</strong> : exporter vos données</li>
</ul>

<div className="banner bannerOk">
<span className="bannerIcon" aria-hidden>✅</span>
<span>Exercez ces droits dans l’onglet <em>Paramètres</em> ou contactez-nous.</span>
</div>
</section>

{/* Cookies */}
<section className="card">
<h2 className="cardTitle">Cookies et technologies similaires</h2>
<ul className="list">
<li><strong>Stockage local</strong> : pour sauvegarder vos données</li>
<li><strong>Cookies techniques</strong> : pour le bon fonctionnement de l’app</li>
</ul>

<div className="note">
🍪 Aucun cookie de tracking ou publicitaire n’est utilisé.
</div>
</section>

{/* Contact */}
<section className="card">
<h2 className="cardTitle">Contact</h2>
<p className="muted">Pour toute question concernant cette politique :</p>
<p>
<strong>Email :</strong>{' '}
<a className="link" href="mailto:smonfrigo@gmail.com">smonfrigo@gmail.com</a><br />
<strong>Réponse :</strong> sous 48h maximum
</p>

<button
type="button"
className="btnPrimary"
onClick={() => window.history.back()}
aria-label="J’ai compris"
>
J’ai compris
</button>

<p className="lastUpdated">Dernière mise à jour : août 2025</p>
</section>
</main>

{/* Tabbar bas (reuse de styles/tabbar.css) */}
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
