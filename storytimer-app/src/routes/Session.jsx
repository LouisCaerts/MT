import Timer from '../components/Timer.jsx';

import { useEffect, useState, useRef } from "react";
import { PreferencesAPI } from '../main/api';

export default function Home() {
    const [length, setLength] = useState(30);
	
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
      	<>
			<h1>Welcome to your session!</h1>
			<Timer duration={length * 60} onComplete={() => console.log("done")} />
      	</>
    )
}