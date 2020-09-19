package models

import (
	"github.com/JedBeom/zego.life/apierror"
	"github.com/go-pg/pg"
	"github.com/google/uuid"
	"github.com/labstack/echo"
	"golang.org/x/crypto/bcrypt"
)

func UsersAll(db *pg.DB) (us []User, err error) {
	err = db.Model(&us).Order("created_at").Select()
	return
}

func UserByEmail(db *pg.DB, email string) (u User, err error) {
	err = db.Model(&u).Where("email = ?", email).Select()
	return
}

func UserByID(db *pg.DB, id string) (u User, err error) {
	u.ID = id
	err = db.Model(&u).WherePK().Select()
	return
}

func (u User) CanRegister(db *pg.DB) (ure *apierror.UserRegisterError) {
	// email?
	model := db.Model(&u)
	if exists, err := model.Where("email = ?", u.Email).Exists(); exists || err != nil {
		ure = &apierror.UserRegisterError{
			Field:   "email",
			Content: "이미 존재하는 이메일입니다.",
		}
		return
	}

	// barcode?
	if exists, err := model.Where("barcode = ?", u.Email).Exists(); exists || err != nil {
		ure = &apierror.UserRegisterError{
			Field:   "barcode",
			Content: "이미 존재하는 학생증입니다.",
		}
		return
	}

	return
}

func Encrypt(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), 16)
	if err != nil {
		return "", err
	}
	return string(b[:]), nil
}

func barcodeToKitchenMemcode(barcode string) (memcode string) {
	if len(barcode) != 10 {
		return
	}

	memcode += "ST20" + barcode[3:5] + barcode[6:10]
	return
}

func kitchenMemCodeToBarcode(memCode string) (barcode string) {
	if len(memCode) != 10 {
		return
	}

	barcode += "100" + memCode[4:6] + "0" + memCode[6:10]
	return
}

func (u *User) Create(db *pg.DB) error {
	id, _ := uuid.NewRandom()
	u.ID = id.String()
	if u.Password == "" {
		return echo.ErrBadRequest
	}

	var err error
	u.Password, err = Encrypt(u.Password)
	if err != nil {
		return err
	}

	if u.Grade < 3 {
		if u.Barcode != "" {
			u.KitchenMemCode = barcodeToKitchenMemcode(u.Barcode)
		} else {
			u.Barcode = kitchenMemCodeToBarcode(u.KitchenMemCode)
		}
	}
	return db.Insert(u)
}