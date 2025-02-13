SELECT
    CAST(COUNT(*) as INTEGER) as total,
    board.slug as "boardSlug",
    board.name as name
FROM 
    "Feedback" as feedback
    JOIN "Board" as board
        ON feedback."boardId" = board.id
WHERE 
    feedback."applicationId" = $1
    AND feedback."createdAt" >= $2
    AND feedback."createdAt" <= $3
GROUP BY
    board.slug,
    board.name
;