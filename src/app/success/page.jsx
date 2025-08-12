"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
const router = useRouter();

useEffect(() => {
const timer = setTimeout(() => {
router.push("/fridge"); // redirection vers le frigo
}, 3000); // 3 secondes avant la redirection

return () => clearTimeout(timer);
}, [router]);

return (
<div style={{ padding: "2rem", textAlign: "center" }}>
<h1>Merci pour votre paiement ! 🎉</h1>
<p>Vous allez être redirigé vers votre frigo...</p>
</div>
);
}