import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SideBar from "@/components/sideBar";
import mobileBar from "@/components/mobileBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowNote — Smart Notes, Tasks & Productivity Dashboard",
  description:
    "FlowNote is a fast, interactive productivity workspace with notebooks, drag-and-drop todos, real-time status updates, and a clean modern dashboard experience.",
  keywords: [
    "notes app",
    "todo app",
    "productivity dashboard",
    "task manager",
    "notebooks",
    "Next.js app",
    "kanban board",
  ],
  authors: [{ name: "Esteban M" }],
  creator: "Esteban M",
  openGraph: {
    title: "FlowNote — Smart Productivity Dashboard",
    description:
      "Organize notes, manage tasks, and stay productive with drag-and-drop workflows, notebooks, and real-time updates.",
    url: "https://flow-note-eta.vercel.app/",
    siteName: "FlowNote",
    type: "website",
    images: [
      {
        url: "/og-flownote.png",
        width: 1200,
        height: 630,
        alt: "FlowNote — Productivity Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowNote — Smart Notes & Tasks",
    description:
      "A modern productivity dashboard with notebooks, kanban tasks, and real-time interactions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="FlowNote">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StackProvider app={stackClientApp}>
          <StackTheme>{children}</StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
