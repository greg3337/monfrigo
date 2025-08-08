'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase-config'; // ← adapte le chemin si besoin

export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [err, setErr] = useState('');
const [loading, setLoading] = useState(false);

// Si déjà connecté, on redirige (dans un effect, pas pendant le rendu)
useEffect(() => {
const unsub = onAuthStateChanged(auth, (user) => {
if (user) router.replace('/');
});
return () => unsub();
}, [router]);

const handleLogin = async (e) => {
e.preventDefault();
setErr('');
setLoading(true);
try {
await signInWithEmailAndPassword(auth, email, password);
router.replace('/');
} catch (error) {
setErr(
error.code === 'auth/invalid-credential'
? 'Email ou mot de passe invalide.'
: error.message
);
} finally {
setLoading(false);
}
};

return (
<main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
<div className="w-full max-w-md">
{/* Logo + retour accueil */}
<div className="flex justify-between items-center mb-6">
<Link
href="/"
className="text-sm text-gray-500 hover:text-gray-700 transition"
>
← Retour à l’accueil
</Link>
<div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
<div className="w-2.5 h-2.5 bg-white rounded-[3px]" />
</div>
</div>

{/* Carte */}
<div className="bg-white/90 backdrop-blur border border-gray-100 shadow-xl rounded-2xl p-6 sm:p-8">
<h1 className="text-2xl font-semibold text-center text-blue-600 mb-1">Se connecter</h1>
<p className="text-center text-gray-500 mb-6">
Accédez à votre compte Mon Frigo
</p>

<form onSubmit={handleLogin} className="space-y-4">
<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Email
</label>
<input
type="email"
placeholder="nom@exemple.com"
className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
value={email}
onChange={(e) => setEmail(e.target.value)}
required
autoComplete="email"
/>
</div>

<div>
<div className="flex items-center justify-between mb-1">
<label className="block text-sm font-medium text-gray-700">
Mot de passe
</label>
<Link
href="/reset"
className="text-xs text-blue-600 hover:underline"
>
Mot de passe oublié ?
</Link>
</div>
<input
type="password"
placeholder="••••••••"
className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
value={password}
onChange={(e) => setPassword(e.target.value)}
required
autoComplete="current-password"
/>
</div>

{err && (
<p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
{err}
</p>
)}

<button
type="submit"
disabled={loading}
className="w-full rounded-xl px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition disabled:opacity-60"
>
{loading ? 'Connexion…' : 'Se connecter'}
</button>
</form>

<p className="text-center text-sm text-gray-600 mt-4">
Pas de compte ?{' '}
<Link href="/signup" className="text-blue-600 hover:underline">
Créer un compte
</Link>
</p>
</div>

{/* Mentions style footer */}
<div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
<div className="flex items-center gap-1">🔐 Données chiffrées</div>
<div className="flex items-center gap-1">🤝 Sans engagement</div>
</div>
</div>
</main>
);
}