
import React from "react"
import ReactDOM from "react-dom/client"
import { ExperimentApp } from "./experiment/ExperimentApp"

const app = new ExperimentApp()

ReactDOM.createRoot(document.getElementById("root")).render(
  <app.View />
)
