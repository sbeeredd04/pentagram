"use client";

import { useState, useEffect } from 'react';
import { AuthModal } from './components/AuthModal'; 
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = sessionStorage.getItem('user');
    if (!user) {
      setAuthModalOpen(true); // Show modal if no user is logged in
    }
  }, []);

  const handleClose = () => {
    setAuthModalOpen(false);
  };

  return (
    <html lang="en">
      <head>
        <style>{`
          body { 
            font-family: ${geistSans.variable}, sans-serif; 
            --font-mono: ${geistMono.variable};
          }
        `}</style>
      </head>
      <body className="antialiased">
        {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={handleClose} />}
        {children}
      </body>
    </html>
  );
}