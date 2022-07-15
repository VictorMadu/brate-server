-- PLPGSQL function for creating necessary data for API testing of this route

DROP FUNCTION IF EXISTS  delete_notification_list_test_set_up;
CREATE FUNCTION delete_notification_list_test_set_up() RETURNS VOID 
AS $$
DECLARE
    _user_id uuid = 'e027bbec-bfb6-493f-b219-741bd86a126b';
BEGIN
    INSERT INTO user_verification_details 
        one_time_password, created_at, tried_passwords, tried_passwords_at) 
    VALUES 
        ('ed49dcdf', NOW(), ARRAY['ed49dcdf']::TEXT[], ARRAY[NOW()]::TIMESTAMPTZ[])
    RETURNING * INTO user_verification_detail;

    INSERT INTO users (user_id, email, name, password, phone, created_at, verification_details)
    VALUES 
        (_user_id, 'test1@gmail.com', 'Vick Ma', '$2a$12$RlStJjWLB.Z0fI4P/wl9.ebT1.uhdZ5fuQPieiEwhawTppFv7LqXW', '+2348095968956', NOW(), ARRAY[user_verification_detail.user_verification_details_id]::uuid[])
    RETURNING * INTO _user; 

    INSERT INTO web_clients (user_id, language, notification_check_at)
    VALUES (_user_id, 'English', ARRAY[a_day_and_half_ago]::TIMESTAMPTZ[]);
RETURN;
END;
$$ LANGUAGE PLPGSQL;


SELECT delete_notification_list_test_set_up();

