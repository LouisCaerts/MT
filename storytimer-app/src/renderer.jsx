import { createRoot } from 'react-dom/client';
import Profile from './components/Profile';

const App = () =>{
    return (
        <>
        <h1>Hello!</h1>
        <Profile />
        </>
    )
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App/>);