package models

import (
	"github.com/go-pg/pg"
)

func (r *DietReview) Create(db *pg.DB) error {
	return db.Insert(r)
}

func DietReviewPossible(db *pg.DB, dietID string, userID string) (d Diet, err error) {
	// 먼저 리뷰 있는지 확인
	if exists, err := db.Model(&DietReview{}).Where("diet_id = ?", dietID).
		Where("user_id = ?", userID).Exists(); exists || err != nil {
		return d, err
	}

	// 존재하지 않으면
	d, err = DietByID(db, dietID)
	return
}
