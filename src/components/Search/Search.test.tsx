import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Search from './Search';

describe('Search', () => {
  it('рендерит поле поиска с плейсхолдером', () => {
    render(<Search />);
    const input = screen.getByPlaceholderText('Поиск');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'search');
  });

  it('при вводе текста вызывается onSearchChange с текущим значением', async () => {
    const user = userEvent.setup();
    const onSearchChange = jest.fn();
    render(<Search onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Поиск');
    await user.type(input, 'abc');
    expect(onSearchChange).toHaveBeenCalledWith('a');
    expect(onSearchChange).toHaveBeenCalledWith('ab');
    expect(onSearchChange).toHaveBeenCalledWith('abc');
  });

  it('значение инпута отображается и обновляется', async () => {
    const user = userEvent.setup();
    render(<Search />);
    const input = screen.getByPlaceholderText('Поиск');
    await user.type(input, 'test');
    expect(input).toHaveValue('test');
  });

  it('работает без onSearchChange', async () => {
    const user = userEvent.setup();
    render(<Search />);
    const input = screen.getByPlaceholderText('Поиск');
    await user.type(input, 'x');
    expect(input).toHaveValue('x');
  });
});
