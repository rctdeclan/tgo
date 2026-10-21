
import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"

const app = new App()

ReactDOM.createRoot(document.getElementById("root")).render(
  <app.View />
)
