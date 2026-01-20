import { useUsers } from "@/services/api";
import { User } from "@/types";
import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, Button, Card, FAB } from "react-native-paper";

const userListScreen = () => {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) {
    return <ActivityIndicator animating={true} size="large" />;
  }

  if (error) {
    return <Text style={styles.center}>{error.message}</Text>;
  }

  const renderItem = ({ item }: { item: User }) => (
    <Card style={styles.card}>
      <Card.Title title={item.name} subtitle={item.email} />
      <Card.Actions>
        <Button
          icon="pencil"
          mode="text"
          onPress={() =>
            router.push({
              pathname: "./form",
              params: { user: JSON.stringify(item) },
            })
          }
        >
          Edit
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push("./form")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 8 },
  fab: { position: "absolute", margin: 16, right: 0, bottom: 0 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default userListScreen;
