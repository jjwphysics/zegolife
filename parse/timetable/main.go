package main

import (
	"log"

	"github.com/JedBeom/zego.life/models"
)

func Run(path string) (timetablesByGrades [][]models.ClassTimetable) {
	r, err := loadCSVAndNewReader(path)
	if err != nil {
		panic(err)
	}

	byGrades, err := splitByGrade(r)
	if err != nil {
		panic(err)
	}

	for grade, byGrade := range byGrades {
		byClasses, err := splitByClass(byGrade)
		if err != nil {
			panic(err)
		}

		var timetablesByClasses []models.ClassTimetable

		for class, byClass := range byClasses {
			timetable := models.ClassTimetable{
				Grade: grade + 1,
				Class: class + 1,
			}

			for weekday, byWeekday := range splitByDay(byClass) {
				SubjectsInADay, err := getLessonsDay(grade, byWeekday)
				if err != nil {
					log.Fatalln(grade, class, weekday, byWeekday, err)
				}

				timetable.Subjects = append(timetable.Subjects, SubjectsInADay)
			}

			timetablesByClasses = append(timetablesByClasses, timetable)
		}

		timetablesByGrades = append(timetablesByGrades, timetablesByClasses)

	}

	return
}

func main() {
	timetablesByGrades := Run("parse/timetable/data/2021-2/origin_teacher_fixed.csv")

	conn := models.Connect()

	for _, byGrade := range timetablesByGrades {
		for _, byClass := range byGrade {
			err := conn.Insert(&byClass)
			if err != nil {
				panic(err)
			}
		}
	}
}