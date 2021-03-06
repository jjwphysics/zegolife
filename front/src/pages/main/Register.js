import { useEffect, useState } from 'react';
import {BrowserBarcodeReader} from '@zxing/library'
import axios from 'axios'

import Page from '../../components/Page'
import CardBox from '../../components/ui/CardBox'
import CheckGreen from '../../components/CheckGreen'
import {ErrorBox, InfoBox} from "../../components/AlertBox"

import hakbunToGCN from '../../utils/hakbunToGCN'
import {validateGCN} from '../../utils/validate'

import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";

const Register = () => {
    const [available, setAvailable] = useState(false)
    const [videoActive, setVideoActive] = useState(false)
    const [barcode, setBarcode] = useState("")
    const [memCode, setMemCode] = useState("")
    const [step0Ok, setStep0Ok] = useState(false)
    const [isAuthBarcode, setIsAuthBarcode] = useState(false)
    const [step1Ok, setStep1Ok] = useState(false)
    const [step2Ok, setStep2Ok] = useState(false)
    const [errMsg, setErrMsg] = useState("")

    const [kitchenPass, setKitchenPass] = useState("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [hakbun, setHakbun] = useState("")
    const [date, setDate] = useState(null)
    const [residenceDorm, setResidenceDorm] = useState(true)
    const [tosRead, setTosRead] = useState(false)
    const [isLoading, setLoading] = useState("button float-right")
    const [kitchenLoading, setKitchenLoading] = useState(false)

    const getAvailable = async () => {
        try {
            const {data} = await axios.get(`/register/available`)
            // eslint-disable-next-line
            if (data == true) {
                setAvailable(true)
                return
            }
            setErrMsg("죄송합니다. 지금은 가입할 수 없습니다. 제고라이프 인스타그램으로 다시 가입이 가능한 일시를 안내드리겠습니다.")
        } catch (e) {
            setErrMsg(`가입 가능 여부를 확인하던 중 문제가 발생했습니다. ${e}`)
            return
        }
    }

    let r = Math.random()
    let rm = true
    if (r > 0.5) {
        rm = false
    }
    const [isMale, setIsMale] = useState(rm)


    let minDate = new Date(2002, 0, 1)
    let maxDate = new Date(2006, 11, 31)

    const authScan = () => {
        setIsAuthBarcode(true)
        setStep0Ok(true)
    }

    const authLogin = () => {
        setStep0Ok(true)
    }

    let codeReader = new BrowserBarcodeReader()
    const startRead = async () => {
        try {
            setVideoActive(true)
            setErrMsg("")
            const result = await codeReader.decodeFromInputVideoDevice(undefined, 'video')
            setBarcode(result.text)
            codeReader.reset()
            setVideoActive(true)
            setStep1Ok(true)
        } catch (e) {
            setVideoActive(true)
            setErrMsg("카메라를 실행할 수 없어요. 설정에서 카메라 엑세스를 허용해주세요.")
        }
    }

    useEffect(() => {
        getAvailable()
        return () => {
            codeReader.reset()
        }
        // eslint-disable-next-line
    }, [])

    const postKitchen = async e => {
        setErrMsg("")
        setKitchenLoading(true)
        e.preventDefault()

        let {g, c, n} = hakbunToGCN(hakbun)

        if (!validateGCN(g, c, n)) {
            setErrMsg("학번이 유효하지 않습니다.")
            setKitchenLoading(false)
            return
        }

        let req = {Grade: g, Class: c, Number: n, Password: kitchenPass}
        try {
            let {data} = await axios.post(`register/kitchen`, req)
            setMemCode(data.Code)
            setStep1Ok(true)
        } catch {
            setErrMsg("로그인에 실패했습니다. 학번과 비밀번호를 확인해주세요.")
        }
        setKitchenLoading(false)
    }

    const postRegister = async e => {
        setErrMsg("")
        setLoading("loading button float-right")
        e.preventDefault()

        if (!tosRead) {
            setErrMsg("이용약관과 개인정보 취급 동의서를 동의하지 않으면 진행할 수 없어요.")
            setLoading("button float-right")
            return
        }

        let {g, c, n} = hakbunToGCN(hakbun)
        if ((g < 1 || g > 3)
            || (c < 1 || (g === 1 && c > 8) || (g === 2 && c > 8) || (g === 3 && c > 10))
            || (n < 1 || n > 31)) {
            setErrMsg("학번이 유효하지 않습니다.")
            setLoading("button float-right")
            return
        }

        const enterYear = email.slice(3, 5)
        if ((enterYear === "20" && g < 2) || (enterYear === "19" && g < 3)) {
            setErrMsg("2021년의 학번으로 입력해주십시오.")
            setLoading("button float-right")
            return
        }

        if (g === 1 && hakbun !== email.slice(6, 11)) {
            setErrMsg("이메일이 유효하지 않습니다.")
            setLoading("button float-right")
            return
        }

        if (date === null) {
            setErrMsg("생년월일을 입력해주세요.")
            setLoading("button float-right")
            return
        }

        let y = date.getFullYear()
        let m = date.getMonth() + 1
        let d = date.getDate()

        let req = {
            Email: email,
            Password: password,
            Grade: g,
            Class: c,
            Number: n,
            BirthdayYear: y,
            BirthdayMonth: m,
            BirthdayDay: d,
            IsDorm: residenceDorm,
            IsMale: isMale,
            Name: name,
        }

        if (barcode !== "") {
            req.Barcode = barcode
        } else {
            req.KitchenMemCode = memCode
        }

        try {
            await axios.post("register", req)
            setStep2Ok(true)
            // first-parse
            try {
                await axios.get(`first-parse/${email}`)
                alert("회원가입의 모든 과정이 끝났어요.\n회원이 된 것을 축하합니다!\n이제 로그인 화면으로 가요.")
            } catch (e) {
                alert("급식 정보를 가져오는 것을 실패했어요. 관리자에게 로그가 발송됐어요. 내일 로그인하면 해결되어 있을 거예요.")
            }
            window.location = "/login"
        } catch (e) {
            let msg = e.response.data.Content
            if (msg) setErrMsg(msg)
            else setErrMsg("뭔가 잘못되었습니다.")
        }
        setLoading("button float-right")
    }

    const [step1, setStep1] = useState(null)

    useEffect(() => {
        if (!step0Ok) {
            setStep1(
                <CardBox>
                    <h2>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler" viewBox="0 0 24 24">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <rect x="3" y="4" width="18" height="16" rx="3"/>
                            <circle cx="9" cy="10" r="2"/>
                            <line x1="15" y1="8" x2="17" y2="8"/>
                            <line x1="15" y1="12" x2="17" y2="12"/>
                            <line x1="7" y1="16" x2="17" y2="16"/>
                        </svg>
                        STEP 0: 인증 방법 선택
                    </h2>
                    <p>본인 인증 및 급식 정보를 가져오기 위한 인증이에요. 학생증 인증이 빠르고 쉬워요.</p>
                    <div className="flex flex-column">
                        <button className="button button-auth-choose" onClick={authScan}>학생증 스캔</button>
                        <button className="button button-auth-choose" onClick={authLogin}>급식신청사이트 로그인</button>
                    </div>
                </CardBox>
            )
        } else {
            if (isAuthBarcode) {
                setStep1(
                    <CardBox className="register-scan-box">
                        <h2>STEP 1: 학생증 바코드 스캔</h2>
                        <div className={"register-scan-button"}>
                            {barcode === "" ?
                                <>
                                    {videoActive ? <video id="video"/>
                                        : <button onClick={startRead} className={"button"}>스캔하기</button>
                                    }
                                    <p>기종에 따라 초점이 잘 맞지 않을 수 있어요.</p>
                                </>
                                : <>
                                    <CheckGreen/>
                                    <h2>완료!</h2>
                                </>}
                        </div>
                    </CardBox>
                )
            } else {
                setStep1(
                    <CardBox className="register-step2-box">
                        <h2>STEP 1: 급식신청사이트(플라이키친) 로그인</h2>
                        {!step1Ok ?
                            <form className={"p-2"} onSubmit={postKitchen}>
                                <div className={"flex flex-column"}>
                                    <label className={"my-2"} htmlFor={"hakbun-input"}>학번</label>
                                    <input type="text" value={hakbun} onChange={event => setHakbun(event.target.value)}
                                           className={"input"} id="hakbun-input" pattern="[0-9]*"
                                           placeholder="ex) 10106" maxLength={5} minLength={5}
                                           required autoComplete="off" inputMode="numeric"/>
                                </div>
                                <div className={"flex flex-column"}>
                                    <label className={"my-2"} htmlFor="password-input">비밀번호</label>
                                    <input type="password" value={kitchenPass}
                                           onChange={event => setKitchenPass(event.target.value)}
                                           className={"input"} id="password-input"
                                           minLength={1} placeholder={"플라이키친 비밀번호"} required autoComplete="off"
                                    />
                                </div>
                                <div className={"mt-4"}>
                                    <button type="submit"
                                            className={kitchenLoading ? "loading button float-right" : "button float-right"}>플라이키친
                                        로그인
                                    </button>
                                </div>
                            </form>
                            : <div className={"register-scan-box"}>
                                <CheckGreen/>
                                <h2>인증 완료!</h2>
                            </div>}
                    </CardBox>
                )
            }
        }
        // eslint-disable-next-line
    }, [step0Ok, step1Ok, videoActive, barcode, hakbun, kitchenPass, kitchenLoading])

    const [step2, setStep2] = useState(null)
    useEffect(() => {
        if (step1Ok) {
            setStep2(
                <CardBox className="register-step2-box">
                    <h2>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler" viewBox="0 0 24 24">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <circle cx="12" cy="12" r="9"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                            <polyline points="11 12 12 12 12 16 13 16"/>
                        </svg>
                        STEP 2: 개인정보 입력
                    </h2>
                    {!step2Ok ?
                        <form className={"p-2"} onSubmit={postRegister}>
                            <div className={"flex flex-column"}>
                                <label className={"my-2"} htmlFor={"name-input"}>이름</label>
                                <input type="text" value={name} onChange={event => setName(event.target.value)}
                                       className={"input"} id="name-input" minLength={2} placeholder={"ex) 김광철"}
                                       required/>
                            </div>
                            <div className={"flex flex-column"}>
                                <label className={"my-2"} htmlFor={"hakbun-input"}>학번</label>
                                <input type="text" value={hakbun} onChange={event => setHakbun(event.target.value)}
                                       className={"input"} id="hakbun-input" pattern="[0-9]*" placeholder={"ex) 10106"}
                                       required autoComplete={"off"} inputMode="numeric" minLength={5} maxLength={5}/>
                            </div>
                            <div className="flex flex-column">
                                <label className="my-2" htmlFor="residence-input">거주</label>
                                <div className="horizontal-group register-select">
                                    <button type="button" className={residenceDorm ? "button bg-green" : "button"}
                                            onClick={() => setResidenceDorm(true)}>기숙사
                                    </button>
                                    <button type="button" className={!residenceDorm ? "button bg-green" : "button"}
                                            onClick={() => setResidenceDorm(false)}>비기숙사
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-column">
                                <label className="my-2" htmlFor="birthday-input">생년월일</label>
                                <DatePicker className="input register-birthday" disabledKeyboardNavigation
                                            placeholderText="ex) 2005년 09월 08일"
                                            dateFormat="yyyy년 MM월 dd일" openToDate={new Date(2005, 8, 8)}
                                            onChange={(d) => setDate(d)}
                                            selected={date} minDate={minDate} maxDate={maxDate}/>
                            </div>
                            <div className="flex flex-column">
                                <label className="my-2" htmlFor="residence-input">성별(주민등록상)</label>
                                <div className="horizontal-group register-select">
                                    <button type="button" className={isMale ? "button bg-blue" : "button"}
                                            onClick={() => setIsMale(true)}>남
                                    </button>
                                    <button type="button" className={!isMale ? "button bg-red" : "button"}
                                            onClick={() => setIsMale(false)}>여
                                    </button>
                                </div>
                            </div>
                            <div className={"flex flex-column"}>
                                <label className={"my-2"} htmlFor={"email-input"}>구글 클래스룸 이메일 주소</label>
                                <input type="email" value={email} onChange={event => setEmail(event.target.value)}
                                       className={"input"} id="email-input"
                                       pattern="gch(19|20|21)-1[01]\d[0-3]\d@h.jne.go.kr"
                                       placeholder="ex) gch21-10901@h.jne.go.kr" required
                                       inputMode="email"/>
                            </div>
                            <div className={"flex flex-column"}>
                                <label className={"my-2"} htmlFor="password-input">암호(8글자 이상)</label>
                                <input type="password" value={password}
                                       onChange={event => setPassword(event.target.value)}
                                       className={"input"} id="password-input"
                                       minLength={8} maxLength={30}
                                       placeholder="8글자 이상" required
                                       autoComplete="new-password"/>
                            </div>
                            <div className={"flex items-center mt-4"}>
                                <input type="checkbox" className={"checkbox mr-3"} id="tnc-input"
                                       onChange={() => {
                                           setTosRead(!tosRead)
                                       }}/>
                                <label className={"form-check-label"} htmlFor="tnc-input"><a
                                    href="http://simp.ly/p/fPd30c" rel="noopener noreferrer"
                                    target="_blank">이용약관</a>과 <a href="http://simp.ly/p/DXDwql"
                                                                 rel="noopener noreferrer" target="_blank">개인정보 취급
                                    동의서</a>를 읽었으며 이에
                                    동의합니다.
                                </label>
                            </div>
                            <div className={"mt-4"}>
                                <button type="submit" className={isLoading}>회원가입</button>
                            </div>
                        </form>
                        : <div className={"register-scan-box"}>
                            <CheckGreen/>
                            <h2>회원가입 성공!</h2>
                            <p>하지만 아직 끝난 게 아니에요... STEP 3까지 기다려주세요!</p>
                        </div>}
                </CardBox>
            )
        }
        // eslint-disable-next-line
    }, [step1Ok, step2Ok, name, hakbun, email, password, tosRead, isLoading, date, residenceDorm, isMale])

    const [step3, setStep3] = useState(null)
    useEffect(() => {
        if (step2Ok) {
            setStep3(
                <CardBox className="register-step2-box in-progress">
                    <h2>STEP 3: 급식 정보 가져오는 중...</h2>
                    <div className={"register-scan-box"}>
                        <div className={"spinner bw-6"}/>
                        <h2>잠시만 기다려주세요...</h2>
                        <p>급식 정보를 가져오고 있어요. 이 화면을 유지해주세요! 끝나면 로그인 화면으로 갈 거예요.</p>
                    </div>
                </CardBox>
            )
        }
    }, [step2Ok])

    if (!available) {
        return <Page title="회원가입">
            <ErrorBox>{errMsg}</ErrorBox>
            <p>회원가입 가능 여부를 확인하는 중 입니다.</p>
        </Page>
    }

    return (
        <Page title="회원가입">
            <InfoBox>2021년 새 학번으로 가입해 주십시오.</InfoBox>
            <CardBox>
                <h2>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler"
                         viewBox="0 0 24 24">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>
                        <path d="M16 11h6m-3 -3v6"/>
                    </svg>
                    회원가입
                </h2>
                <p>제고라이프는 광양제철고등학교 학생 누구나 이용할 수 있습니다.</p>
                <p>iOS의 경우에는 Safari를, 안드로이드의 경우에는 Chrome을 사용해주세요. </p>
            </CardBox>
            {step1}
            {step2}
            {step3}
            <ErrorBox>{errMsg}</ErrorBox>
        </Page>
    )
}

export default Register