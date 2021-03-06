import { useState } from 'react';
import axios from 'axios'
import {useParams} from 'react-router-dom'

import Page from '../../components/Page'
import {ErrorBox} from '../../components/AlertBox'

const PwChange = () => {
    const [password, setPassword] = useState("")
    const [errMsg, setErrMsg] = useState("")
    const {token} = useParams()
    const [ok, setOk] = useState(false)
    const [title, setTitle] = useState("암호 재설정")
    const [loading, setLoading] = useState(false)

    const change = async e => {
        e.preventDefault()
        setLoading(true)
        let d = {
            Token: token,
            Password: password
        }
        try {
            await axios.post(`/tokens/pw-change`, d)
            setOk(true)
            setTitle("재설정 완료")
        } catch (e) {
            setErrMsg("변경에 실패했습니다. 만료된 링크를 사용하고 있나요?")
        }
        setLoading(false)
    }

    return (
        <Page title={title}>
            <style>nav {'{opacity: 0}'}</style>
            {!ok ?
                <>
                    <ErrorBox>{errMsg}</ErrorBox>
                    <p>관리자에게 받은 링크로 암호를 재설정합니다.</p>
                    <form className="p-2" onSubmit={change}>
                        <div className={"flex flex-column"}>
                            <label className={"my-2"} htmlFor="password-input">암호(8글자 이상)</label>
                            <input type="password" value={password}
                                   onChange={event => setPassword(event.target.value)}
                                   className={"input"} id="password-input"
                                   minLength={8} maxLength={30}
                                   placeholder="8글자 이상" required
                                   autoComplete="new-password"/>
                            <button className={!loading ? "button" : "button loading"} type="submit">변경</button>
                        </div>
                    </form>
                </> : <p>이제 제고라이프 앱으로 돌아가 로그인하세요.</p>
            }
        </Page>
    )
}

export default PwChange