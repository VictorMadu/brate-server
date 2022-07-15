
-- Clean up function after test
DROP FUNCTION IF EXISTS clean_notification_list_test_set_up;

CREATE FUNCTION clean_notification_list_test_set_up() RETURNS VOID 
AS $$
DECLARE
    _user_id uuid = 'e027bbec-bfb6-493f-b219-741bd86a126b';
BEGIN
    DELETE FROM notifications n
    USING users u
    WHERE u.user_id = _user_id AND u.user_id = n.user_id;

    DELETE FROM web_clients w 
    USING users u 
    WHERE u.user_id = _user_id;

    DELETE FROM user_verification_details v
    USING users u
    WHERE u.user_id = _user_id AND v.user_verification_details_id = ANY(u.verification_details); 

    DELETE FROM users 
    WHERE users.user_id = _user_id;
RETURN;
END;
$$ LANGUAGE PLPGSQL;

SELECT clean_notification_list_test_set_up();