#!/bin/bash
echo "Restaurando tema original corporativo azul..."
cp apps/web/tailwind.config.js.bak apps/web/tailwind.config.js
cp apps/web/src/app/globals.css.bak apps/web/src/app/globals.css
cp apps/web/src/components/layout/Sidebar.tsx.bak apps/web/src/components/layout/Sidebar.tsx
cp apps/web/src/components/layout/MobileMenu.tsx.bak apps/web/src/components/layout/MobileMenu.tsx
cp apps/web/src/components/layout/SidebarNav.tsx.bak apps/web/src/components/layout/SidebarNav.tsx
echo "¡Tema restaurado con éxito!"
