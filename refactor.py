import os
import re

files_to_refactor = [
    "apps/web/src/components/obras/NewObraButton.tsx",
    "apps/web/src/components/facturacion/NewInvoiceButton.tsx",
    "apps/web/src/components/mantenimiento/NewMaintenanceButton.tsx",
    "apps/web/src/components/fletes/NewFleteButton.tsx",
    "apps/web/src/components/camiones/NewCamionButton.tsx",
    "apps/web/src/components/choferes/NewChoferButton.tsx"
]

for file_path in files_to_refactor:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, 'r') as f:
        content = f.read()
        
    if "useRouter" not in content:
        content = content.replace("import { useState, useCallback } from 'react'", "import { useState, useCallback } from 'react'\nimport { useRouter } from 'next/navigation'")
        
    # Find the component name and add useRouter inside
    # e.g. export function NewObraButton() {
    def add_router_hook(match):
        return f"{match.group(0)}\n  const router = useRouter()"
        
    content = re.sub(r'export function [A-Za-z0-9_]+\([^)]*\) \{', add_router_hook, content)
    
    # Replace window.location.reload()
    content = re.sub(r'// Recarga la página.*\n\s*window\.location\.reload\(\)', 'router.refresh()', content)
    content = re.sub(r'window\.location\.reload\(\)', 'router.refresh()', content)
    
    # Update dependency array
    content = re.sub(r'\}, \[\]\)', '}, [router])', content)
    
    with open(file_path, 'w') as f:
        f.write(content)
        
    print(f"Refactored: {file_path}")
