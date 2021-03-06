import styled from 'styled-components'

export default function TimetableTd({today, lesson}) {
    if (!lesson) return <td/>

    return <WrapTd today={today}>
        <Subject>{lesson.Subject}</Subject>
        {lesson.Teacher ? <Teacher>{lesson.Teacher}</Teacher> : null}
        {lesson.Room ? <Room>{lesson.Room}</Room> : null}
    </WrapTd>
}

const WrapTd = styled.td`
color: var(--card-box-text-color);
background: var(--card-box-bg-color);
opacity: ${props => props.today ? 1 : 0.7};

&:hover {
    opacity: 1;
}

padding: .4em !important;
border-radius: .5em;

min-width: 3.5rem;

text-align: center;
word-break: keep-all;

transition: .3s;
`

const Subject = styled.p`
font-weight: 700;
display: block;
`

const Teacher = styled.p`
word-break: keep-all;
font-size: .75em;
font-weight: 500;
display: block;
`

const Room = styled.p`
word-break: keep-all;
font-size: .75em;
font-weight: 500;
display: block;
` 