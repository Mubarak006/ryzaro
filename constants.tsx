
export const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const TASK_INFO = {
  Math: {
    icon: 'calculate',
    color: 'orange',
    label: 'Math Challenge',
    brief: 'Solve addition problems using the keypad.',
    description: (diff: string) => `Solve ${diff === 'Hard' ? '5' : diff === 'Medium' ? '3' : '1'} equation(s)`,
    guide: "Solve mathematical addition problems using the on-screen keypad to prove your brain is fully awake."
  },
  Shake: {
    icon: 'vibration',
    color: 'purple',
    label: 'Shake Phone',
    brief: 'Vigorously shake your device until the meter is full.',
    description: (diff: string) => `Shake for ${diff === 'Hard' ? '30' : diff === 'Medium' ? '15' : '5'} seconds`,
    guide: "Hold your device firmly and shake it vigorously until the progress bar reaches 100% to silence the alarm."
  },
  Memory: {
    icon: 'grid_view',
    color: 'blue',
    label: 'Memory Match',
    brief: 'Find and match pairs of hidden icons.',
    description: (diff: string) => `Find ${diff === 'Hard' ? '6' : diff === 'Medium' ? '4' : '2'} pairs`,
    guide: "Find all matching pairs of icons hidden behind the tiles. This requires focus and short-term recall."
  },
  Sequence: {
    icon: 'format_list_numbered',
    color: 'pink',
    label: 'Number Sequence',
    brief: 'Tap numbers in ascending order starting from 1.',
    description: (diff: string) => `Tap ${diff === 'Hard' ? '12' : diff === 'Medium' ? '8' : '5'} numbers in order`,
    guide: "Numbers will appear in random positions. Tap each number in ascending order, starting from 1, to complete the sequence."
  },
  QR: {
    icon: 'qr_code_scanner',
    color: 'emerald',
    label: 'QR Code Scan',
    brief: 'Scan a specific QR code to verify you are out of bed.',
    description: () => 'Scan a registered code',
    guide: "The ultimate deterrent: scan a pre-selected QR code located in another room to force yourself out of bed."
  }
};
