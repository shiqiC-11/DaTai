-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByUID :one
SELECT * FROM users WHERE uid = $1;

-- name: UpsertUser :exec
INSERT INTO users (uid, nickname, created_at, updated_at)
VALUES ($1, $2, NOW(), NOW())
ON CONFLICT (uid) DO UPDATE
SET nickname = EXCLUDED.nickname,
    updated_at = NOW();
