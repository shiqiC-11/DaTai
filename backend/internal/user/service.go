package user

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	userdb "github.com/shiqi/datai/backend/db/user"
)

type Service struct {
	userRepo *Repository
}

func NewService(userRepo *Repository) *Service {
	return &Service{userRepo: userRepo}
}

type UpsertUserInput struct {
	UID      string
	Nickname string
	Avatar   string
}

func (s *Service) UpsertUser(ctx context.Context, input UpsertUserInput) (*userdb.User, error) {
	existingUser, err := s.userRepo.GetUserByUID(ctx, input.UID)
	if err != nil {
		return nil, err
	}

	if existingUser != nil {
		// Update user
		existingUser.Nickname = pgtype.Text{String: input.Nickname, Valid: input.Nickname != ""}
		existingUser.Avatar = pgtype.Text{String: input.Avatar, Valid: input.Avatar != ""}
		err := s.userRepo.UpsertUser(ctx, existingUser)
		return existingUser, err
	}

	// Create new user
	newUser := &userdb.User{
		Uid:      input.UID,
		Nickname: pgtype.Text{String: input.Nickname, Valid: input.Nickname != ""},
		Avatar:   pgtype.Text{String: input.Avatar, Valid: input.Avatar != ""},
	}
	err = s.userRepo.UpsertUser(ctx, newUser)
	return newUser, err
}

func (s *Service) GetUserByUID(ctx context.Context, uid string) (*userdb.User, error) {
	return s.userRepo.GetUserByUID(ctx, uid)
}
