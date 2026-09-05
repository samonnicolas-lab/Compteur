import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { Button } from '../Button';

describe('Button', () => {
  it('renders its label and responds to press', async () => {
    const onPress = jest.fn();
    await render(<Button label="Créer un compteur" onPress={onPress} />);

    expect(screen.getByText('Créer un compteur')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Créer" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator instead of the label when loading', async () => {
    await render(<Button label="Créer" onPress={() => {}} loading />);
    expect(screen.queryByText('Créer')).toBeNull();
  });
});
