"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RepasPage() {
const pathname = usePathname();
const tabs = [
{ href: "/fridge", label: "Frigo", icon: "🧊" },
{ href: "/repas", label: "Repas", icon: "🍽️" },
{ href: "/settings", label: "Paramètres", icon: "⚙️" },
];

return (
<div className="wrap">
<h1>Mes Repas 🍽️</h1>
<p>Ici, vous pourrez bientôt planifier vos repas et utiliser les produits de votre frigo.</p>

{/* Barre d’onglets bas */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<div className="tabs">
{tabs.map((t) => {
const active = pathname.startsWith(t.href);
return (
<Link
key={t.href}
href={t.href}
className={`tablink ${active ? "active" : ""}`}
>
<span className="tabicon" aria-hidden>{t.icon}</span>
<span className="tablabel">{t.label}</span>
</Link>
);
})}
</div>
</nav>
</div>
);
}
