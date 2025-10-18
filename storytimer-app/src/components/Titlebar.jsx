import '../stylesheets/Titlebar.css';

import { Menu, X, Home, Settings, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {Collapse, UnmountClosed} from 'react-collapse';
import { Route, Routes, Link } from "react-router-dom";

export default function Titlebar() {
  const [open, setOpen] = useState(false);

  return (
    <div id="titleBarContainer">

      <div id="titleBar" class="draggable">
        <button id="titleBarHamburger" class="nonDraggable" onClick={(e) => {e.stopPropagation(); setOpen((v) => !v);}}>
          {open ? <X size={22} color="white" /> : <Menu size={22} color="white" />}
        </button>
        <span id="titleBarTitle" class="draggable">Storytimer</span>
        <div id="titleBarStoplights">
          <button id="stoplightMinimize" class="nonDraggable stoplightButton" onClick={(e) => { e.stopPropagation(); window.windowControls.minimize(); }}>
            <Minimize2 size={22} color="white" />
          </button>
          <button id="stoplightClose" class="nonDraggable stoplightButton" onClick={(e) => { e.stopPropagation(); window.windowControls.close(); }}>
            <X size={22} color="red" />
          </button>
        </div>
      </div>

      <div id="titleBarMenu" class="nonDraggable">
        <Collapse isOpened={open}>
          <nav id="hamburgerNav">
            <div className="hamburgerLinkWrapper"><Link className="hamburgerLink" to="/home">Home</Link></div>
            <div className="hamburgerLinkWrapper"><Link className="hamburgerLinkBottom" to="/settings">Settings</Link></div>
          </nav>
        </Collapse>
      </div>

    </div>
  )
}