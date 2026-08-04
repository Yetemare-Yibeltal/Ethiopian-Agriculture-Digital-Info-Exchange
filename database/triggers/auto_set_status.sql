-- =============================================
-- TRIGGER: auto_set_status
-- Description: Automatically update listing status based on conditions
-- Dependencies: 003_create_listings.sql, 004_create_offers.sql
-- =============================================

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS trigger_auto_set_status
ON listings;

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS auto_set_listing_status
();

-- Create the function that updates listing status
CREATE OR REPLACE FUNCTION auto_set_listing_status
()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Check if listing should be marked as EXPIRED
  IF (NEW.status = 'active' OR NEW.status = 'reserved') AND NEW.expiry_date < CURRENT_DATE THEN
        NEW.status := 'expired';
  RETURN NEW;
END
IF;

    -- 2. Check if listing should be marked as COMPLETED
    -- (when all quantity is sold or marked as completed by manager)
    -- This is handled manually by manager, but we can auto-complete if quantity goes to 0
    IF NEW.quantity_quintals <= 0 AND NEW.status = 'active' THEN
        NEW.status := 'completed';
RETURN NEW;
END
IF;

    -- 3. If listing is reserved but was previously active
    -- (Reserved status is set by offer acceptance trigger in offers table)
    -- This is handled by the offers trigger, not here

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that runs before insert or update on listings
CREATE TRIGGER trigger_auto_set_status
    BEFORE
INSERT OR
UPDATE OF expiry_date, quantity_quintals, status ON listings
    FOR EACH ROW
EXECUTE FUNCTION auto_set_listing_status
();

COMMENT ON TRIGGER trigger_auto_set_status ON listings IS 'Automatically updates listing status based on expiry date and quantity';
COMMENT ON FUNCTION auto_set_listing_status IS 'Sets listing status to expired when expiry_date passes, or completed when quantity is zero';

-- =============================================
-- Additional Helper Function: Manually Update All Expired Listings
-- =============================================

CREATE OR REPLACE FUNCTION expire_all_expired_listings
()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
  WITH updated AS (
  UPDATE listings
        SET status = 'expired'
        WHERE status IN ('active', 'reserved')
    AND expiry_date < CURRENT_DATE
  RETURNING id
    )
  SELECT COUNT(*)
  INTO updated_count
  FROM updated;

  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION expire_all_expired_listings IS 'Manually expires all listings where expiry_date has passed. Returns count of updated listings.';

-- =============================================
-- Create a scheduled function to run expiry check daily
-- =============================================

CREATE OR REPLACE FUNCTION daily_expiry_check
()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    expired_count INTEGER;
    alert_count INTEGER;
    result TEXT;
BEGIN
  -- Expire all listings that have passed their expiry date
  SELECT expire_all_expired_listings()
  INTO expired_count;

  -- Get count of listings expiring in the next 3 days (for alerts)
  SELECT COUNT(*)
  INTO alert_count
  FROM listings
  WHERE status = 'active'
    AND expiry_date >= CURRENT_DATE
    AND expiry_date <= CURRENT_DATE + INTERVAL
  '3 days';

result := 'Expired ' || expired_count || ' listings. ' || alert_count || ' listings expiring in 3 days.';

RETURN result;
END;
$$;

COMMENT ON FUNCTION daily_expiry_check IS 'Runs daily expiry check: expires old listings and counts upcoming expirations for alert system.';