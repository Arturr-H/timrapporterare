import React from "react";
import ReactDOM from "react-dom/client";
import TimeReportApp from "./App";
import "./index.css";
import { DragProvider } from "./components/DragAndDrop";

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);
root.render(
    <React.StrictMode>
        <DragProvider>
            <TimeReportApp />
        </DragProvider>
    </React.StrictMode>
);
