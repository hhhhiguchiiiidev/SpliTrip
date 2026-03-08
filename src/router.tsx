import { Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import TripPage from './pages/TripPage'
import ReceiptInputPage from './pages/ReceiptInputPage'
import ReceiptListPage from './pages/ReceiptListPage'
import ReceiptEditPage from './pages/ReceiptEditPage'
import SummaryPage from './pages/SummaryPage'
import MemberDetailPage from './pages/MemberDetailPage'

/**
 * アプリケーションルーティング設定
 * 要件: 7.3
 */
function Router() {
  return (
    <Routes>
      {/* ホームページ - 管理ページへリダイレクト */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      
      {/* 管理ページ - 旅行作成とメンバー登録 */}
      <Route path="/admin" element={<AdminPage />} />
      
      {/* 旅行ページ - 旅行の詳細とナビゲーション */}
      <Route path="/trip/:tripId" element={<TripPage />} />
      
      {/* レシート入力ページ - 新規レシート作成 */}
      <Route path="/trip/:tripId/receipt/new" element={<ReceiptInputPage />} />
      
      {/* レシート一覧ページ - レシート修正 */}
      <Route path="/trip/:tripId/receipts" element={<ReceiptListPage />} />
      
      {/* レシート編集ページ - 既存レシート編集 */}
      <Route path="/trip/:tripId/receipt/:receiptId/edit" element={<ReceiptEditPage />} />
      
      {/* 精算ページ - メンバー別精算サマリー */}
      <Route path="/trip/:tripId/summary" element={<SummaryPage />} />
      
      {/* メンバー精算詳細ページ - 特定メンバーの立替・負担詳細 */}
      <Route path="/trip/:tripId/summary/:memberId" element={<MemberDetailPage />} />
    </Routes>
  )
}

export default Router
