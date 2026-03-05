import React from 'react';
import { useTranslation } from "react-i18next";
import { Text } from 'react-native';
import { AppCard, AppScreen, PrimaryButton, SectionTitle } from '../../../components/ui';
import { useAuthStore } from '../../../store/authStore';

export default function AccountScreen() {
    const { t } = useTranslation("common");
    const { user, signOut } = useAuthStore();

    return (
        <AppScreen>
            <SectionTitle title={t("account.title")} subtitle={t("account.subtitle")} />
            <AppCard>
                <Text>{t("account.welcome", { email: user?.email ?? "" })}</Text>
                <PrimaryButton label={t("logout")} onPress={signOut} />
            </AppCard>
        </AppScreen>
    );
}
