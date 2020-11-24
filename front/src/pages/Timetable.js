import React, {useEffect, useState} from 'react'
import {getTimetable} from '../common/api'

let meGrade = localStorage.getItem("me.grade")
let meClass = localStorage.getItem("me.class")

const Timetable = () => {
    const [lessons, setLessons] = useState([[]])
    const [twd, setTwd] = useState(new Date().getDay())

    useEffect(() => {
        get()
    }, [])

    const get = async () => {
        if (meClass === null) {
            return
        }
        try {
            const ls = await getTimetable(meGrade, meClass)
            if (ls) {
                console.log(ls)
                setLessons(ls)
            }
        } catch (e) {
            alert(e)
        }
    }

    if (meClass === null) {
        return (
            <>
                <h1 className="page-title">시간표</h1>
                <p>반 정보가 없습니다. 다시 로그인해주세요.</p>
            </>
        )
    }

    return (
        <>
            <h1 className="page-title">{meGrade}-{meClass} 시간표
                <div className="inline-block bg-green green-lightest px-2 fs-s2 br-round m-3">BETA</div>
            </h1>
            <div className="table-container">
                {lessons.length !== 1 ?
                    <table className="timetable">
                        <thead>
                        <tr>
                            {["", "월", "화", "수", "목", "금"].map((v, i) => {
                                if (i === twd) {
                                    return <td className="today">{v}</td>
                                }
                                return <td key={i}>{v}</td>
                            })}
                        </tr>
                        </thead>
                        <tbody>
                        {
                            [0, 1, 2, 3, 4, 5, 6].map(li => { // lessons index 
                                return <tr key={li}>
                                    <td>{li + 1}교시</td>
                                    {[0, 1, 2, 3, 4].map(wd =>  // week day
                                        <td className={wd + 1 === twd ? "today" : ""} key={`${li}${wd}`}>
                                            {lessons[wd][li] !== undefined ?
                                                <span className="subject">{lessons[wd][li].Subject}</span>
                                                : null}
                                            <span
                                                className="teacher">{lessons[wd][li].Teacher !== "" ? lessons[wd][li].Teacher + "T" : "담당"}</span>
                                        </td>
                                    )}
                                </tr>
                            })
                        }
                        </tbody>
                    </table>
                    : <div className="loader"/>}
            </div>
        </>
    )
}

export default Timetable