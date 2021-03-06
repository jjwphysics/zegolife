package main

import (
	"github.com/labstack/echo"

	echoMw "github.com/labstack/echo/middleware"
)

func routes(e *echo.Echo) {
	e.Pre(echoMw.RemoveTrailingSlash())
	e.Use(echoMw.CORS())
	e.Use(echoMw.Recover())
	e.Use(echoMw.RequestID())
	e.Use(middlewareConn)
	e.Use(middlewareLogger)

	front := "front/build"
	e.File("/*", front+"/index.html")
	e.File("/manifest.json", front+"/manifest.json")
	e.File("/192.png", front+"/192.png")
	e.File("/512.png", front+"/512.png")
	e.File("/robots.txt", front+"/robots.txt")
	e.File("/favicon.ico", front+"/favicon.ico")
	e.File("/favicon.png", front+"/favicon.png")
	e.File("/og-20200929.png", front+"/og-20200929.png")
	e.Static("/static", front+"/static")

	api := e.Group("/api/v1", middlewareTokenCheck)
	{
		u := api.Group("", middlewareUserOnly)
		{
			admin := u.Group("", middlewareAdminOnly)

			u.GET("/me", getMe)
			u.GET("/logout", getLogout)
			u.PATCH("/users/:user_id/v1", patchUserV1)

			// admin-only
			admin.GET("/users/count", getUsersAllCount)
			admin.GET("/users/search/by-name/:name/order-by/:order-by", getUsersByName) // admin-only
			admin.GET("/users/search/order-by/:order-by", getUsersAll)                  // admin-only
			admin.PATCH("/users/:user_id/roles", patchUserRoles)

			u.GET("/me/upgrade", getUserUpgradable)
			u.POST("/me/upgrade", postUserUpgrade)

			u.GET("/users/:user_id/pw-change", getPwChangeToken)

			// diets
			u.GET("/users/:user_id/diet2user/:diet_id", getDiet2UserByDietAndUser)
			u.GET("/diet-reviews/:diet_id", getDietReviewPossible)
			u.POST("/diet-reviews/:diet_id", postDietReview)

			// feedbacks
			admin.GET("/feedbacks", getFeedbacksAll)         // admin
			admin.GET("/feedbacks/:id", getFeedbackByID)     // admin
			admin.PATCH("/feedbacks/:id", patchFeedbackByID) // admin
			u.GET("/users/:user_id/feedbacks", getFeedbacksByUser)
			u.POST("/feedbacks", postFeedback)

			// notices
			admin.POST("/notices", postNotice) // admin
			admin.PATCH("/notices/:id", patchNoticeByID)

			// timetables
			u.GET("/class-timetable/:grade/:class", getClassTimetable)
			u.GET("/electric-subjects/me", getElectiveSubjects)
			u.DELETE("/electric-subjects/me", deleteElectiveSubjectsMe)
			u.GET("/electric-subjects/subjects", getTimetableSubjects)
			u.POST("/electric-subjects", postElectiveSubjects)

			// campaigns (cmp, cmps)
			u.POST("/campaigns", postCampaignNotPayed)
			u.GET("/campaigns/me", getCampaignsByUser)
			u.GET("/campaigns-not-payed/me", getCampaignsNotPayedByUser)
			admin.GET("/campaigns-not-payed/payed", getCampaignsNotPayedPayed)
			admin.PATCH("/campaigns-not-payed/:id/move", patchCampaignMoveByID)
			u.PATCH("/campaigns/:id/payment", patchCampaignPayment)
			u.GET("/campaigns-not-payed/:id", getCampaignNotPayedByID)
			u.PATCH("/campaigns-not-payed/:id", patchCampaignNotPayed)
			u.PATCH("/campaigns-not-payed/:id/confirm-pay", patchCampaignNotPayedConfirmPay)
			admin.POST("/campaigns/pass", postCampaign)
			u.POST("/campaigns/image", postCampaignImage)

			// dday
			admin.GET("/dday-events", getDDayEventAll)
			admin.POST("/dday-events", postDDayEvent)
		}

		api.GET("/register/available", getRegisterAvailable)
		api.POST("/register", postRegister)
		api.POST("/register/kitchen", postKitchenLogin)
		api.GET("/first-parse/:email", getFirstParse)
		api.POST("/login", postLogin)

		api.GET("/diets/:date", getDietsByDate)

		api.GET("/events/date-only", getEventsDateOnly)
		api.GET("/events/:year/:month", getEventsByYearMonth)
		api.GET("/events/:date", getEventsByDate)

		api.GET("/dday-events/:grade", getDDayEventByGrade)

		api.POST("/tokens/pw-change", postPwChange)

		api.GET("/home", getHome)

		api.GET("/notices/last", getLastNoticeTitle)
		api.GET("/notices", getNoticesAll)
		api.GET("/notices/:id", getNoticeByID)

		// campaigns (cmp, cmps)
		api.GET("/campaigns/one", getCampaign)

		api.GET("/health/connection", func(c echo.Context) error {
			return c.JSON(200, Map{"message": "success"})
		})
	}
}
