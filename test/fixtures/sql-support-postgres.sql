\set ON_ERROR_STOP on
\set QUIET 1
\pset tuples_only on
\pset format unaligned
\pset fieldsep '|'
\pset null '[NULL]'

CREATE TEMP TABLE employees(id integer PRIMARY KEY, department text, salary integer, note text);
INSERT INTO employees VALUES (1, 'a', 10, NULL), (2, 'a', 30, 'lead'), (3, 'b', 20, NULL);
CREATE TEMP TABLE training(employee_id integer);
INSERT INTO training VALUES (NULL);
CREATE TEMP TABLE customers(id integer PRIMARY KEY);
INSERT INTO customers VALUES (1), (2);
CREATE TEMP TABLE orders(id integer PRIMARY KEY, customer_id integer, status text, amount integer);
INSERT INTO orders VALUES (10, 1, 'paid', 10), (11, 1, 'paid', 20), (12, 2, 'pending', 30);
CREATE TEMP TABLE order_tags(order_id integer, tag text);
INSERT INTO order_tags VALUES (10, 'a'), (10, 'b'), (10, 'c'), (11, 'a'), (11, 'b'), (11, 'c');
CREATE TEMP TABLE scores(player text, points integer);
INSERT INTO scores VALUES ('Ada', 20), ('Ada', 10), ('Ben', 15);
CREATE TEMP TABLE tickets(id integer PRIMARY KEY, team text, created_at timestamp);
INSERT INTO tickets VALUES (1, 'red', '2026-01-01 09:00'), (2, 'red', '2026-01-01 10:00'), (3, 'blue', '2026-01-01 08:00');
CREATE TEMP TABLE account_events(id integer PRIMARY KEY, account_id integer, event_time timestamp, value text);
INSERT INTO account_events VALUES (1, 1, '2026-01-01 09:00', 'alpha'), (2, 1, '2026-01-01 10:00', 'beta'), (3, 1, '2026-01-01 11:00', 'gamma');
CREATE TEMP TABLE user_events(id integer PRIMARY KEY, user_id integer, created_at timestamp);
INSERT INTO user_events VALUES (1, 1, '2026-01-01 09:00'), (2, 1, '2026-01-01 10:00'), (3, 1, '2026-01-01 10:00'), (4, 2, '2026-01-01 08:00');
\set QUIET 0

\echo logical-processing
SELECT player || ':' || points FROM (
  SELECT player, points, ROW_NUMBER() OVER (PARTITION BY player ORDER BY points DESC) AS rn
  FROM scores
) ranked WHERE rn = 1 ORDER BY player;

\echo null-not-in-count
SELECT COUNT(*) FROM employees WHERE id NOT IN (SELECT employee_id FROM training);
\echo null-not-exists
SELECT id FROM employees e WHERE NOT EXISTS (SELECT 1 FROM training t WHERE t.employee_id = e.id) ORDER BY id;

\echo count-null
SELECT COUNT(*) || '|' || COUNT(note) FROM employees;

\echo join-multiplication
SELECT COUNT(*) FROM orders o JOIN order_tags t ON t.order_id = o.id WHERE o.customer_id = 1;

\echo left-join-filter
SELECT c.id || '|' || COUNT(o.id) FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'
GROUP BY c.id ORDER BY c.id;

\echo group-having
SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) >= 2 ORDER BY customer_id;

\echo conditional-aggregation
SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) FROM orders;

\echo exists-semi-join
SELECT c.id FROM customers c WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'paid'
) ORDER BY c.id;

\echo correlated-subquery
SELECT e.id FROM employees e WHERE e.salary > (
  SELECT AVG(peer.salary) FROM employees peer WHERE peer.department = e.department
) ORDER BY e.id;

\echo cte-boundary
WITH paid AS (SELECT customer_id, SUM(amount) AS total FROM orders WHERE status = 'paid' GROUP BY customer_id)
SELECT customer_id || '|' || total FROM paid ORDER BY customer_id;

\echo window-partition-order
SELECT id || '|' || ROW_NUMBER() OVER (PARTITION BY team ORDER BY created_at, id)
FROM tickets ORDER BY id;

\echo window-default-frame
SELECT id || '|' || SUM(amount) OVER (ORDER BY amount)
FROM (VALUES (1, 10), (2, 10), (3, 20)) AS rows(id, amount) ORDER BY id;

\echo window-last-value-frame
SELECT id || '|' || LAST_VALUE(value) OVER (
  PARTITION BY account_id ORDER BY event_time, id
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
) FROM account_events ORDER BY id;

\echo postgres-distinct-on
SELECT user_id || '|' || id FROM (
  SELECT DISTINCT ON (user_id) user_id, id
  FROM user_events
  ORDER BY user_id, created_at DESC, id DESC
) latest ORDER BY user_id;
