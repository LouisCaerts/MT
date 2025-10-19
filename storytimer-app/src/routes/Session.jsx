import Timer from '../components/Timer.jsx';

export default function Home() {
  return (
    <>
        <h1>Welcome to your session!</h1>
        <Timer duration={10} onComplete={() => console.log("done")} />
    </>
  )
}