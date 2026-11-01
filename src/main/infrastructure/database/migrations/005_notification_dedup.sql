CREATE UNIQUE INDEX idx_notifications_auto_unique
ON notifications(user_id,type,reference_type,reference_id)
WHERE reference_type LIKE 'auto:%';
