ALTER TABLE materials ADD COLUMN pending_sector_id uuid REFERENCES sectors(id);
