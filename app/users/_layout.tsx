import { Stack } from "expo-router";

export default function UsersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Users" }} />
      <Stack.Screen
        name="form"
        options={({ route }) => ({
          title: (route.params as any)?.user ? "Edit User" : "New User",
        })}
      />
    </Stack>
  );
}
