import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./styles/tabbar.css";
import SWRegister from "./SWRegister"; // import du composant client

const geistSans = Geist({
variable: "--font-geist-sans",
subsets: ["latin"],
});

const geistMono = Geist_Mono({
variable: "--font-geist-mono",
subsets: ["latin"],
});

export const metadata: Metadata = {
title: "Mon Frigo",
description: "Application intelligente pour gérer votre frigo, éviter le gaspillage alimentaire et économiser du temps et de l’argent.",
manifest: "/manifest.json",
themeColor: "#2196f3",
icons: {
icon: "/frigo.png",
apple: "/frigo.png",
},
openGraph: {
title: "Mon Frigo - Votre assistant anti-gaspillage",
description: "Recevez des alertes intelligentes avant la date de péremption et simplifiez la gestion de vos aliments.",
url: "https://monfrigo.dev",
siteName: "Mon Frigo",
images: [
{
url: "/frigo.png", // mets une image carrée ou rectangulaire (1200x630 conseillé)
width: 1200,
height: 630,
alt: "Mon Frigo - application anti-gaspillage",
},
],
locale: "fr_FR",
type: "website",
},
};

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<html lang="fr">
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
<SWRegister /> {/* enregistrement du SW + FCM */}
{children}
</body>
</html>
);
}
