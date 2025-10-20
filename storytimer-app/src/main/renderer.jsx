// imports
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes, Link } from "react-router-dom";

// routes
import Home from "../routes/Home.jsx";
import Preferences from "../routes/Preferences.jsx";
import Session from "../routes/Session.jsx";

// components
import Titlebar from '../components/Titlebar.jsx';
import Timer from '../components/Timer.jsx';




const App = () =>{
    return (
        <HashRouter>
            <Titlebar></Titlebar>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/session" element={<Session />} />
                <Route path="/preferences" element={<Preferences />} />
            </Routes>
        </HashRouter>
    )
};




const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App/>);