import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import TripListComponent from '../../src/components/TripListComponent'
import { TripListItem } from '../../shared/types/tripListItem'

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('TripListComponent', () => {
  beforeEach(() => {
    // Reset window.confirm mock before each test
    vi.restoreAllMocks()
  })

  it('空リスト時にメッセージを表示する（要件: 1.4）', () => {
    const onDelete = vi.fn()
    renderWithRouter(<TripListComponent trips={[]} onDelete={onDelete} />)
    
    expect(screen.getByText('まだ旅行が作成されていません')).toBeDefined()
  })

  it('旅行リストを表示する（要件: 1.2）', () => {
    const trips: TripListItem[] = [
      {
        tripId: 'trip1',
        tripName: '伊豆旅行',
        memberCount: 3,
        createdAt: '2026-03-08T10:00:00.000Z'
      }
    ]
    const onDelete = vi.fn()
    
    renderWithRouter(<TripListComponent trips={trips} onDelete={onDelete} />)
    
    // 旅行名が表示されている
    expect(screen.getByText('伊豆旅行')).toBeDefined()
    // メンバー数が表示されている
    expect(screen.getByText(/メンバー数: 3人/)).toBeDefined()
    // 作成日時が表示されている
    expect(screen.getByText(/作成日時:/)).toBeDefined()
  })

  it('各旅行に旅行ページへのリンクを表示する（要件: 1.3）', () => {
    const trips: TripListItem[] = [
      {
        tripId: 'trip1',
        tripName: '伊豆旅行',
        memberCount: 3,
        createdAt: '2026-03-08T10:00:00.000Z'
      }
    ]
    const onDelete = vi.fn()
    
    renderWithRouter(<TripListComponent trips={trips} onDelete={onDelete} />)
    
    const link = screen.getByRole('link', { name: '開く' })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/trip/trip1')
  })

  it('各旅行に削除ボタンを表示する（要件: 2.1）', () => {
    const trips: TripListItem[] = [
      {
        tripId: 'trip1',
        tripName: '伊豆旅行',
        memberCount: 3,
        createdAt: '2026-03-08T10:00:00.000Z'
      }
    ]
    const onDelete = vi.fn()
    
    renderWithRouter(<TripListComponent trips={trips} onDelete={onDelete} />)
    
    const deleteButton = screen.getByRole('button', { name: '削除' })
    expect(deleteButton).toBeDefined()
  })

  it('複数の旅行を表示する', () => {
    const trips: TripListItem[] = [
      {
        tripId: 'trip1',
        tripName: '伊豆旅行',
        memberCount: 3,
        createdAt: '2026-03-08T10:00:00.000Z'
      },
      {
        tripId: 'trip2',
        tripName: '京都旅行',
        memberCount: 5,
        createdAt: '2026-03-09T10:00:00.000Z'
      }
    ]
    const onDelete = vi.fn()
    
    renderWithRouter(<TripListComponent trips={trips} onDelete={onDelete} />)
    
    expect(screen.getByText('伊豆旅行')).toBeDefined()
    expect(screen.getByText('京都旅行')).toBeDefined()
    expect(screen.getByText('作成済みの旅行 (2件)')).toBeDefined()
  })

  it('削除ボタンクリック時に確認ダイアログを表示する（要件: 2.2）', async () => {
    const trips: TripListItem[] = [
      {
        tripId: 'trip1',
        tripName: '伊豆旅行',
        memberCount: 3,
        createdAt: '2026-03-08T10:00:00.000Z'
      }
    ]
    const onDelete = vi.fn()
    const user = userEvent.setup()
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm')
    confirmSpy.mockReturnValue(true)
    
    renderWithRouter(<TripListComponent trips={trips} onDelete={onDelete} />)
    
    const deleteButton = screen.getByRole('button', { name: '削除' })
    await user.click(deleteButton)
    
    // 確認ダイアログが表示されたことを確認
    expect(confirmSpy).toHaveBeenCalledWith('「伊豆旅行」を削除してもよろしいですか？\nこの操作は取り消せません。')
    // 確認後にonDeleteが呼ばれたことを確認
    expect(onDelete).toHaveBeenCalledWith('trip1')
  })

  it('削除確認ダイアログでキャンセルした場合、削除されない（要件: 2.2）', async () => {
    const trips: TripListItem[] = [
      {
        tripId: 'trip1',
        tripName: '伊豆旅行',
        memberCount: 3,
        createdAt: '2026-03-08T10:00:00.000Z'
      }
    ]
    const onDelete = vi.fn()
    const user = userEvent.setup()
    
    // Mock window.confirm to return false (cancel)
    const confirmSpy = vi.spyOn(window, 'confirm')
    confirmSpy.mockReturnValue(false)
    
    renderWithRouter(<TripListComponent trips={trips} onDelete={onDelete} />)
    
    const deleteButton = screen.getByRole('button', { name: '削除' })
    await user.click(deleteButton)
    
    // 確認ダイアログが表示されたことを確認
    expect(confirmSpy).toHaveBeenCalled()
    // キャンセルしたのでonDeleteは呼ばれない
    expect(onDelete).not.toHaveBeenCalled()
  })
})
