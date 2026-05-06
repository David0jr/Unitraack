-- Add audit columns to entry_requests
ALTER TABLE entry_requests ADD COLUMN IF NOT EXISTS approved_leader_by UUID REFERENCES profiles(id);
ALTER TABLE entry_requests ADD COLUMN IF NOT EXISTS approved_gestor_by UUID REFERENCES profiles(id);
ALTER TABLE entry_requests ADD COLUMN IF NOT EXISTS check_in_by UUID REFERENCES profiles(id);

-- Add audit columns to materials
ALTER TABLE materials ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
ALTER TABLE materials ADD COLUMN IF NOT EXISTS entry_at TIMESTAMPTZ;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS exit_at TIMESTAMPTZ;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS check_in_by UUID REFERENCES profiles(id);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS check_out_by UUID REFERENCES profiles(id);

-- Ensure material_movements has what it needs
CREATE TABLE IF NOT EXISTS material_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    material_id UUID REFERENCES materials(id),
    from_sector_id UUID REFERENCES sectors(id),
    to_sector_id UUID REFERENCES sectors(id),
    moved_by UUID REFERENCES profiles(id),
    moved_at TIMESTAMPTZ DEFAULT NOW()
);
