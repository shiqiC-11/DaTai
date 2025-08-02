-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByUID :one
SELECT * FROM users WHERE uid = $1;