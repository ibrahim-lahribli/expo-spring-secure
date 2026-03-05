import React from 'react';
import { useTranslation } from "react-i18next";
import { formatMoney } from '../../lib/currency';
import { ZakatCalculationResult } from '../../lib/zakat-calculation/types';
import { useAppPreferencesStore } from '../../store/appPreferencesStore';
import { ResultSummaryCard } from '../ui';

interface ZakatResultCardProps {
    result: ZakatCalculationResult | null;
    nisabExplanation?: string;
}

export function ZakatResultCard({ result, nisabExplanation }: ZakatResultCardProps) {
    if (!result) return null;
    const { t } = useTranslation("common");
    const currency = useAppPreferencesStore((state) => state.currency);

    return (
        <ResultSummaryCard
            title={t("quickResult.summaryTitle")}
            rows={[
                { label: t("quickResult.rows.totalWealth"), value: formatMoney(result.totalWealth, currency) },
                { label: t("quickResult.rows.nisabThreshold"), value: formatMoney(result.nisab, currency) },
                { label: t("quickResult.rows.zakatDue"), value: formatMoney(result.totalZakat, currency) },
            ]}
            footerLabel={
                !result.hasZakatDue
                    ? t("quickResult.notDueNotice")
                    : nisabExplanation
                        ? t("quickResult.howCalculated", { explanation: nisabExplanation })
                        : undefined
            }
        />
    );
}
