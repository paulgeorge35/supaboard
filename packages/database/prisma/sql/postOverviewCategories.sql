SELECT
    CAST(COUNT(*) as INTEGER) as total,
    category.name as name
FROM 
    "Feedback" as feedback
    JOIN "FeedbackCategory" as category
        ON feedback."categoryId" = category.id
    JOIN "Board" as board
        ON feedback."boardId" = board.id
WHERE 
    feedback."applicationId" = $1
    AND board."slug" = $2
    AND feedback."createdAt" >= $3
    AND feedback."createdAt" <= $4
GROUP BY
    category.name;