FlowNote — Productivity Workspace for Notes, Todos & Planning

A fast, modern, Trello-inspired productivity app built with Next.js, Prisma, and Stack Auth.

🚀 Overview

FlowNote is a full-stack productivity application designed to centralize notes, todos, task boards, and planning into a single, customizable workspace.
Inspired by Notion, Trello, and Apple Notes — but fully engineered from scratch.

This app showcases real-world full-stack engineering, including:

Authentication & RBAC with Stack Auth

Full CRUD for Notes, Notebooks, Todos, and Plans

Drag-and-drop Kanban board

Color-coded importance levels

Server Actions for real-time persistence

Mobile-optimized UI with collapsible side panels

Prisma + PostgreSQL backend

Interactive UI with Framer Motion

✨ Features
📝 Notes System

Create, edit, delete notes

Organize notes into Notebooks

Mobile-friendly toggleable notebook sidebar

Importance-based color labels

Drag-and-drop support (optional)

✅ Todos

Status workflow: To-Do → In Progress → Completed

Auto-save when toggling checkboxes

Priority badges with icons

Drag-and-drop across columns

Edit and update tasks instantly

Due date indicators

📚 Notebooks

Create, rename, delete notebooks

Filter notes by notebook

Clean visual navigation for desktop & mobile

🗂️ Planning Columns

Fully toggleable columns

Drag-and-drop tasks between sections

Highly customizable layout

📱 Mobile-First UX

Collapsible notebooks

Slide-out sidebars

Touch-friendly drag and drop

Smooth animations

🛠️ Tech Stack
Frontend

Next.js 15 (App Router)

React 19

Tailwind CSS + DaisyUI

TypeScript

Framer Motion (animations)

DnD Kit (drag-and-drop)

Backend

Prisma ORM

PostgreSQL (Neon)

Stack Auth (authentication)

Deployment

Vercel

Github Actions (optional)

📂 Project Structure
/app
  ├─ notes/
  │   ├─ page.tsx
  │   ├─ [notebookId]/
  ├─ todos/
  ├─ components/
  ├─ api/
  └─ actions/

prisma/
  ├─ schema.prisma
  └─ migrations/

public/
  ├─ icons/
  └─ logo.png

🔐 Authentication

FlowNote uses Stack Auth for:

User sessions

User metadata

Protected routes

Server-side identity in server actions

This ensures secure access to user-specific Notes, Todos, and Plans.

🗄️ Database Models (Prisma)

Includes (sample):

User

Notebook

Note

Todo

Plan

Activity (optional)

🧭 Roadmap

 Search bar for notes & todos

 AI note summarization

 Sidebar customization

 Dark Mode

 Public sharable notes

 File uploads & attachments

 🙌 Author

Esteban Machuca
Full-Stack Developer — Fort Worth, TX
📧 estebanmcodes@gmail.com

🔗 GitHub: https://github.com/estbnn22
