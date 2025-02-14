/**
 * Get the last activity, comments, votes, and posts of a user in a given time range
 * @param applicationId The ID of the application
 * @param startDate The start date of the time range
 * @param endDate The end date of the time range
 * @param order The order of the results
 * @param limit The limit of the results
 * @param offset The offset of the results
 * @returns The last activity, comments, votes, and posts of a user in a given time range
 */

SELECT 
    u.id,
    u.name,
    u.email,
    u.avatar,
    MAX(a."createdAt") as "last-activity",
    CAST(COUNT(DISTINCT comments."id") as INTEGER) as "comments",
    CAST(COUNT(DISTINCT votes."id") as INTEGER) as "votes",
    CAST(COUNT(DISTINCT posts."id") as INTEGER) as "posts"
FROM "User" as u
    LEFT JOIN (
            SELECT activity."createdAt", activity.id, activity."authorId", activity."feedbackId"
            FROM "Activity" as activity
                JOIN "Feedback" as feedback
                    ON activity."feedbackId" = feedback.id
                    AND feedback."applicationId" = $1
                    AND activity."createdAt" >= $2
                    AND activity."createdAt" <= $3
        ) as a 
        ON u.id = a."authorId" 
    LEFT JOIN (
            SELECT activity."createdAt", activity.id, activity."authorId", activity."feedbackId"
            FROM "Activity" as activity
                JOIN "Feedback" as feedback
                    ON activity."feedbackId" = feedback.id
                    AND feedback."applicationId" = $1
                    AND activity."createdAt" >= $2
                    AND activity."createdAt" <= $3
                    AND activity."type" = 'FEEDBACK_COMMENT'
        ) as comments 
        ON a."feedbackId" = comments."feedbackId" 
    LEFT JOIN (
            SELECT activity."createdAt", activity.id, activity."authorId", activity."feedbackId"
            FROM "Activity" as activity
                JOIN "Feedback" as feedback
                    ON activity."feedbackId" = feedback.id
                    AND feedback."applicationId" = $1
                    AND activity."createdAt" >= $2
                    AND activity."createdAt" <= $3
                    AND activity."type" = 'FEEDBACK_VOTE'
        ) as votes 
        ON a."feedbackId" = votes."feedbackId" 
    LEFT JOIN (
            SELECT activity."createdAt", activity.id, activity."authorId", activity."feedbackId"
            FROM "Activity" as activity
                JOIN "Feedback" as feedback
                    ON activity."feedbackId" = feedback.id
                    AND feedback."applicationId" = $1
                    AND activity."createdAt" >= $2
                    AND activity."createdAt" <= $3
                    AND activity."type" = 'FEEDBACK_CREATE'
        ) as posts 
        ON a."feedbackId" = posts."feedbackId" 
WHERE
    LOWER(u.name) LIKE LOWER(CONCAT('%', CAST($7 AS TEXT), '%'))
GROUP BY 
    u.id,
    u.name,
    u.email,
    u.avatar
HAVING
    CAST(COUNT(DISTINCT comments."id") as INTEGER) >= $8
    AND CAST(COUNT(DISTINCT votes."id") as INTEGER) >= $9
    AND CAST(COUNT(DISTINCT posts."id") as INTEGER) >= $10
ORDER BY
    $4 DESC
LIMIT $5
OFFSET $6
;