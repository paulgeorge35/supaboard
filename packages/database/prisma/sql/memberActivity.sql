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

SELECT DISTINCT
    feedback.id,
    feedback.title,
    feedback.description,
    feedback.status,
    feedback.slug,
    board.slug as "boardSlug",
    CAST(COUNT(DISTINCT comments."id") as INTEGER) as "comments",
    CAST(COUNT(DISTINCT votes."id") as INTEGER) as "votes",
    CAST(COUNT(DISTINCT posts."id") as INTEGER) as "posts",
    CAST(COUNT(DISTINCT "feedback-comments"."id") as INTEGER) as "totalComments",
    CAST(COUNT(DISTINCT "feedback-votes"."id") as INTEGER) as "totalVotes"
FROM "Feedback" as feedback
    JOIN "Board" as board
        ON feedback."boardId" = board.id
    LEFT JOIN "Activity" as "feedback-comments"
        ON feedback.id = "feedback-comments"."feedbackId"
        AND "feedback-comments"."type" = 'FEEDBACK_COMMENT'
    LEFT JOIN "Vote" as "feedback-votes"
        ON feedback.id = "feedback-votes"."feedbackId"
        -- AND "feedback-votes"."type" = 'FEEDBACK_VOTE'
    LEFT JOIN (
            SELECT activity."createdAt", activity.id, activity."authorId", activity."feedbackId"
            FROM "Activity" as activity
                JOIN "Feedback" as feedback
                    ON activity."feedbackId" = feedback.id
                    AND feedback."applicationId" = $1
                    AND activity."createdAt" >= $2
                    AND activity."createdAt" <= $3
                    AND activity."type" = 'FEEDBACK_COMMENT'
                    AND activity."authorId" = $4
        ) as comments 
        ON feedback.id = comments."feedbackId" 
    LEFT JOIN (
            SELECT activity."createdAt", activity.id, activity."authorId", activity."feedbackId"
            FROM "Activity" as activity
                JOIN "Feedback" as feedback
                    ON activity."feedbackId" = feedback.id
                    AND feedback."applicationId" = $1
                    AND activity."createdAt" >= $2
                    AND activity."createdAt" <= $3
                    AND activity."type" = 'FEEDBACK_VOTE'
                    AND activity."authorId" = $4
        ) as votes 
        ON feedback.id = votes."feedbackId" 
    LEFT JOIN (
            SELECT activity."createdAt", activity.id, activity."authorId", activity."feedbackId"
            FROM "Activity" as activity
                JOIN "Feedback" as feedback
                    ON activity."feedbackId" = feedback.id
                    AND feedback."applicationId" = $1
                    AND activity."createdAt" >= $2
                    AND activity."createdAt" <= $3
                    AND activity."type" = 'FEEDBACK_CREATE'
                    AND activity."authorId" = $4
        ) as posts 
        ON feedback.id = posts."feedbackId" 
GROUP BY 
    feedback.id,
    feedback.title,
    feedback.description,
    feedback.status,
    feedback.slug,
    board.slug
HAVING
    CAST(COUNT(DISTINCT comments."id") as INTEGER) >= $5
    AND CAST(COUNT(DISTINCT votes."id") as INTEGER) >= $6
    AND CAST(COUNT(DISTINCT posts."id") as INTEGER) >= $7
LIMIT $8
OFFSET $9
;