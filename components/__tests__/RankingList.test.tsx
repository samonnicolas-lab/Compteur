import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { RankingList } from '../RankingList';

describe('RankingList', () => {
  it('shows the empty label when there are no rows', async () => {
    await render(<RankingList rows={[]} />);
    expect(screen.getByText('Aucun membre pour l’instant.')).toBeTruthy();
  });

  it('renders medals for the top 3 and numbers afterwards', async () => {
    await render(
      <RankingList
        rows={[
          { user_id: 'u1', pseudo: 'Alice', score: 5 },
          { user_id: 'u2', pseudo: 'Bob', score: 3 },
          { user_id: 'u3', pseudo: 'Chloé', score: 2 },
          { user_id: 'u4', pseudo: 'Dan', score: 1 },
        ]}
      />
    );
    expect(screen.getByText('🥇')).toBeTruthy();
    expect(screen.getByText('🥈')).toBeTruthy();
    expect(screen.getByText('🥉')).toBeTruthy();
    expect(screen.getByText('4.')).toBeTruthy();
    expect(screen.getByText('Alice')).toBeTruthy();
  });
});
