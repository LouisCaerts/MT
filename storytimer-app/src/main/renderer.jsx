// imports
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes, Link } from "react-router-dom";

// routes
import Home from "../routes/Home.jsx";
import Preferences from "../routes/Preferences.jsx";
import Session from "../routes/Session.jsx";
import Testing from "../routes/Testing.jsx";
import TestingTwo from "../routes/Story.jsx";
import Daily from '../routes/Daily.jsx';

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
                    <Route path="/daily" element={<Daily />} />
                    <Route path="/testingtwo" element={<TestingTwo scriptId="test" onDone={(flags)=>{/* ... */}} />} />
                    <Route path="/story_day_1" element={<TestingTwo scriptId="day_1" onDone={(flags)=>{/* ... */}} />} />
                    <Route path="/story_day_2" element={<TestingTwo scriptId="day_2" onDone={(flags)=>{/* ... */}} />} />
                    <Route path="/story_day_3" element={<TestingTwo scriptId="day_3" onDone={(flags)=>{/* ... */}} />} />
                    <Route path="/story_day_4" element={<TestingTwo scriptId="day_4" onDone={(flags)=>{/* ... */}} />} />
                    <Route path="/story_day_5" element={<TestingTwo scriptId="day_5" onDone={(flags)=>{/* ... */}} />} />
                </Routes>
            </div>
        </HashRouter>
    )
};




const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App/>);