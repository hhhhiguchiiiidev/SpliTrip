import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MemberInputComponent from '../../src/components/MemberInputComponent'

describe('MemberInputComponent', () => {
  it('renders input fields correctly', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={0} onAddMember={mockOnAddMember} />)

    expect(screen.getByLabelText('メンバー名')).toBeInTheDocument()
    expect(screen.getByLabelText('デフォルト比率')).toBeInTheDocument()
    expect(screen.getByText('追加')).toBeInTheDocument()
  })

  it('shows default ratio of 100', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={0} onAddMember={mockOnAddMember} />)

    const ratioInput = screen.getByLabelText('デフォルト比率') as HTMLInputElement
    expect(ratioInput.value).toBe('100')
  })

  it('adds member with default ratio', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={0} onAddMember={mockOnAddMember} />)

    const nameInput = screen.getByLabelText('メンバー名')
    const ratioInput = screen.getByLabelText('デフォルト比率')
    const submitButton = screen.getByText('追加')

    fireEvent.change(nameInput, { target: { value: 'Test Member' } })
    fireEvent.change(ratioInput, { target: { value: '150' } })
    fireEvent.click(submitButton)

    expect(mockOnAddMember).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Member',
        defaultRatio: 150,
      })
    )
  })

  it('shows error when name is empty', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={0} onAddMember={mockOnAddMember} />)

    const submitButton = screen.getByText('追加')
    fireEvent.click(submitButton)

    expect(screen.getByText('メンバー名を入力してください')).toBeInTheDocument()
    expect(mockOnAddMember).not.toHaveBeenCalled()
  })

  it('shows error when ratio is zero', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={0} onAddMember={mockOnAddMember} />)

    const nameInput = screen.getByLabelText('メンバー名')
    const ratioInput = screen.getByLabelText('デフォルト比率')
    const submitButton = screen.getByText('追加')

    fireEvent.change(nameInput, { target: { value: 'Test Member' } })
    fireEvent.change(ratioInput, { target: { value: '0' } })
    fireEvent.click(submitButton)

    expect(screen.getByText('比率は0より大きい値を入力してください')).toBeInTheDocument()
    expect(mockOnAddMember).not.toHaveBeenCalled()
  })

  it('shows error when ratio is negative', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={0} onAddMember={mockOnAddMember} />)

    const nameInput = screen.getByLabelText('メンバー名')
    const ratioInput = screen.getByLabelText('デフォルト比率')
    const submitButton = screen.getByText('追加')

    fireEvent.change(nameInput, { target: { value: 'Test Member' } })
    fireEvent.change(ratioInput, { target: { value: '-10' } })
    fireEvent.click(submitButton)

    expect(screen.getByText('比率は0より大きい値を入力してください')).toBeInTheDocument()
    expect(mockOnAddMember).not.toHaveBeenCalled()
  })

  it('resets form after successful submission', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={0} onAddMember={mockOnAddMember} />)

    const nameInput = screen.getByLabelText('メンバー名') as HTMLInputElement
    const ratioInput = screen.getByLabelText('デフォルト比率') as HTMLInputElement
    const submitButton = screen.getByText('追加')

    fireEvent.change(nameInput, { target: { value: 'Test Member' } })
    fireEvent.change(ratioInput, { target: { value: '200' } })
    fireEvent.click(submitButton)

    expect(nameInput.value).toBe('')
    expect(ratioInput.value).toBe('100')
  })

  it('accepts decimal ratio values', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={0} onAddMember={mockOnAddMember} />)

    const nameInput = screen.getByLabelText('メンバー名')
    const ratioInput = screen.getByLabelText('デフォルト比率')
    const submitButton = screen.getByText('追加')

    fireEvent.change(nameInput, { target: { value: 'Test Member' } })
    fireEvent.change(ratioInput, { target: { value: '1.5' } })
    fireEvent.click(submitButton)

    expect(mockOnAddMember).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Member',
        defaultRatio: 1.5,
      })
    )
  })

  it('generates correct member ID based on existing count', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={2} onAddMember={mockOnAddMember} />)

    const nameInput = screen.getByLabelText('メンバー名')
    const submitButton = screen.getByText('追加')

    fireEvent.change(nameInput, { target: { value: 'Test Member' } })
    fireEvent.click(submitButton)

    expect(mockOnAddMember).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'm3',
        name: 'Test Member',
      })
    )
  })

  it('trims whitespace from member name', () => {
    const mockOnAddMember = vi.fn()
    render(<MemberInputComponent existingMemberCount={0} onAddMember={mockOnAddMember} />)

    const nameInput = screen.getByLabelText('メンバー名')
    const submitButton = screen.getByText('追加')

    fireEvent.change(nameInput, { target: { value: '  Test Member  ' } })
    fireEvent.click(submitButton)

    expect(mockOnAddMember).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Member',
      })
    )
  })
})
