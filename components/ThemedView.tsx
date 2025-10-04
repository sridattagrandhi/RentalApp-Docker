import { View, ViewProps } from 'react-native';
import { Colors } from '../constants/Colors';

export default function ThemedView(props: ViewProps) {
  return <View {...props} style={[{ backgroundColor: Colors.background }, props.style]} />;
}