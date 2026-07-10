-- Migration: Inventory Module

CREATE TYPE item_category AS ENUM ('repuesto', 'herramienta', 'consumible', 'equipo', 'otro');

CREATE TABLE public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category item_category DEFAULT 'otro'::item_category NOT NULL,
    unit VARCHAR(50) DEFAULT 'unidad'::VARCHAR NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 0 NOT NULL,
    min_quantity NUMERIC(10,2) DEFAULT 0 NOT NULL,
    unit_cost NUMERIC(15,2) DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD'::character varying NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON public.inventory_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON public.inventory_items FOR DELETE TO authenticated USING (true);
