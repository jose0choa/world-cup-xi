export const knockoutData = {
  updatedAt: '2026-07-03',
  sourceUrl: 'https://www.espn.com/soccer/bracket',
  sourceLabel: 'ESPN bracket',
  rounds: [
    {
      id: 'round-of-32',
      label: 'Round of 32',
      matches: [
        {
          id: 'M73',
          date: 'Jun 28',
          status: 'Final',
          teams: [
            { code: 'RSA', score: '0' },
            { code: 'CAN', score: '1' },
          ],
          winnerCode: 'CAN',
        },
        {
          id: 'M75',
          date: 'Jun 30',
          status: 'Final pens',
          teams: [
            { code: 'NED', score: '1', pens: '2' },
            { code: 'MAR', score: '1', pens: '3' },
          ],
          winnerCode: 'MAR',
        },
        {
          id: 'M74',
          date: 'Jun 29',
          status: 'Final pens',
          teams: [
            { code: 'GER', score: '1', pens: '3' },
            { code: 'PAR', score: '1', pens: '4' },
          ],
          winnerCode: 'PAR',
        },
        {
          id: 'M77',
          date: 'Jun 30',
          status: 'Final',
          teams: [
            { code: 'FRA', score: '3' },
            { code: 'SWE', score: '0' },
          ],
          winnerCode: 'FRA',
        },
        {
          id: 'M76',
          date: 'Jun 29',
          status: 'Final',
          teams: [
            { code: 'BRA', score: '2' },
            { code: 'JPN', score: '1' },
          ],
          winnerCode: 'BRA',
        },
        {
          id: 'M78',
          date: 'Jun 30',
          status: 'Final',
          teams: [
            { code: 'CIV', score: '1' },
            { code: 'NOR', score: '2' },
          ],
          winnerCode: 'NOR',
        },
        {
          id: 'M79',
          date: 'Jul 1',
          status: 'Final',
          teams: [
            { code: 'MEX', score: '2' },
            { code: 'ECU', score: '0' },
          ],
          winnerCode: 'MEX',
        },
        {
          id: 'M80',
          date: 'Jul 1',
          status: 'Final',
          teams: [
            { code: 'ENG', score: '2' },
            { code: 'COD', score: '1' },
          ],
          winnerCode: 'ENG',
        },
        {
          id: 'M83',
          date: 'Jul 2',
          status: 'Final',
          teams: [
            { code: 'POR', score: '2' },
            { code: 'CRO', score: '1' },
          ],
          winnerCode: 'POR',
        },
        {
          id: 'M84',
          date: 'Jul 2',
          status: 'Final',
          teams: [
            { code: 'ESP', score: '3' },
            { code: 'AUT', score: '0' },
          ],
          winnerCode: 'ESP',
        },
        {
          id: 'M81',
          date: 'Jul 2',
          status: 'Final',
          teams: [
            { code: 'USA', score: '2' },
            { code: 'BIH', score: '0' },
          ],
          winnerCode: 'USA',
        },
        {
          id: 'M82',
          date: 'Jul 1',
          status: 'AET',
          teams: [
            { code: 'BEL', score: '3' },
            { code: 'SEN', score: '2' },
          ],
          winnerCode: 'BEL',
        },
        {
          id: 'M86',
          date: 'Jul 3',
          status: 'Upcoming',
          teams: [{ code: 'ARG' }, { code: 'CPV' }],
        },
        {
          id: 'M85',
          date: 'Jul 3',
          status: 'Upcoming',
          teams: [{ code: 'AUS' }, { code: 'EGY' }],
        },
        {
          id: 'M88',
          date: 'Jul 2',
          status: 'Upcoming',
          teams: [{ code: 'SUI' }, { code: 'ALG' }],
        },
        {
          id: 'M87',
          date: 'Jul 3',
          status: 'Upcoming',
          teams: [{ code: 'COL' }, { code: 'GHA' }],
        },
      ],
    },
    {
      id: 'round-of-16',
      label: 'Round of 16',
      matches: [
        { id: 'M89', date: 'Jul 4', status: 'Upcoming', teams: [{ code: 'CAN' }, { code: 'MAR' }] },
        { id: 'M90', date: 'Jul 4', status: 'Upcoming', teams: [{ code: 'PAR' }, { code: 'FRA' }] },
        { id: 'M91', date: 'Jul 5', status: 'Upcoming', teams: [{ code: 'BRA' }, { code: 'NOR' }] },
        { id: 'M92', date: 'Jul 5', status: 'Upcoming', teams: [{ code: 'MEX' }, { code: 'ENG' }] },
        {
          id: 'M93',
          date: 'Jul 6',
          status: 'Upcoming',
          teams: [{ code: 'POR' }, { code: 'ESP' }],
        },
        { id: 'M94', date: 'Jul 6', status: 'Upcoming', teams: [{ code: 'USA' }, { code: 'BEL' }] },
        {
          id: 'M95',
          date: 'Jul 7',
          status: 'Awaiting',
          teams: [{ label: 'Argentina/Cape Verde' }, { label: 'Australia/Egypt' }],
        },
        {
          id: 'M96',
          date: 'Jul 7',
          status: 'Awaiting',
          teams: [{ label: 'Switzerland/Algeria' }, { label: 'Colombia/Ghana' }],
        },
      ],
    },
    {
      id: 'quarterfinals',
      label: 'Quarterfinals',
      matches: [
        { id: 'M97', date: 'Jul 9', status: 'Awaiting', teams: [{ label: 'W89' }, { label: 'W90' }] },
        { id: 'M98', date: 'Jul 10', status: 'Awaiting', teams: [{ label: 'W93' }, { label: 'W94' }] },
        { id: 'M99', date: 'Jul 11', status: 'Awaiting', teams: [{ label: 'W91' }, { label: 'W92' }] },
        { id: 'M100', date: 'Jul 11', status: 'Awaiting', teams: [{ label: 'W95' }, { label: 'W96' }] },
      ],
    },
    {
      id: 'semifinals',
      label: 'Semifinals',
      matches: [
        { id: 'M101', date: 'Jul 14', status: 'Awaiting', teams: [{ label: 'W97' }, { label: 'W98' }] },
        { id: 'M102', date: 'Jul 15', status: 'Awaiting', teams: [{ label: 'W99' }, { label: 'W100' }] },
      ],
    },
    {
      id: 'finals',
      label: 'Final',
      matches: [
        { id: 'M104', date: 'Jul 19', status: 'Awaiting', teams: [{ label: 'W101' }, { label: 'W102' }] },
        {
          id: 'M103',
          date: 'Jul 18',
          status: 'Third place',
          teams: [{ label: 'L101' }, { label: 'L102' }],
        },
      ],
    },
  ],
};
