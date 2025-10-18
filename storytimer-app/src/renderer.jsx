// imports
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes, Link } from "react-router-dom";

// routes
import Home from "./routes/Home.jsx";
import Settings from "./routes/Settings.jsx";

// components
import Titlebar from './components/Titlebar.jsx';




const App = () =>{
    return (
        <HashRouter>
            <Titlebar></Titlebar>
            <h1>Helloooooooooooooo!</h1>
            <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </HashRouter>
    )
};




const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App/>);