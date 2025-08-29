"use client";

import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function Home() {
const router = useRouter();

const goSignup = () => router.push("/signup");

return (
<div className="page">
{/* Logo + titre */}
<header className="hero">
<div className="logo">
    <img src="/frigo.png" alt="logo mon frigo" width={60} height={60} />
</div>
<h1 className="title">Mon Frigo</h1>
<p className="subtitle">Votre assistant intelligent</p>
<p className="subtitle2">pour une alimentation sans gaspillage</p>
</header>

{/* Deux cartes */}
<section className="cards">
<div className="card cardBlue">
<div className="cardIcon">🥗</div>
<div className="cardTitle">Anti-gaspillage</div>
<div className="cardText">Recevez des alertes avant péremption</div>
</div>

<div className="card cardGreen">
<div className="cardIcon">🛡️</div>
<div className="cardTitle">100% sécurisé</div>
<div className="cardText">Vos données protégées</div>
</div>
</section>

{/* Carte promo */}
<section className="promo">
<div className="promoBadge">✨ Offre de lancement ✨</div>
<div className="promoBig">14 jours gratuits</div>
<div className="promoSmall">Puis 3,99€/mois</div>
</section>

{/* CTA */}
<section className="cta">
<button className="ctaBtn" onClick={goSignup}>
⚡ Commencer l’essai gratuit
</button>
<div className="ctaBadges">
<span className="dot" /> Données chiffrées
<span className="spacer" />
<span className="dot" /> Sans engagement
</div>

<p className="loginText">
Déjà inscrit ? <a href="/login">Se connecter</a>
</p>
</section>

<style jsx>{`
.page {
--bg: #f6f7fb;
--text: #0f172a;
--muted: #677189;
--panel: #ffffff;
--border: #e6ebf5;
--blue1: #3b82f6;
--blue2: #2563eb;
--green1: #22c55e;
--green2: #16a34a;

min-height: 100dvh;
display: grid;
place-items: center;
padding: 32px 16px 48px;
background:
radial-gradient(1200px 600px at 20% -10%, #eaf0ff 0, #f6f7fb 60%, #f6f7fb 100%),
#f6f7fb;
color: var(--text);
font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

.hero {
text-align: center;
margin-bottom: 20px;
}
.logo {
width: 74px;
height: 74px;
margin: 0 auto 14px;
display: grid;
place-items: center;
border-radius: 22px;
color: #fff;
font-size: 30px;
background: linear-gradient(160deg, #3a63ff 0%, #2a50e6 45%, #1f43d8 100%);
box-shadow: 0 10px 30px rgba(32, 69, 230, 0.25), inset 0 -6px 10px rgba(255, 255, 255, 0.15);
}
.title {
font-size: clamp(28px, 4vw, 40px);
font-weight: 800;
letter-spacing: -0.02em;
margin: 0;
}
.subtitle {
margin: 8px 0 2px;
color: var(--muted);
font-weight: 600;
}
.subtitle2 {
margin: 0;
color: var(--muted);
font-size: 14px;
}

.cards {
display: grid;
grid-template-columns: repeat(2, minmax(240px, 320px));
gap: 16px;
margin: 24px 0 10px;
}
@media (max-width: 680px) {
.cards { grid-template-columns: 1fr; }
}
.card {
background: var(--panel);
border: 1px solid var(--border);
border-radius: 16px;
padding: 18px 18px;
display: grid;
justify-items: start;
row-gap: 6px;
box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
}
.cardIcon {
width: 40px;
height: 40px;
display: grid;
place-items: center;
border-radius: 10px;
color: #fff;
font-size: 20px;
}
.cardBlue .cardIcon {
background: linear-gradient(160deg, var(--blue1), var(--blue2));
}
.cardGreen .cardIcon {
background: linear-gradient(160deg, var(--green1), var(--green2));
}
.cardTitle {
font-weight: 800;
margin-top: 6px;
}
.cardText {
color: var(--panel-700, var(--muted));
font-size: 13px;
}

.promo {
width: min(680px, 92vw);
background: #f8fff6;
border: 1px solid #d8f5dc;
border-radius: 16px;
padding: 18px 20px;
margin: 10px auto 18px;
text-align: center;
box-shadow: 0 10px 30px rgba(22, 163, 74, 0.06);
}
.promoBadge {
color: #0f6e2f;
font-weight: 700;
margin-bottom: 6px;
}
.promoBig {
font-size: 22px;
font-weight: 800;
line-height: 1.1;
}
.promoSmall {
font-size: 13px;
color: var(--muted);
margin-top: 4px;
}

.cta {
display: grid;
justify-items: center;
gap: 10px;
margin-top: 6px;
}
.ctaBtn {
width: min(560px, 92vw);
padding: 14px 18px;
border: none;
border-radius: 12px;
background: linear-gradient(160deg, var(--blue1), var(--blue2));
color: #fff;
font-weight: 700;
letter-spacing: 0.2px;
cursor: pointer;
box-shadow: 0 12px 30px rgba(37, 99, 235, 0.25);
transition: transform 0.06s ease, box-shadow 0.2s ease;
}
.ctaBtn:hover { transform: translateY(-1px); }
.ctaBtn:active { transform: translateY(0); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.18); }

.ctaBadges {
display: flex;
align-items: center;
gap: 14px;
color: var(--muted);
font-size: 12.5px;
}
.dot {
display: inline-block;
width: 6px;
height: 6px;
border-radius: 999px;
background: #b7c1d6;
margin-right: 6px;
}
.spacer { width: 16px; }
`}</style>
</div>
);
}
