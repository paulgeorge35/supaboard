-- @param {String} $1:feedbackId - The feedback ID of the feedback merging into
-- @param $2:feedbackIds - The IDs of the feedbacks being merged

UPDATE "Vote" as vote
SET "mergedFromId" = "feedbackId", "feedbackId" = $1
WHERE "feedbackId" = ANY($2)
    AND "authorId" NOT IN (
        SELECT "authorId" FROM "Vote" WHERE "feedbackId" = $1
    )