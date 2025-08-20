'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PrivacyPage() {
const pathname = usePathname();

return (
<>
<div className="settings-container">
<header className="settings-header">
<div className="icon">🛡️</div>
<div>
<h1>Confidentialité</h1>
<p>Comment nous traitons vos données</p>
</div>
</header>

<section className="settings-section">
<h2>Données collectées</h2>
<p>
Nous stockons uniquement les informations nécessaires au fonctionnement de l’app :
votre email, vos produits du frigo et vos repas planifiés.
</p>
</section>

<section className="settings-section">
<h2>Utilisation</h2>
<p>
Ces données servent à afficher votre frigo, calculer les expirations,
et générer vos repas. Elles ne sont ni revendues, ni partagées à des tiers.
</p>
</section>

<section className="settings-section">
<h2>Suppression</h2>
<p>
Vous pouvez supprimer votre compte et l’ensemble de vos données depuis
<b> Paramètres &gt; Supprimer mon compte</b>.
</p>
</section>
</div>

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
