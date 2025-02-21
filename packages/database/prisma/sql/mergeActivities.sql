-- @param {String} $1:feedbackId - The feedback ID of the feedback merging into
-- @param $2:feedbackIds - The IDs of the feedbacks being merged

UPDATE "Activity" as activity
SET "mergedFromId" = "feedbackId", "feedbackId" = $1
WHERE 
    "feedbackId" = ANY($2) 
    AND "type" IN ('FEEDBACK_COMMENT', 'FEEDBACK_VOTE', 'FEEDBACK_MERGE')