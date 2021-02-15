import React, {useEffect, useState} from 'react'
import {NavLink, withRouter} from 'react-router-dom'
import axios from 'axios'

import Page from '../../components/Page'

const payments = {
    toss: {
        code: "toss",
        name: "토스로",
        color: "white",
        bgColor: "#0050ff"
    },
    kakaopay: {
        code: "kakaopay",
        name: "카카오페이로",
        color: "black",
        bgColor: "#ffeb00"
    },
    bank: {
        code: "bank",
        name: "계좌 이체로",
        color: "white",
        bgColor: "rgb(1, 173, 1)"
    }
}

const Pay = ({match, history}) => {
    const [linkarea, setLinkarea] = useState(null)
    const [cmp, setCmp] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const {id} = match.params
        getCampaign(id)
    }, [match])

    const getCampaign = async (id) => {
        setLoading(true)
        try {
            const {data} = await axios.get(`campaigns-not-payed/${id}`)
            setCmp(data)
        } catch (e) {
            alert("로딩에 실패했어요.")
        } finally {
            setLoading(false)
        }
    }

    const confirmPay = async () => {
        if (!window.confirm("정말 송금을 완료했나요?\n(허위 결제 완료 시 제제가 있을 수 있습니다.)")) {
            return
        }

        try {
            await axios.patch(`campaigns-not-payed/${match.params.id}/confirm-pay`, {Payed: true})
            alert("결제 완료 신청되었습니다.")
            history.push(`/campaigns`)
        } catch {
            alert("결제 완료 신청에 실패했어요.")
        }
    }

    const copy = () => {
        linkarea.focus();
        linkarea.select();

        const range = document.createRange();
        range.selectNodeContents(linkarea);

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        linkarea.setSelectionRange(0, linkarea.value.length);
        if (document.execCommand('copy')) {
            alert("복사했습니다.")
        } else {
            alert("복사에 실패했습니다. 직접 복사해주세요...")
        }
    }

    if (loading) {
        return <div className="loader"/>
    }

    return <Page title={<NavLink className="no-underline" to="/campaigns"> 결제하기</NavLink>}>
        <p className="page-sub mb-4">'{cmp.Title}'<br/>를 결제합니다</p>

        {cmp.PayLink ? <>
                {cmp.Payment === "toss" ? <p className="info">아래 링크를 웹브라우저에 붙여넣거나</p> : null}
                {cmp.Payment === "kakaopay" ? <p className="info">아래 링크를 웹 브라우저에 붙여넣어</p> : null}
                <input type="text" ref={e => setLinkarea(e)} value={cmp.PayLink} className="input-form my-4"
                       style={{color: payments[cmp.Payment].color, backgroundColor: payments[cmp.Payment].bgColor}}/>
                <button onClick={copy} className="button button-edit">복사하기</button>
                <hr/>
            </>
            : null}
        <p className="info">아래 정보로 입금하세요</p>
        <div className="bank-info">
            <p><span>받는 분 통장 표시:</span> 제라{cmp.PayCode}</p>
            <p><span>보낼 금액:</span> {cmp.Price}원</p>
            <p><span>은행:</span> 광주</p>
            <p><span>계좌번호:</span> 083121196659</p>
        </div>
        <p className="info mt-6">결제를 완료했으면 결제 완료 버튼을 눌러주세요.</p>
        <button className="button w-100 mt-4" onClick={confirmPay}>결제 완료</button>
    </Page>
}

export default withRouter(Pay)