
import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"
import './ui/phone.css'

const app = new App()

ReactDOM.createRoot(document.getElementById("root")).render(
  <app.View />
)
