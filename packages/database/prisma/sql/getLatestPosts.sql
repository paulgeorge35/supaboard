SELECT DISTINCT
    feedback.id,
    feedback.title,
    feedback.slug,
    board.slug as "boardSlug",
    status.slug as "status",
    feedback."createdAt",
    CASE WHEN votes.id IS NOT NULL THEN TRUE ELSE FALSE END as "votedByMe",
    CAST((
        SELECT COUNT(*)
        FROM "Vote" v
        WHERE v."feedbackId" = feedback.id
    ) AS INTEGER) as "votes",
    MAX(activities."createdAt") as "lastActivityAt"
FROM "Feedback" as feedback
JOIN "Board" as board ON feedback."boardId" = board.id
JOIN "Status" as status ON feedback."statusId" = status.id
LEFT JOIN "Activity" as activities ON feedback.id = activities."feedbackId"
LEFT JOIN "Vote" as votes ON feedback.id = votes."feedbackId" AND votes."authorId" = $1
WHERE feedback."applicationId" = $2
AND status.type = 'ACTIVE'
GROUP BY feedback.id, feedback.title, status.slug, feedback.slug, board.slug, feedback."createdAt", CASE WHEN votes.id IS NOT NULL THEN TRUE ELSE FALSE END
HAVING MAX(activities."createdAt") < NOW() - INTERVAL '30 days'
   OR MAX(activities."createdAt") IS NULL
ORDER BY feedback."createdAt", MAX(activities."createdAt") DESC
LIMIT $3;