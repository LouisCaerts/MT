import '../stylesheets/Titlebar.css';

import { Menu, X, Home, Settings, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {Collapse, UnmountClosed} from 'react-collapse';
import { Route, Routes, Link } from "react-router-dom";

export default function Titlebar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      // if menu is open and click target is outside it, close
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    // listen for clicks anywhere on the document
    document.addEventListener("mousedown", handleClickOutside);
    // cleanup on unmount
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpen]);

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

      <div id="titleBarMenu" class="nonDraggable" ref={menuRef}>
        <Collapse isOpened={open}>
          <nav id="hamburgerNav">
            <div className="hamburgerLinkWrapper"><Link className="hamburgerLink" to="/home" onClick={() => setOpen(false)}>Home</Link></div>
            <div className="hamburgerLinkWrapper"><Link className="hamburgerLink" to="/daily" onClick={() => setOpen(false)}>Daily Reflection</Link></div>
            <div className="hamburgerLinkWrapper"><Link className="hamburgerLinkBottom" to="/preferences" onClick={() => setOpen(false)}>Preferences</Link></div>
          </nav>
        </Collapse>
      </div>

    </div>
  )
}