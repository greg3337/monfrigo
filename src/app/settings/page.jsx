"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsPage() {
const pathname = usePathname();
const tabs = [
{ href: "/fridge", label: "Frigo", icon: "🧊" },
{ href: "/repas", label: "Repas", icon: "🍽️" },
{ href: "/settings", label: "Paramètres", icon: "⚙️" },
];

return (
<div className="wrap">
<h1>Paramètres ⚙️</h1>
<p>Gérez votre compte, vos préférences et vos notifications ici.</p>

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
