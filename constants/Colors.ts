const primaryColor = '#4F6D7A';
const accentColor = '#D57A66';

const defaultText = '#333333';
const defaultBackground = '#FFFFFF';

const lightTheme = {
  text: defaultText,
  background: defaultBackground,
  tint: primaryColor,
  tabIconDefault: '#A0A0A0',
  primary: primaryColor,
  accent: accentColor,
};

const darkTheme = {
  text: '#EAEAEA',
  background: '#121212',
  tint: accentColor,
  tabIconDefault: '#707070',
  primary: primaryColor, // You might want to adjust these for dark theme too
  accent: accentColor,
};

export const Colors = {
  light: lightTheme,
  dark: darkTheme,

  // Ensure these top-level colors are available for direct use
  primary: primaryColor,
  accent: accentColor,
  text: defaultText,         // ✅ Now explicitly available at top level
  background: defaultBackground, // ✅ Now explicitly available at top level
};