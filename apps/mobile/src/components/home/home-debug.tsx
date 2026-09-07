import { View, Text } from 'react-native';

export function HomeDebug({
  name,
}: {
  name: string;
}) {
  return (
    <View
      style={{
        padding: 20,
        backgroundColor: '#eee',
        margin: 10,
        borderRadius: 20,
      }}
    >
      <Text>{name} OK</Text>
    </View>
  );
}
