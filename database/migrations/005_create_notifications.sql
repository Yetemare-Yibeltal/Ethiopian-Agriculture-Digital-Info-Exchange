-- =============================================
-- MIGRATION: 005_create_notifications.sql
-- Description: Create notifications table for system notifications
-- Dependencies: 001_create_profiles.sql
-- =============================================

-- =============================================
-- 1. CREATE NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'in_app')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    related_type TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'System notifications for all users';
COMMENT ON COLUMN notifications.id IS 'Primary key, unique identifier for each notification';
COMMENT ON COLUMN notifications.user_id IS 'The user who receives the notification, references profiles.id';
COMMENT ON COLUMN notifications.type IS 'Notification channel: sms, email, or in_app';
COMMENT ON COLUMN notifications.title IS 'Notification title/short summary';
COMMENT ON COLUMN notifications.message IS 'Full notification message content';
COMMENT ON COLUMN notifications.related_id IS 'ID of the related entity (listing, offer, etc.)';
COMMENT ON COLUMN notifications.related_type IS 'Type of the related entity (listing, offer, farmer)';
COMMENT ON COLUMN notifications.metadata IS 'Additional JSON metadata for the notification';
COMMENT ON COLUMN notifications.is_read IS 'Whether the user has read the notification';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when the notification was read';
COMMENT ON COLUMN notifications.created_at IS 'Timestamp when the notification was created';

-- =============================================
-- 2. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_id, related_type);

-- =============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3.1 Users can view their own notifications
DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- 3.2 Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 3.3 Users can delete their own notifications
DROP POLICY IF EXISTS notifications_delete_own ON notifications;
CREATE POLICY notifications_delete_own ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- 3.4 Admins can view all notifications
DROP POLICY IF EXISTS notifications_select_admin ON notifications;
CREATE POLICY notifications_select_admin ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3.5 Admins can delete any notification
DROP POLICY IF EXISTS notifications_delete_admin ON notifications;
CREATE POLICY notifications_delete_admin ON notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- 4. FUNCTIONS FOR NOTIFICATION MANAGEMENT
-- =============================================

-- 4.1 Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_id,
        related_type,
        metadata
    )
    VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_related_id,
        p_related_type,
        p_metadata
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

COMMENT ON FUNCTION create_notification IS 'Creates a new notification and returns its ID';

-- 4.2 Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE notifications
    SET is_read = true,
        read_at = NOW()
    WHERE id = p_notification_id
      AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION mark_notification_read IS 'Marks a notification as read if it belongs to the user';

-- 4.3 Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    WITH updated AS (
        UPDATE notifications
        SET is_read = true,
            read_at = NOW()
        WHERE user_id = p_user_id
          AND is_read = false
        RETURNING id
    )
    SELECT COUNT(*) INTO updated_count FROM updated;
    
    RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION mark_all_notifications_read IS 'Marks all notifications as read for a user and returns count';

-- 4.4 Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM notifications
    WHERE user_id = p_user_id
      AND is_read = false;
    
    RETURN unread_count;
END;
$$;

COMMENT ON FUNCTION get_unread_notification_count IS 'Returns the number of unread notifications for a user';

-- 4.5 Function to get notifications for a user with pagination
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_is_read BOOLEAN DEFAULT NULL,
    p_type TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    related_id UUID,
    related_type TEXT,
    metadata JSONB,
    is_read BOOLEAN,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    offset_val INTEGER;
    total BIGINT;
BEGIN
    offset_val = (p_page - 1) * p_limit;

    -- Get total count
    SELECT COUNT(*)
    INTO total
    FROM notifications
    WHERE user_id = p_user_id
      AND (p_is_read IS NULL OR is_read = p_is_read)
      AND (p_type IS NULL OR type = p_type);

    RETURN QUERY
    SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.related_id,
        n.related_type,
        n.metadata,
        n.is_read,
        n.read_at,
        n.created_at,
        total AS total_count
    FROM notifications n
    WHERE n.user_id = p_user_id
      AND (p_is_read IS NULL OR n.is_read = p_is_read)
      AND (p_type IS NULL OR n.type = p_type)
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION get_user_notifications IS 'Retrieves notifications for a user with pagination and filters';

-- 4.6 Function to delete old read notifications
CREATE OR REPLACE FUNCTION delete_old_notifications(
    p_user_id UUID,
    p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM notifications
        WHERE user_id = p_user_id
          AND is_read = true
          AND created_at < NOW() - (p_days_old || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION delete_old_notifications IS 'Deletes read notifications older than specified days';

-- 4.7 Function to broadcast notification to multiple users
CREATE OR REPLACE FUNCTION broadcast_notification(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_user_ids UUID[],
    p_related_id UUID DEFAULT NULL,
    p_related_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_id,
        related_type,
        metadata
    )
    SELECT
        unnest(p_user_ids),
        p_type,
        p_title,
        p_message,
        p_related_id,
        p_related_type,
        p_metadata
    WHERE array_length(p_user_ids, 1) > 0;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$;

COMMENT ON FUNCTION broadcast_notification IS 'Sends a notification to multiple users at once';

-- 4.8 Function to create offer notifications
CREATE OR REPLACE FUNCTION create_offer_notifications()
RETURNS TRIGGER AS $$
DECLARE
    manager_id_val UUID;
    manager_name TEXT;
    buyer_name TEXT;
    product_name TEXT;
BEGIN
    -- Get listing manager and product name
    SELECT l.manager_id, l.product_name
    INTO manager_id_val, product_name
    FROM listings l
    WHERE l.id = NEW.listing_id;

    -- Get buyer name
    SELECT p.full_name
    INTO buyer_name
    FROM profiles p
    WHERE p.id = NEW.buyer_id;

    -- Get manager name
    SELECT p.full_name
    INTO manager_name
    FROM profiles p
    WHERE p.id = manager_id_val;

    -- Create notification for manager
    IF manager_id_val IS NOT NULL THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            related_id,
            related_type,
            metadata
        )
        VALUES (
            manager_id_val,
            'in_app',
            'New Offer Received',
            buyer_name || ' has made an offer on your listing for ' || product_name || ' at ' || NEW.offered_price || ' Birr per quintal.',
            NEW.id,
            'offer',
            jsonb_build_object(
                'buyer_name', buyer_name,
                'product_name', product_name,
                'offered_price', NEW.offered_price,
                'quantity', NEW.quantity_quintals
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_offer_notifications IS 'Auto-creates notification when a new offer is made';

-- 4.9 Trigger to auto-create notification on offer creation
DROP TRIGGER IF EXISTS trigger_offer_notification ON offers;

CREATE TRIGGER trigger_offer_notification
    AFTER INSERT ON offers
    FOR EACH ROW
    EXECUTE FUNCTION create_offer_notifications();

-- =============================================
-- 5. ANALYZE TABLE FOR PERFORMANCE
-- =============================================
ANALYZE notifications;