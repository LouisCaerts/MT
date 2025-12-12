import Timer from '../components/Timer.jsx';

import { useEffect, useState, useRef } from "react";
import { PreferencesAPI } from '../main/api';
import { useNavigate } from "react-router-dom";

export default function Home() {
    const [length, setLength] = useState(30);
	const navigate = useNavigate();
	
	useEffect(() => {
		let abort = false;

		const loadToday = async () => {
			const prefs = await PreferencesAPI.getAll();
			if (abort) return;
			setLength(prefs?.["sessionLength"] ?? 30);
		};

		loadToday();

		return () => { abort = true; };
	}, []);

    return (
      	<div id="sessionContainer">
			<Timer duration={length * 60} onComplete={() => navigate("/")} />
      	</div>
    )
}