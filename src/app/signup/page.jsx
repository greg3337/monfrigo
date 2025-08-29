'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase-config';
import './signup.css';

export default function SignupPage() {
const router = useRouter();

const [form, setForm] = useState({
firstName: '',
lastName: '',
email: '',
password: '',
address1: '',
city: '',
postalCode: '',
country: 'France',
});
const [loading, setLoading] = useState(false);
const [err, setErr] = useState('');

const onChange = (e) => {
setErr('');
setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
};

const onSubmit = async (e) => {
e.preventDefault();
setErr('');
setLoading(true);

try {
// 1) Création compte Firebase Auth
const cred = await createUserWithEmailAndPassword(
auth,
form.email.trim(),
form.password
);
const uid = cred.user.uid;

// 2) Sauvegarde profil minimal en Firestore
await setDoc(doc(db, 'users', uid), {
firstName: form.firstName,
lastName: form.lastName,
email: form.email.trim(),
address: {
line1: form.address1,
city: form.city,
postalCode: form.postalCode,
country: form.country,
},
isSubscribed: false,
createdAt: serverTimestamp(),
});

// 3) Redirection Payment Link Stripe (avec email + client_reference_id)
const base = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/5kQdR8b9w1Xn6rd7903cc02';
const url = new URL(base);
url.searchParams.set('prefilled_email', form.email.trim());
url.searchParams.set('client_reference_id', uid);

router.push(url.toString());
} catch (e2) {
console.error(e2);
setErr(`Erreur : ${e2.message || 'imprévue'}`);
setLoading(false);
}
};

return (
<main className="signup-page">
<form
onSubmit={onSubmit}
className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
>
<h1 className="text-2xl font-bold text-center mb-6">Créer mon compte</h1>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div>
<label className="block text-sm font-medium mb-1">Prénom *</label>
<input
name="firstName"
value={form.firstName}
onChange={onChange}
required
className="w-full border rounded-md px-3 py-2 text-gray-900"
placeholder="Jean"
/>
</div>
<div>
<label className="block text-sm font-medium mb-1">Nom *</label>
<input
name="lastName"
value={form.lastName}
onChange={onChange}
required
className="w-full border rounded-md px-3 py-2 text-gray-900"
placeholder="Dupont"
/>
</div>
</div>

<div className="mt-4">
<label className="block text-sm font-medium mb-1">Email *</label>
<input
type="email"
name="email"
value={form.email}
onChange={onChange}
required
className="w-full border rounded-md px-3 py-2 text-gray-900"
placeholder="vous@exemple.com"
/>
</div>

<div className="mt-4">
<label className="block text-sm font-medium mb-1">Mot de passe *</label>
<input
type="password"
name="password"
value={form.password}
onChange={onChange}
required
className="w-full border rounded-md px-3 py-2 text-gray-900"
placeholder="********"
/>
</div>

<div className="mt-4">
<label className="block text-sm font-medium mb-1">Adresse (ligne 1)</label>
<input
name="address1"
value={form.address1}
onChange={onChange}
className="w-full border rounded-md px-3 py-2 text-gray-900"
placeholder="10 rue des Fleurs"
/>
</div>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
<div className="sm:col-span-2">
<label className="block text-sm font-medium mb-1">Ville</label>
<input
name="city"
value={form.city}
onChange={onChange}
className="w-full border rounded-md px-3 py-2 text-gray-900"
placeholder="Bordeaux"
/>
</div>
<div>
<label className="block text-sm font-medium mb-1">Code postal</label>
<input
name="postalCode"
value={form.postalCode}
onChange={onChange}
className="w-full border rounded-md px-3 py-2 text-gray-900"
placeholder="33000"
/>
</div>
</div>

<div className="mt-4">
<label className="block text-sm font-medium mb-1">Pays</label>
<input
name="country"
value={form.country}
onChange={onChange}
className="w-full border rounded-md px-3 py-2 text-gray-900"
placeholder="France"
/>
</div>

{err && (
<p className="text-red-600 text-sm mt-3">{err}</p>
)}

<button
type="submit"
disabled={loading}
className="mt-6 w-full rounded-lg px-4 py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 disabled:opacity-60"
>
{loading ? 'Création du compte…' : 'Suivant : procéder au paiement'}
</button>

<div className="text-xs text-gray-500 flex justify-center gap-6 mt-3">
<span>🔐 Données chiffrées</span>
<span>🤝 Sans engagement</span>
</div>
</form>
</main>
);
}
