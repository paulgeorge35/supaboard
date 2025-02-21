-- @param {String} $1:feedbackId - The feedback ID of the feedback to unmerge activities for

UPDATE "Activity" as activity
SET "feedbackId" = activity."mergedFromId", "mergedFromId" = NULL
WHERE "mergedFromId" = $1;