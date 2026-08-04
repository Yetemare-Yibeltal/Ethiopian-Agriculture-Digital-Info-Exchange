-- =============================================
-- TRIGGER: update_expiry
-- Description: Auto-calculate expiry_date from harvest_date + shelf_life_days
-- Dependencies: 003_create_listings.sql
-- =============================================

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS trigger_update_expiry
ON listings;

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS update_expiry_date
();

-- Create the function that calculates expiry date
CREATE OR REPLACE FUNCTION update_expiry_date
()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if both harvest_date and shelf_life_days are provided
  IF NEW.harvest_date IS NOT NULL AND NEW.shelf_life_days IS NOT NULL THEN
        -- Calculate expiry date by adding shelf_life_days to harvest_date
        NEW.expiry_date :=
  (NEW.harvest_date +
  (NEW.shelf_life_days || ' days')::INTERVAL)::DATE;
ELSIF NEW.harvest_date IS NOT NULL AND NEW.shelf_life_days IS NULL THEN
        -- If only harvest_date is provided, use default shelf life of 7 days
        NEW.expiry_date :=
(NEW.harvest_date + INTERVAL '7 days')::DATE;
        NEW.shelf_life_days := 7;
    ELSE
        -- If harvest_date is NULL, set expiry_date to NULL
        NEW.expiry_date := NULL;
END
IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that runs before insert or update on listings
CREATE TRIGGER trigger_update_expiry
    BEFORE
INSERT OR
UPDATE OF harvest_date, shelf_life_days ON listings
    FOR EACH ROW
EXECUTE FUNCTION update_expiry_date
();

COMMENT ON TRIGGER trigger_update_expiry ON listings IS 'Auto-calculates expiry_date from harvest_date and shelf_life_days';
COMMENT ON FUNCTION update_expiry_date IS 'Calculates expiry date based on harvest date and shelf life days';