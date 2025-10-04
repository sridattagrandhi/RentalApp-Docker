import { Text, TextProps } from 'react-native';
import { Colors } from '../constants/Colors';

export default function ThemedText(props: TextProps) {
  return <Text {...props} style={[{ color: Colors.text }, props.style]} />;
}