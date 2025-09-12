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
description: "Mon Frigo : une application simple et intelligente pour gérer vos aliments, éviter le gaspillage et économiser de l’argent.",
manifest: "/manifest.json",
themeColor: "#2196f3",
icons: {
icon: "/frigo.png",
apple: "/frigo.png"
}
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
