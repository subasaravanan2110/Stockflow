UPDATE "User" AS users
SET "lastActivityAt" = activity."latestActivity"
FROM (
  SELECT "userId", MAX("activityAt") AS "latestActivity"
  FROM (
    SELECT "performedById" AS "userId", "createdAt" AS "activityAt"
    FROM "StockMovement"
    UNION ALL
    SELECT "userId", "lastSeenAt" AS "activityAt"
    FROM "ActiveSession"
  ) AS recorded_activity
  GROUP BY "userId"
) AS activity
WHERE users."id" = activity."userId"
  AND (users."lastActivityAt" IS NULL OR users."lastActivityAt" < activity."latestActivity");
