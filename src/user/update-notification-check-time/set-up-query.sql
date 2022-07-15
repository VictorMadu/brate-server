-- PLPGSQL function for creating necessary data for API testing of this route

DROP FUNCTION IF EXISTS  get_notification_list_test_set_up;
CREATE FUNCTION get_notification_list_test_set_up() RETURNS VOID 
AS $$
DECLARE
    _user_id uuid = 'e027bbec-bfb6-493f-b219-741bd86a126b';
    _user users%ROWTYPE;
    user_verification_detail user_verification_details%ROWTYPE;
    curr_time TIMESTAMPTZ = NOW();
    a_day_ago TIMESTAMPTZ = to_timestamp(EXTRACT (EPOCH FROM curr_time) - 1 * 24* 60 * 60);
    a_day_and_half_ago TIMESTAMPTZ = to_timestamp(EXTRACT (EPOCH FROM curr_time) - 1.5 * 24* 60 * 60);
    two_day_ago TIMESTAMPTZ = to_timestamp(EXTRACT (EPOCH FROM curr_time) - 2 * 24* 60 * 60);
BEGIN
    INSERT INTO user_verification_details 
    (one_time_password, created_at, tried_passwords, tried_passwords_at) 
    VALUES 
        ('ed49dcdf', NOW(), ARRAY['ed49dcdf']::TEXT[], ARRAY[NOW()]::TIMESTAMPTZ[])
    RETURNING * INTO user_verification_detail;

    INSERT INTO users (user_id, email, name, password, phone, created_at, verification_details)
    VALUES 
        (_user_id, 'test1@gmail.com', 'Benz Timo', '$2a$12$RlStJjWLB.Z0fI4P/wl9.ebT1.uhdZ5fuQPieiEwhawTppFv7LqXW', '+2348095968956
', NOW(), ARRAY[user_verification_detail.user_verification_details_id]::uuid[])
    RETURNING * INTO _user; 

    INSERT INTO web_clients (user_id, language, notification_check_at)
    VALUES (_user_id, 'English', ARRAY[a_day_and_half_ago]::TIMESTAMPTZ[]);
   

  INSERT INTO notifications (msg, user_id, created_at,type)  
  VALUES 
    ('This is msg 1', _user.user_id, curr_time, 'P'), 
    ('This is msg 2', _user.user_id, curr_time, 'P'),
    ('This is msg 3', _user.user_id, a_day_ago, 'P'),
    ('This is msg 4', _user.user_id, a_day_ago, 'P'), 
    ('This is msg 5', _user.user_id, two_day_ago, 'P'),
    ('This is msg 6', _user.user_id, two_day_ago, 'P'),
    ('This is msg 7', _user.user_id, curr_time, 'F'), 
    ('This is msg 8', _user.user_id, curr_time, 'F'), 
    ('This is msg 9', _user.user_id, a_day_ago, 'F'), 
    ('This is msg 10', _user.user_id, a_day_ago, 'F'), 
    ('This is msg 11', _user.user_id, two_day_ago, 'F'),
    ('This is msg 12', _user.user_id, two_day_ago, 'F'),
    ('This is msg 13', _user.user_id, curr_time, 'T'), 
    ('This is msg 14', _user.user_id, curr_time, 'T'), 
    ('This is msg 15', _user.user_id, a_day_ago, 'T'), 
    ('This is msg 16', _user.user_id, a_day_ago, 'T'), 
    ('This is msg 17', _user.user_id, two_day_ago, 'T'),
    ('This is msg 18', _user.user_id, two_day_ago, 'T');
RETURN;
END;
$$ LANGUAGE PLPGSQL;


SELECT get_notification_list_test_set_up();

