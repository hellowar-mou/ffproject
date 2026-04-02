
SELECT id, name
FROM restaurants
WHERE name = 'Tasty Bites';


SELECT branch_id, restaurant_id, status
FROM restaurant_branches
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tasty Bites');


SELECT COUNT(*) AS total_orders
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN food_items fi ON fi.food_id = oi.food_id
JOIN restaurant_branches rb ON rb.branch_id = fi.branch_id
WHERE rb.restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tasty Bites');


SELECT
  fi.food_id,
  fi.name,
  SUM(oi.quantity) AS items_sold,
  SUM(oi.quantity * oi.updated_price) AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN food_items fi ON fi.food_id = oi.food_id
JOIN restaurant_branches rb ON rb.branch_id = fi.branch_id
WHERE rb.restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tasty Bites')
  AND o.placed_at >= SYSTIMESTAMP - NUMTODSINTERVAL(30, 'DAY')
GROUP BY fi.food_id, fi.name
ORDER BY items_sold DESC, revenue DESC;