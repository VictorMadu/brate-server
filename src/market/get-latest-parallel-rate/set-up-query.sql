DROP FUNCTION IF EXISTS populate_parallel_rates_for_test_set_up;

CREATE FUNCTION populate_parallel_rates_for_test_set_up() RETURNS void AS $$
DECLARE
  currencies CHAR(3)[] = ARRAY['USD', 'EUR', 'NGN', 'CAD', 'JPY', 'CHF', 'GBP', 'NAD', 'NZD', 'XAF', 'XAG'];
  rates NUMERIC(16, 6)[] = ARRAY[1.008, 1, 420, 1.3, 140, 0.98, 0.85, 16, 1.64, 657, 0.054];
  currencies_len INT = array_length(currencies, 1);
  rates_len INT = array_length(rates, 1);
  curr_time_in_num NUMERIC = EXTRACT(EPOCH FROM NOW());
  set_time TIMESTAMPTZ;
BEGIN 
  IF currencies_len <> rates_len THEN
    RAISE EXCEPTION 'Length of currencies % is different from rates which of length %', currencies_len, rates_len;
  END IF;

  FOR i IN 0..100 LOOP 
    set_time = to_timestamp(curr_time_in_num - i * 60 * 60);

    FOR j IN 1..currencies_len LOOP
        INSERT INTO parallel_rates (currency_id, rate, time) VALUES (currencies[j], rates[j], set_time);
        rates[j] = rates[j] + rates[j] * (random() - 0.5) * 0.04;
    END LOOP;

  END LOOP;
END;
$$ LANGUAGE PLPGSQL;

SELECT populate_parallel_rates_for_test_set_up();