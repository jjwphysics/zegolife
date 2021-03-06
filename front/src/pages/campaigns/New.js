import { useEffect, useState } from 'react';
import {withRouter} from 'react-router-dom'
import axios from 'axios'

import Page from "../../components/Page"
import CampaignBox from '../../components/CampaignBox'
import {SuccessBox, WarningBox} from '../../components/AlertBox'

import {validURL} from '../../utils/validate'
import {timestampHyphen} from '../../utils/timestamp'

import "react-datepicker/dist/react-datepicker.css";

const CampaignNew = ({match, history}) => {

    const [isNew, setNew] = useState(true)

    const [title, setTitle] = useState("")
    const [subTitle, setSubTitle] = useState("")
    const [link, setLink] = useState("")
    const [file, setFile] = useState(null)
    const [prvImageSrc, setPrvImageSrc] = useState("")
    const [okMsg, setOkMsg] = useState("")
    const [errMsg, setErrMsg] = useState("")

    const [fileElement, setFileElement] = useState(null)
    const [startDate, setStartDate] = useState(new Date().toISOString().substr(0, 10))
    const [startHour, setStartHour] = useState(0)
    const [endDate, setEndDate] = useState(new Date().toISOString().substr(0, 10))
    const [endHour, setEndHour] = useState(0)

    const [totalDate, setTotalDate] = useState({day: 0, hour: 0, totalHour: 0})
    const [totalPrice, setPrice] = useState(0)

    const [imagePreview, setImagePreview] = useState("")
    const [reader] = useState(new FileReader())

    const [initialLoading, setInitialLoading] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        reader.onload = e => {
            setImagePreview(e.target.result)
        }

        if (match.params.id) {
            setNew(false)
            getCampaign()
        }
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        let start = new Date(startDate)
        let end = new Date(endDate)
        start.setHours(startHour, 0)
        end.setHours(endHour, 0)

        const diff = end - start
        const calc = diff / 1000 / 60 / 60
        const day = Math.floor(calc / 24)
        const hour = calc - day * 24
        setTotalDate({day: day, hour: hour, totalHour: calc})
        setPrice(calc * 20)
    }, [startDate, endDate, startHour, endHour])

    const getCampaign = async () => {
        setInitialLoading(true)
        try {
            const {data} = await axios.get(`campaigns-not-payed/${match.params.id}`)
            setTitle(data.Title)
            setSubTitle(data.SubTitle)
            setLink(data.Link)
            setPrvImageSrc(data.ImageSrc)
            setImagePreview(data.ImageSrc)
            let start = new Date(data.StartAt)
            setStartDate(timestampHyphen(start))
            setStartHour(start.getHours())
            let end = new Date(data.EndAt)
            setEndDate(timestampHyphen(end))
            setEndHour(end.getHours())
        } catch (e) {
            setErrMsg("????????? ???????????????.")
        } finally {
            setInitialLoading(false)
        }
    }

    const onClick = async () => {
        setLoading(true)
        setOkMsg("")
        setErrMsg("")

        if (!title) {
            setErrMsg("????????? ????????????.")
            setLoading(false)
            return
        }

        if (!subTitle) {
            setErrMsg("???????????? ????????????.")
            setLoading(false)
            return
        }

        if (link) {
            if (!validURL(link)) {
                setErrMsg("????????? URL??? ??????????????????.")
                setLoading(false)
                return
            }
        }

        if (totalDate.totalHour <= 0) {
            setErrMsg("?????? ????????? 0 ????????? ??? ????????????.")
            setLoading(false)
            return
        }

        let start = new Date(startDate)
        let end = new Date(endDate)
        start.setHours(startHour, 0)
        end.setHours(endHour, 0)

        if (isNaN(totalDate.totalHour)) {
            setErrMsg("????????? ????????? ???????????????.")
            setLoading(false)
            return
        }

        if (start >= end) {
            setErrMsg("?????? ????????? ?????? ???????????? ????????????.")
            setLoading(false)
            return
        }

        let p = {
            Title: title,
            SubTitle: subTitle,
            Link: link,
            StartAt: start,
            EndAt: end,
        }

        if (!prvImageSrc) {
            const imageSrc = await uploadImage()
            if (imageSrc === false) {
                setLoading(false)
                return
            }
            p.ImageSrc = imageSrc
        } else {
            p.ImageSrc = prvImageSrc
        }

        try {
            if (isNew) {
                const {data} = await axios.post(`campaigns`, p)
                history.push(`/campaigns/${data.ID}/payment`)
            } else {
                const {data} = await axios.patch(`campaigns-not-payed/${match.params.id}`, p)
                history.push(`/campaigns/${data.ID}/payment`)
            }
        } catch (e) {
            setErrMsg(`${e}`)
        } finally {
            setLoading(false)
        }
    }

    const uploadImage = async () => {
        if (!file) return ""

        const formData = new FormData()
        formData.append("file", file)

        try {
            const {data} = await axios.post(`campaigns/image`, formData, {
                params: {
                    "type": file.type,
                    "name": file.name
                }
            })
            setPrvImageSrc("")
            return data
        } catch (e) {
            setErrMsg(`${e}`)
        }
        return false
    }

    const fileName = () => {
        if (file) {
            return file.name
        }
    }
    return (
        <Page title={isNew ? "????????? ??????" : "????????? ??????"} backTo="/campaigns" loading={initialLoading}>
            <SuccessBox>{okMsg}</SuccessBox>
            <WarningBox>{errMsg}</WarningBox>
            <div className="flex flex-column">
                <label>?????? (??????)</label>
                <input type="text" value={title || ''} onChange={e => setTitle(e.target.value)}
                       className="input-form" placeholder="?????? ?????? ????????????, U&amp;I"/>
            </div>
            <div className="flex flex-column">
                <label>????????? (??????)</label>
                <input type="text" value={subTitle || ''} onChange={e => setSubTitle(e.target.value)}
                       className="input-form" placeholder="???????????? ???????????? ?????? ??????!"/>
            </div>
            <div className="flex flex-column">
                <label>?????????</label>
                {prvImageSrc ? <p className="info">?????? ???????????? ???????????? ????????????.</p> : null}
                <button className="button w-100"
                        onClick={() => fileElement.click()}>{fileName() ? fileName() : "?????? ????????????"}</button>
                <input id="file-input" ref={input => setFileElement(input)} style={{display: "none"}} type="file"
                       name="file" onChange={e => {
                    setFile(e.target.files[0]);
                    reader.readAsDataURL(e.target.files[0])
                }}/>
                <p className="info">10MB ??????. ?????? ??????(png)??? ???????????????.</p>
            </div>
            <div className="flex flex-column">
                <label>??????</label>
                <input type="text" value={link || ''} onChange={e => setLink(e.target.value)}
                       className="input-form" placeholder="https://onair.zego.life"/>
                <p className="info">{validURL(link) ? null : "????????? URL??? ???????????????!"}</p>
            </div>
            <div className="flex flex-column">
                <label>?????? ??????</label>
                <div className="flex justify-between">
                    <input type="date" className="input-form" placeholder="?????? ????????? ???????????????" value={startDate}
                           onChange={e => setStartDate(e.target.value)} max={endDate}/>
                    <select className="select select-form" value={startHour}
                            onChange={e => setStartHour(e.target.value)}>
                        {[...Array(24).keys()].map(i => <option key={i} value={i}>{i}???</option>)}
                    </select>
                </div>
            </div>
            <div className="flex flex-column">
                <label>?????? ??????</label>
                <div className="flex justify-between">
                    <input type="date" className="input-form" min={startDate} placeholder="?????? ????????? ???????????????" value={endDate}
                           onChange={e => setEndDate(e.target.value)}/>
                    <select className="select select-form" value={endHour} onChange={e => setEndHour(e.target.value)}>
                        {[...Array(24).keys()].map(i => <option key={i} value={i}>{i}???</option>)}
                    </select>
                </div>
            </div>
            <div className="flex flex-column mt-4">
                <label>????????????</label>
                <CampaignBox c={{Title: title, SubTitle: subTitle, Link: link, ImageSrc: imagePreview}}/>
            </div>
            <p className="total time">??? <span className="time">{totalDate.day}??? {totalDate.hour}??????</span>, <span
                className="price">???{totalPrice}</span></p>
            <button className={loading ? "button float-right mt-5 loading" : "button float-right mt-5"}
                    onClick={onClick}>??????
            </button>
            <p className="info">'??????' ????????? ?????? ??? <a rel="noopener noreferrer" target="_blank"
                                                 href="http://simp.ly/p/YVJPWQ">??????????????? ????????? ????????????</a>??? ???????????? ????????? ???????????????.
            </p>
        </Page>
    )
}

export default withRouter(CampaignNew)