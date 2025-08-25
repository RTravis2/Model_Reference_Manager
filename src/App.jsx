import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Counter from "./counter"
import Header from "./header"
import Timer from "./timer";
import CountdownTimer from "./countdowntimer";
import Practice from './script_practice'
import ModelGrid from "./ModelGrid";
import Logo from "./logo";
import ModelBrowser from "./ModelBrowser";
import ThemeToggle from "./ThemeToggle";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div>
      <header className="site-header">
        <Logo  />
        {/* <ThemeToggle /> */}
      </header>

    </div>

    <div>
      <Header />
    </div>
      
    <div>
      <Practice />
    </div>

    <div>
      <CountdownTimer />
    </div>

    <div style={{ padding: 20 }}>
      <h1>Models</h1>
      <ModelBrowser />
    </div>
    




    </>
  )
}










export default App
