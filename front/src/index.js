import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import Root from './Root';
import * as serviceWorker from './serviceWorker';
import axios from 'axios'



// let server = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
let server = "https://zego.life"

if (process.env.NODE_ENV === 'development') {
    server = "https://zego.life"
    // server = "http://localhost:8080"
    // server = window.location.protocol + "//" + window.location.hostname + ":8080";
}

axios.defaults.baseURL = server + "/api/v1/"
axios.interceptors.request.use(config => {
    let token = localStorage.getItem("token")
    if (token != null) {
        config.headers.common["Heartbeat-Overheat"] = token
    }
    return config
})
axios.defaults.headers.common["Content-Type"] = "application/json;charset=utf8"

let theme = localStorage.getItem("theme")
if (theme === null) {
    if (window.matchMedia(`(prefers-color-scheme: dark)`).matches) {
        theme = "dark"
    } else {
        theme = "light"
    }
    localStorage.setItem("theme", theme)
}

document.querySelector("body").classList.add(`theme-${theme}`)

if (new Date() >= new Date("2021-09-01")) {
    window.location.href = "/closing-page/index.html"
} else {
    ReactDOM.render(
        <StrictMode>
            <Root/>
        </StrictMode>,
        document.getElementById('root')
    );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
