// imports
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes, Link } from "react-router-dom";

// routes
import Home from "../routes/Home.jsx";
import Preferences from "../routes/Preferences.jsx";
import Session from "../routes/Session.jsx";
import Testing from "../routes/Testing.jsx";
import TestingTwo from "../routes/Story.jsx";

// components
import Titlebar from '../components/Titlebar.jsx';
import Timer from '../components/Timer.jsx';




const App = () =>{
    return (
        <HashRouter>
            <Titlebar></Titlebar>
            
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",      // full window height
                    overflow: "hidden",   // no scrollbars
                }}
            >
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/session" element={<Session />} />
                    <Route path="/preferences" element={<Preferences />} />
                    <Route path="/testing" element={<Testing />} />
                    <Route path="/testingtwo" element={<TestingTwo scriptId="test" onDone={(flags)=>{/* ... */}} />} />
                </Routes>
            </div>
        </HashRouter>
    )
};




const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App/>);