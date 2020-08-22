package parse

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/JedBeom/zego.life/models"
	"github.com/go-pg/pg"
	"github.com/gocolly/colly"
)

var (
	bgcolor map[string]bool
	fDivi   []string
)

func init() {
	bgcolor = map[string]bool{"#FFFFFF": false, "#F2F2F2": false, "#c0c0c0": true, "#fef9da": true}
	// #FFFFFF: 급식 신청 가능하지만 미신청
	// #F2F2F2: 날짜 없는 칸
	// #c0c0c0: 급식 없음(의무급식도 이렇게 생김 ㅋㅎㅋㅎㅋㅎ), 급식이 없으면 메뉴(diet)도 없을테니까 그냥 true로 하겠음.
	// #fef9da: 신청됨
	fDivi = []string{"b", "l", "d"}
}

var flyKitchenSess *http.Cookie

func reloadFlyKitchenSess() error {
	form := url.Values{}
	data := map[string]string{
		"mode":     "login_proc",
		"log_code": "SC0071",
		"t_chk":    "n",
		"log_hak":  "1",
		"log_ban":  "1",
		"log_num":  "1",
		"mem_pass": "1",
		"pp":       "on",
	}
	for k, v := range data {
		form.Add(k, v)
	}
	res, err := http.Post("http://gwang.i-zone.kr/login.php", "application/x-www-form-urlencoded", strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	flyKitchenSess = nil
	for _, c := range res.Cookies() {
		if c.Name == "PHPSESSID" {
			flyKitchenSess = c
			break
		}
	}

	if flyKitchenSess == nil {
		return errors.New("cannot find cookie")
	}

	return nil
}

func getAndCreateApplyListWg(db *pg.DB, u models.User, calendarType string, mealType int, wg *sync.WaitGroup) error {
	err := getAndCreateApplyList(db, u, calendarType, mealType)
	wg.Done()
	return err
}

// TODO: QUEUE 같은거 꼭 사용하기. 이대로라면 메모리 낭비가 너무 심할듯.
func getAndCreateApplyList(db *pg.DB, u models.User, calendarType string, mealType int) error {
	c := colly.NewCollector()
	// if cookie expires, reload session
	if flyKitchenSess == nil || flyKitchenSess.Expires.Sub(time.Now()) <= 0 {
		if err := reloadFlyKitchenSess(); err != nil {
			return err
		}
	}
	if err := c.SetCookies("http://gwang.i-zone.kr", []*http.Cookie{flyKitchenSess}); err != nil {
		return err
	}

	dus := make([]models.Diet2User, 0, 31)
	c.OnHTML("td.t_cell[bgcolor]", func(e *colly.HTMLElement) {
		label := e.ChildText("label")
		if label == "" || label == "1970-01-01" {
			return
		}

		du := models.Diet2User{
			DietID:  fmt.Sprintf("%s-%d", timestampHyphen2Dot(label), mealType),
			UserID:  u.ID,
			Applied: false,
		}

		if bgcolor[e.Attr("bgcolor")] {
			du.Applied = true
		}

		dus = append(dus, du)
	})

	urlFormat := `http://gwang.i-zone.kr/hidden_frame.php?mem_code=%s&mode=schd_info&dtod_code=%s&f_divi=%s`
	urll := fmt.Sprintf(urlFormat, u.KitchenMemCode, calendarType, fDivi[mealType-1])
	if err := c.Visit(urll); err != nil {
		return err
	}

	for _, du := range dus {
		if err := du.Create(db); err != nil {
			pgErr, ok := err.(pg.Error)
			if ok && pgErr.Field(models.ErrPgErrCodeField) == models.ErrPgUniqueViolation { // if unique violation
				continue
			}
			return err
		}
	}

	return nil
}

// TODO: 사용자 지정으로 작업 시작하도록 해야함. 급식 신청 날짜는 맨날 바뀌니까........
func GetApplyListOfAllUsers(db *pg.DB) {
	us, err := models.UsersAll(db)
	if err != nil {
		// TODO: handling
		return
	}

	if len(us) == 0 {
		return
	}

	if err := reloadFlyKitchenSess(); err != nil {
		return
	}

	wg := sync.WaitGroup{}
	for _, u := range us {
		for mealType := 1; mealType <= 3; mealType++ {
			wg.Add(1)
			go func(u models.User, mealType int) {
				for try := 0; try < 2; try++ {
					// TODO: calendarType 하드코딩 벗어나기
					if err := getAndCreateApplyListWg(db, u, "D00030", mealType, &wg); err != nil {
						time.Sleep(time.Second)
						continue
					}
					return
				}
			}(u, mealType)
		}
	}
	wg.Wait()

}
