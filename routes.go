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
			u.GET("/me", getMe)
			u.GET("/logout", getLogout)
			u.PATCH("/users/:user_id", patchUser)

			u.GET("/users/:user_id/diet2user/:diet_id", getDiet2UserByDietAndUser)
			u.GET("/diet-reviews/:diet_id", getDietReviewPossible)
			u.POST("/diet-reviews/:diet_id", postDietReview)

			u.GET("/feedbacks/:user_id", getFeedbacksByUser)
			u.POST("/feedbacks", postFeedback)
		}

		api.POST("/register", postRegister)
		api.POST("/register/kitchen", postKitchenLogin)
		api.GET("/first-parse/:email", getFirstParse)
		api.POST("/login", postLogin)

		api.GET("/diets/:date", getDietsByDate)

		api.GET("/events", getEventsLegacy) // TODO: REMOVE eventsLegacy
		api.GET("/events/:year/:month", getEvents)
		// api.GET("/dday-events/:grade", getDDayEvent)
		// api.POST("/dday-events", postDDayEvent)

	}
}
