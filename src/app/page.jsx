'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './home.css'; // Ton fichier CSS perso si besoin

export default function Home() {
const router = useRouter();

const handleTrialClick = () => {
router.push('/signup');
};

return (
<div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white text-gray-800">
{/* Header */}
<header className="flex items-center justify-between px-5 py-4">
<div></div>
<Link
href="/login"
className="text-sm font-medium text-blue-600 hover:underline"
>
Se connecter
</Link>
</header>

{/* Logo */}
<main className="flex-1 px-5">
<div className="w-full flex justify-center">
<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
<div className="w-3 h-3 bg-white rounded-sm"></div>
</div>
</div>

{/* Titre + sous-titre */}
<h1 className="text-3xl font-bold text-center mt-5">Mon Frigo</h1>
<p className="text-center text-gray-500 mt-2">
Votre assistant intelligent
<br className="sm:hidden" /> pour une alimentation sans gaspillage
</p>

{/* Cartes */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
<div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-5 shadow-md">
<p className="text-lg font-semibold">IA intégrée</p>
<p className="text-sm mt-1 opacity-90">Chef 3.0 vous conseille</p>
</div>

<div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-xl p-5 shadow-md">
<p className="text-lg font-semibold">100% sécurisé</p>
<p className="text-sm mt-1 opacity-90">Vos données protégées</p>
</div>
</div>

{/* Offre lancement */}
<div className="border border-green-300 bg-green-50 text-center rounded-xl p-5 mt-6 max-w-md mx-auto shadow-sm">
<p className="text-green-700 font-semibold">✨ Offre de lancement ✨</p>
<p className="text-2xl font-bold text-green-800 mt-1">14 jours gratuits</p>
<p className="text-sm text-gray-600 mt-1">Puis 3,99€/mois</p>
</div>

{/* CTA */}
<div className="max-w-md mx-auto mt-6">
<button
onClick={handleTrialClick}
className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-4 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition"
>
Commencer l'essai gratuit
</button>
</div>
</main>

{/* Footer */}
<footer className="mt-auto py-6 text-center text-sm text-gray-500">
<div className="flex items-center justify-center gap-6">
<div className="flex items-center gap-2">
<span>🔒</span>
<span>Données chiffrées</span>
</div>
<div className="flex items-center gap-2">
<span>📄</span>
<span>Sans engagement</span>
</div>
</div>
</footer>
</div>
);
}
