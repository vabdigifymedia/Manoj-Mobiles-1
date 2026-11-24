export const BANNER_DIMENSIONS = {
  desktop: {
    width: 1280,
    height: 420,
    label: '1280 × 420 px',
    helperText: 'Use this size for the best fit. Larger images will be cropped to fit.',
  },
  mobile: {
    width: 720,
    height: 480,
    label: '720 × 480 px',
    helperText: 'Optimized for mobile viewports and smartphones.',
  },
  hero: {
    desktop: {
      width: 1280,
      height: 420,
      label: '1280 × 420 px',
      helperText: 'Recommended for desktop hero auto-dissolving banner slider.',
    },
    mobile: {
      width: 720,
      height: 480,
      label: '720 × 480 px',
      helperText: 'Optimized for mobile hero viewports.',
    },
  },
  single: {
    desktop: {
      width: 1280,
      height: 350,
      label: '1280 × 350 px',
      helperText: 'Wide full-width promotional banner shown below hero slider.',
    },
    mobile: {
      width: 720,
      height: 400,
      label: '720 × 400 px',
      helperText: 'Optimized mobile display for single promotional banner.',
    },
  },
  grid: {
    pos1: {
      position: 1,
      title: 'Banner 1 – Left Large',
      label: '400 × 800 px',
      aspect: 'Vertical (1:2)',
      helperText: 'Left large vertical promotional banner.',
    },
    pos2: {
      position: 2,
      title: 'Banner 2 – Middle Top',
      label: '800 × 380 px',
      aspect: 'Horizontal (2:1)',
      helperText: 'Middle top horizontal landscape promotional banner.',
    },
    pos3: {
      position: 3,
      title: 'Banner 3 – Middle Bottom Left',
      label: '400 × 380 px',
      aspect: 'Compact (~1:1)',
      helperText: 'Middle bottom left promotional banner.',
    },
    pos4: {
      position: 4,
      title: 'Banner 4 – Middle Bottom Right',
      label: '400 × 380 px',
      aspect: 'Compact (~1:1)',
      helperText: 'Middle bottom right promotional banner.',
    },
    pos5: {
      position: 5,
      title: 'Banner 5 – Right Large',
      label: '400 × 800 px',
      aspect: 'Vertical (1:2)',
      helperText: 'Right large vertical promotional banner.',
    },
  },
} as const
