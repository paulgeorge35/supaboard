-- @param {String} $1:feedbackId - The feedback ID of the feedback merging into
-- @param $2:feedbackIds - The IDs of the feedbacks being merged
-- @param {String} $3:authorId - The ID of the author of the merge activity

INSERT INTO "Activity" (
    "id",
    "feedbackId",
    "type",
    "data",
    "authorId",
    "public",
    "pinned",
    "edited",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    $1,
    'FEEDBACK_MERGE',
    json_build_object('from', unnested_ids),
    $3,
    true,           -- public default value
    false,          -- pinned default value
    false,          -- edited default value
    NOW(),          -- createdAt
    NOW()           -- updatedAt
FROM unnest($2::uuid[]) AS unnested_ids 