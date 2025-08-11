package user

import (
	"context"
	"time"

	userdb "github.com/shiqi/datai/backend/db/user" // sqlc 生成的包
)

type Repository struct {
	q *userdb.Queries
}

type User struct {
	ID        int64
	UID       string
	Nickname  string
	Avatar    string
	CreatedAt time.Time
}

func NewRepository(q *userdb.Queries) *Repository {
	return &Repository{q}
}

func (r *Repository) GetUserByUID(ctx context.Context, uid string) (*userdb.User, error) {
	user, err := r.q.GetUserByUID(ctx, uid)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) UpsertUser(ctx context.Context, u *userdb.User) error {
	return r.q.UpsertUser(ctx, userdb.UpsertUserParams{
		Uid:      u.Uid,
		Nickname: u.Nickname,
	})
}
