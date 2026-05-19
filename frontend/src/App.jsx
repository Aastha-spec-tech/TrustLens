import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import SellerDetail from './pages/SellerDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/seller/:idx" element={<SellerDetail />} />
        {/* Old compare route redirects to unified home */}
        <Route path="/compare" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
