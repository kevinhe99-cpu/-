import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import AddProduct from './pages/AddProduct'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/add" element={<AddProduct />} />
    </Routes>
  )
}
