
import Home from './pages/Home'
import Editor from './pages/EditorPage'
import { BrowserRouter,Route,Router, Routes } from 'react-router-dom'
import './App.css'

function App() {
  return <>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route  path="/room/:roomId" element={<Editor />} />
    </Routes>
    </BrowserRouter>
    </>
  
}

export default App
