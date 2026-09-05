import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { EmojiInput } from '../EmojiInput';

describe('EmojiInput', () => {
  it('keeps only the last character typed', async () => {
    const onChange = jest.fn();
    await render(<EmojiInput value="🐾" onChange={onChange} />);

    await fireEvent.changeText(screen.getByDisplayValue('🐾'), '🐾🐶');
    expect(onChange).toHaveBeenCalledWith('🐶');
  });

  it('reports an empty string when cleared', async () => {
    const onChange = jest.fn();
    await render(<EmojiInput value="🐾" onChange={onChange} />);

    await fireEvent.changeText(screen.getByDisplayValue('🐾'), '');
    expect(onChange).toHaveBeenCalledWith('');
  });
});
