import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { EmojiInput } from '../EmojiInput';

describe('EmojiInput', () => {
  it('passes the typed text through unchanged, even multi-codepoint emojis', async () => {
    const onChange = jest.fn();
    await render(<EmojiInput value="🐾" onChange={onChange} />);

    // 👨‍👩‍👧‍👦 est une séquence de plusieurs caractères techniques (ZWJ) :
    // elle ne doit pas être tronquée par le champ.
    await fireEvent.changeText(screen.getByDisplayValue('🐾'), '👨‍👩‍👧‍👦');
    expect(onChange).toHaveBeenCalledWith('👨‍👩‍👧‍👦');
  });

  it('reports an empty string when cleared', async () => {
    const onChange = jest.fn();
    await render(<EmojiInput value="🐾" onChange={onChange} />);

    await fireEvent.changeText(screen.getByDisplayValue('🐾'), '');
    expect(onChange).toHaveBeenCalledWith('');
  });
});
