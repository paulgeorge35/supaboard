-- @param {String} $1:feedbackId - The feedback ID of the feedback to unmerge votes for

UPDATE "Vote" as vote
SET "feedbackId" = vote."mergedFromId", "mergedFromId" = NULL
WHERE "mergedFromId" = $1;