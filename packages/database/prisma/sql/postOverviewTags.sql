SELECT
    CAST(COUNT(*) as INTEGER) as total,
    tag.name as name
FROM 
    "Feedback" as feedback
    JOIN "_FeedbackToTag" as "feedbackToTag" 
        ON feedback."id" = "feedbackToTag"."A"
    JOIN "Tag" as tag 
        ON "feedbackToTag"."B" = tag.id
    JOIN "Board" as board 
        ON feedback."boardId" = board.id
WHERE 
    feedback."applicationId" = $1 
    AND board."slug" = $2
    AND feedback."createdAt" >= $3
    AND feedback."createdAt" <= $4
GROUP BY 
    tag.name;