-- Data repair, not a schema change.
--
-- The bundled demo dataset shipped six tasks with priority
-- 'not_urgent_important', which is not one of the four Eisenhower quadrants the
-- app defines. Anyone who restored that backup ended up with rows whose
-- priority had no entry in the renderer's lookup table, and the Tasks panel
-- threw on render.
--
-- 'not_urgent_important' and 'important_not_urgent' describe the same quadrant,
-- so the intent is unambiguous — map it onto the canonical value. Anything else
-- unrecognised falls back to the lowest quadrant rather than being guessed at.
UPDATE tasks SET priority = 'important_not_urgent' WHERE priority = 'not_urgent_important';
--> statement-breakpoint
UPDATE tasks SET priority = 'not_urgent_not_important'
WHERE priority NOT IN (
  'urgent_important',
  'important_not_urgent',
  'urgent_not_important',
  'not_urgent_not_important'
);
