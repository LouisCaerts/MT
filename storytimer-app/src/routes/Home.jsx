import '../stylesheets/Home.css';

import WeeklyProgress from '../components/WeeklyProgress';
import DailyProgress from '../components/DailyProgress';

export default function Home() {
  return (
    <div id="homeContainer">
      <WeeklyProgress />
      <DailyProgress />
    </div>
  )
}