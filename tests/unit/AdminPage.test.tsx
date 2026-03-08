import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminPage from '../../src/pages/AdminPage'
import * as tripApi from '../../src/api/tripApi'
import type { Trip } from '../../shared/types/trip'

// Mock the tripApi module
vi.mock('../../src/api/tripApi', () => ({
  createTrip: vi.fn()
}))

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期表示', () => {
    it('should render the admin page with title', () => {
      renderWithRouter(<AdminPage />)
      
      expect(screen.getByText('SpliTrip - 管理ページ')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: '旅行を作成' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'メンバーを追加' })).toBeInTheDocument()
    })

    it('should render trip name input field', () => {
      renderWithRouter(<AdminPage />)
      
      const input = screen.getByPlaceholderText('例: 伊豆旅行')
      expect(input).toBeInTheDocument()
    })

    it('should render member name input field', () => {
      renderWithRouter(<AdminPage />)
      
      const input = screen.getByPlaceholderText('メンバー名')
      expect(input).toBeInTheDocument()
    })

    it('should render create trip button', () => {
      renderWithRouter(<AdminPage />)

      const button = screen.getByRole('button', { name: '旅行を作成' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('メンバー追加機能', () => {
    it('should add member when add button is clicked', () => {
      renderWithRouter(<AdminPage />)
      
      const input = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(input, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      expect(screen.getByText('山田')).toBeInTheDocument()
      expect(screen.getByText('登録済みメンバー (1人)')).toBeInTheDocument()
    })

    it('should add member when Enter key is pressed', () => {
      renderWithRouter(<AdminPage />)
      
      const input = screen.getByPlaceholderText('メンバー名')
      
      fireEvent.change(input, { target: { value: '鈴木' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })
      
      expect(screen.getByText('鈴木')).toBeInTheDocument()
    })

    it('should clear input field after adding member', () => {
      renderWithRouter(<AdminPage />)
      
      const input = screen.getByPlaceholderText('メンバー名') as HTMLInputElement
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(input, { target: { value: '田中' } })
      fireEvent.click(addButton)
      
      expect(input.value).toBe('')
    })

    it('should show error when trying to add empty member name', () => {
      renderWithRouter(<AdminPage />)
      
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.click(addButton)
      
      expect(screen.getByText('メンバー名を入力してください')).toBeInTheDocument()
    })

    it('should add multiple members', () => {
      renderWithRouter(<AdminPage />)
      
      const input = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(input, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      fireEvent.change(input, { target: { value: '鈴木' } })
      fireEvent.click(addButton)
      
      fireEvent.change(input, { target: { value: '田中' } })
      fireEvent.click(addButton)
      
      expect(screen.getByText('登録済みメンバー (3人)')).toBeInTheDocument()
      expect(screen.getByText('山田')).toBeInTheDocument()
      expect(screen.getByText('鈴木')).toBeInTheDocument()
      expect(screen.getByText('田中')).toBeInTheDocument()
    })

    it('should remove member when delete button is clicked', () => {
      renderWithRouter(<AdminPage />)
      
      const input = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(input, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      const deleteButton = screen.getByRole('button', { name: '削除' })
      fireEvent.click(deleteButton)
      
      expect(screen.queryByText('山田')).not.toBeInTheDocument()
      expect(screen.queryByText('登録済みメンバー')).not.toBeInTheDocument()
    })
  })

  describe('旅行作成機能', () => {
    it('should show error when trip name is empty', () => {
      renderWithRouter(<AdminPage />)
      
      const createButton = screen.getByRole('button', { name: '旅行を作成' })
      fireEvent.click(createButton)
      
      expect(screen.getByText('旅行名を入力してください')).toBeInTheDocument()
    })

    it('should show error when no members are added', () => {
      renderWithRouter(<AdminPage />)
      
      const tripNameInput = screen.getByPlaceholderText('例: 伊豆旅行')
      fireEvent.change(tripNameInput, { target: { value: '伊豆旅行' } })
      
      const createButton = screen.getByRole('button', { name: '旅行を作成' })
      fireEvent.click(createButton)
      
      expect(screen.getByText('少なくとも1人のメンバーを追加してください')).toBeInTheDocument()
    })

    it('should create trip successfully', async () => {
      const mockTrip: Trip = {
        tripId: 'trip_20260308_abc123',
        tripName: '伊豆旅行',
        version: 1,
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
        members: [
          { id: 'm1', name: '山田', createdAt: '2026-03-08T10:00:00.000Z' },
          { id: 'm2', name: '鈴木', createdAt: '2026-03-08T10:00:00.000Z' }
        ],
        receipts: []
      }

      vi.mocked(tripApi.createTrip).mockResolvedValue(mockTrip)

      renderWithRouter(<AdminPage />)
      
      // 旅行名を入力
      const tripNameInput = screen.getByPlaceholderText('例: 伊豆旅行')
      fireEvent.change(tripNameInput, { target: { value: '伊豆旅行' } })
      
      // メンバーを追加
      const memberInput = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(memberInput, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      fireEvent.change(memberInput, { target: { value: '鈴木' } })
      fireEvent.click(addButton)
      
      // 旅行を作成
      const createButton = screen.getByRole('button', { name: '旅行を作成' })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(tripApi.createTrip).toHaveBeenCalledWith({
          tripName: '伊豆旅行',
          members: [{ name: '山田' }, { name: '鈴木' }]
        })
      })

      await waitFor(() => {
        expect(screen.getByText('旅行が作成されました！')).toBeInTheDocument()
      })
    })

    it('should display trip URL after creation', async () => {
      const mockTrip: Trip = {
        tripId: 'trip_20260308_abc123',
        tripName: '伊豆旅行',
        version: 1,
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
        members: [
          { id: 'm1', name: '山田', createdAt: '2026-03-08T10:00:00.000Z' }
        ],
        receipts: []
      }

      vi.mocked(tripApi.createTrip).mockResolvedValue(mockTrip)

      renderWithRouter(<AdminPage />)
      
      const tripNameInput = screen.getByPlaceholderText('例: 伊豆旅行')
      fireEvent.change(tripNameInput, { target: { value: '伊豆旅行' } })
      
      const memberInput = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(memberInput, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      const createButton = screen.getByRole('button', { name: '旅行を作成' })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(screen.getByText('旅行URL')).toBeInTheDocument()
      })

      const urlInput = screen.getByDisplayValue(/\/trip\/trip_20260308_abc123/)
      expect(urlInput).toBeInTheDocument()
    })

    it('should show loading state during trip creation', async () => {
      const mockTrip: Trip = {
        tripId: 'trip_20260308_abc123',
        tripName: '伊豆旅行',
        version: 1,
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
        members: [
          { id: 'm1', name: '山田', createdAt: '2026-03-08T10:00:00.000Z' }
        ],
        receipts: []
      }

      // Delay the response to test loading state
      vi.mocked(tripApi.createTrip).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockTrip), 100))
      )

      renderWithRouter(<AdminPage />)
      
      const tripNameInput = screen.getByPlaceholderText('例: 伊豆旅行')
      fireEvent.change(tripNameInput, { target: { value: '伊豆旅行' } })
      
      const memberInput = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(memberInput, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      const createButton = screen.getByRole('button', { name: '旅行を作成' })
      fireEvent.click(createButton)
      
      expect(screen.getByText('作成中...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByText('旅行が作成されました！')).toBeInTheDocument()
      })
    })

    it('should show error message when API call fails', async () => {
      vi.mocked(tripApi.createTrip).mockRejectedValue(new Error('サーバーエラーが発生しました'))

      renderWithRouter(<AdminPage />)
      
      const tripNameInput = screen.getByPlaceholderText('例: 伊豆旅行')
      fireEvent.change(tripNameInput, { target: { value: '伊豆旅行' } })
      
      const memberInput = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(memberInput, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      const createButton = screen.getByRole('button', { name: '旅行を作成' })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument()
      })
    })
  })

  describe('旅行作成後の表示', () => {
    it('should display trip details after creation', async () => {
      const mockTrip: Trip = {
        tripId: 'trip_20260308_abc123',
        tripName: '伊豆旅行',
        version: 1,
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
        members: [
          { id: 'm1', name: '山田', createdAt: '2026-03-08T10:00:00.000Z' },
          { id: 'm2', name: '鈴木', createdAt: '2026-03-08T10:00:00.000Z' }
        ],
        receipts: []
      }

      vi.mocked(tripApi.createTrip).mockResolvedValue(mockTrip)

      renderWithRouter(<AdminPage />)
      
      const tripNameInput = screen.getByPlaceholderText('例: 伊豆旅行')
      fireEvent.change(tripNameInput, { target: { value: '伊豆旅行' } })
      
      const memberInput = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(memberInput, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      fireEvent.change(memberInput, { target: { value: '鈴木' } })
      fireEvent.click(addButton)
      
      const createButton = screen.getByRole('button', { name: '旅行を作成' })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(screen.getByText('旅行名:')).toBeInTheDocument()
        expect(screen.getByText('伊豆旅行')).toBeInTheDocument()
        expect(screen.getByText('メンバー数:')).toBeInTheDocument()
        expect(screen.getByText('2人')).toBeInTheDocument()
      })
    })

    it('should show link to trip page', async () => {
      const mockTrip: Trip = {
        tripId: 'trip_20260308_abc123',
        tripName: '伊豆旅行',
        version: 1,
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
        members: [
          { id: 'm1', name: '山田', createdAt: '2026-03-08T10:00:00.000Z' }
        ],
        receipts: []
      }

      vi.mocked(tripApi.createTrip).mockResolvedValue(mockTrip)

      renderWithRouter(<AdminPage />)
      
      const tripNameInput = screen.getByPlaceholderText('例: 伊豆旅行')
      fireEvent.change(tripNameInput, { target: { value: '伊豆旅行' } })
      
      const memberInput = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(memberInput, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      const createButton = screen.getByRole('button', { name: '旅行を作成' })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const link = screen.getByText('旅行ページへ')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/trip/trip_20260308_abc123')
      })
    })

    it('should allow creating new trip after successful creation', async () => {
      const mockTrip: Trip = {
        tripId: 'trip_20260308_abc123',
        tripName: '伊豆旅行',
        version: 1,
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
        members: [
          { id: 'm1', name: '山田', createdAt: '2026-03-08T10:00:00.000Z' }
        ],
        receipts: []
      }

      vi.mocked(tripApi.createTrip).mockResolvedValue(mockTrip)

      renderWithRouter(<AdminPage />)
      
      const tripNameInput = screen.getByPlaceholderText('例: 伊豆旅行')
      fireEvent.change(tripNameInput, { target: { value: '伊豆旅行' } })
      
      const memberInput = screen.getByPlaceholderText('メンバー名')
      const addButton = screen.getByRole('button', { name: '追加' })
      
      fireEvent.change(memberInput, { target: { value: '山田' } })
      fireEvent.click(addButton)
      
      const createButton = screen.getByRole('button', { name: '旅行を作成' })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(screen.getByText('新しい旅行を作成')).toBeInTheDocument()
      })

      const newTripButton = screen.getByRole('button', { name: '新しい旅行を作成' })
      fireEvent.click(newTripButton)
      
      expect(screen.getByRole('heading', { name: '旅行を作成' })).toBeInTheDocument()
      expect(screen.queryByText('旅行が作成されました！')).not.toBeInTheDocument()
    })
  })
})
