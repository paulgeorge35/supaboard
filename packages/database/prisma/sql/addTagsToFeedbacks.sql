-- @param $1:feedbackIds - Array of feedback IDs to which tags will be added
-- @param $2:tagIds - Array of tag IDs to add to the feedbacks

-- This inserts the relationship between feedbacks and tags in the join table
-- while avoiding duplicate entries for combinations that already exist
INSERT INTO "_FeedbackToTag" ("A", "B")
SELECT f.id, t.id
FROM unnest($1::text[]) AS f(id)
CROSS JOIN unnest($2::text[]) AS t(id)
WHERE NOT EXISTS (
    -- Skip combinations that already exist
    SELECT 1
    FROM "_FeedbackToTag"
    WHERE "A" = f.id AND "B" = t.id
); 