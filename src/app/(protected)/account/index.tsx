import React from 'react';
import { Button, Text, View } from 'react-native';
import { useAuthStore } from '../../../store/authStore';

export default function AccountScreen() {
    const { user, signOut } = useAuthStore();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Account</Text>
            <Text style={{ marginBottom: 20 }}>Welcome, {user?.email}</Text>
            <Button title="Sign Out" onPress={signOut} />
        </View>
    );
}
