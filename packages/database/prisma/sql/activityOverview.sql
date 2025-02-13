WITH RECURSIVE dates AS (
  SELECT date_trunc('day', $2::timestamp) AS date
  UNION ALL
  SELECT date + interval '1 day'
  FROM dates
  WHERE date < date_trunc('day', $3::timestamp)
),
daily_votes AS (
  SELECT 
    date_trunc('day', v."createdAt") AS date,
    CAST(COUNT(*) AS INTEGER) AS vote_count
  FROM "Vote" v
  JOIN "Feedback" f ON f.id = v."feedbackId"
  WHERE 
    f."applicationId" = $1
    AND v."createdAt" >= $2
    AND v."createdAt" <= $3
  GROUP BY date_trunc('day', v."createdAt")
),
daily_feedbacks AS (
  SELECT
    date_trunc('day', f."createdAt") AS date,
    CAST(COUNT(*) AS INTEGER) AS feedback_count
  FROM "Feedback" f
  WHERE 
    f."applicationId" = $1
    AND f."createdAt" >= $2
    AND f."createdAt" <= $3
  GROUP BY date_trunc('day', f."createdAt")
),
daily_status_changes AS (
  SELECT
    date_trunc('day', a."createdAt") AS date,
    CAST(COUNT(*) AS INTEGER) AS status_change_count
  FROM "Activity" a
  JOIN "Feedback" f ON f.id = a."feedbackId"
  WHERE 
    f."applicationId" = $1
    AND a.type = 'FEEDBACK_STATUS_CHANGE'
    AND a."createdAt" >= $2
    AND a."createdAt" <= $3
  GROUP BY date_trunc('day', a."createdAt")
),
daily_comments AS (
  SELECT
    date_trunc('day', a."createdAt") AS date,
    CAST(COUNT(*) AS INTEGER) AS comment_count
  FROM "Activity" a
  JOIN "Feedback" f ON f.id = a."feedbackId"
  WHERE 
    f."applicationId" = $1
    AND a.type = 'FEEDBACK_COMMENT'
    AND a."createdAt" >= $2
    AND a."createdAt" <= $3
  GROUP BY date_trunc('day', a."createdAt")
)
SELECT 
  dates.date,
  COALESCE(daily_votes.vote_count, 0)::INTEGER AS vote_count,
  COALESCE(daily_feedbacks.feedback_count, 0)::INTEGER AS feedback_count,
  COALESCE(daily_status_changes.status_change_count, 0)::INTEGER AS status_change_count,
  COALESCE(daily_comments.comment_count, 0)::INTEGER AS comment_count
FROM dates
LEFT JOIN daily_votes ON dates.date = daily_votes.date
LEFT JOIN daily_feedbacks ON dates.date = daily_feedbacks.date
LEFT JOIN daily_status_changes ON dates.date = daily_status_changes.date
LEFT JOIN daily_comments ON dates.date = daily_comments.date
ORDER BY dates.date ASC;
