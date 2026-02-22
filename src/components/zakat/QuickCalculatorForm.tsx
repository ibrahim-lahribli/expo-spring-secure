import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { upsertGuestHistoryEntry } from '../../features/history/storage';
import type { HistoryEntry } from '../../features/history/types';
import { calculateNisab, getNisabBreakdown } from '../../lib/zakat-calculation/nisab';
import { ZakatCalculationResult } from '../../lib/zakat-calculation/types';
import { useNisabSettingsStore } from '../../store/nisabSettingsStore';
import { ZakatResultCard } from './ZakatResultCard';

function calculateQuickResult(cash: number, goldValue: number, debt: number, nisab: number): ZakatCalculationResult {
    const safeCash = Math.max(0, cash);
    const safeGoldValue = Math.max(0, goldValue);
    const safeDebt = Math.max(0, debt);
    const totalWealth = Math.max(0, safeCash + safeGoldValue - safeDebt);
    const totalZakat = totalWealth >= nisab ? totalWealth * 0.025 : 0;

    return {
        nisab,
        totalWealth,
        totalZakat,
        hasZakatDue: totalZakat > 0,
        breakdown: {},
    };
}

export function QuickCalculatorForm() {
    const [cash, setCash] = useState('');
    const [goldValue, setGoldValue] = useState('');
    const [debt, setDebt] = useState('');
    const [result, setResult] = useState<ZakatCalculationResult | null>(null);
    const [historySavedMessage, setHistorySavedMessage] = useState<string | null>(null);
    const nisabMethod = useNisabSettingsStore((state) => state.nisabMethod);
    const silverPricePerGram = useNisabSettingsStore((state) => state.silverPricePerGram);
    const goldPricePerGram = useNisabSettingsStore((state) => state.goldPricePerGram);
    const nisabOverride = useNisabSettingsStore((state) => state.nisabOverride);

    const calculateResult = () => {
        const parsedCash = parseFloat(cash) || 0;
        const parsedGoldValue = parseFloat(goldValue) || 0;
        const parsedDebt = parseFloat(debt) || 0;
        const nisab = calculateNisab({
            nisabMethod,
            silverPricePerGram,
            goldPricePerGram,
            nisabOverride,
        });
        return calculateQuickResult(parsedCash, parsedGoldValue, parsedDebt, nisab);
    };

    const handleCalculate = () => {
        setHistorySavedMessage(null);
        setResult(calculateResult());
    };

    const handleSaveToHistory = async () => {
        if (!result) {
            return;
        }

        const now = new Date().toISOString();
        const entry: HistoryEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            flowType: "quick",
            createdAt: now,
            updatedAt: now,
            totalZakat: result.totalZakat,
            currency: "USD",
            nisabSnapshot: {
                method: nisabMethod,
                silverPricePerGram,
                goldPricePerGram,
                override: nisabOverride > 0 ? nisabOverride : null,
            },
            summary: {
                categoriesUsed: ["Cash", "Gold/Silver", "Debt"],
                itemCount: 3,
            },
            payload: {
                kind: "quick",
                inputs: {
                    cash: parseFloat(cash) || 0,
                    goldValue: parseFloat(goldValue) || 0,
                    debt: parseFloat(debt) || 0,
                },
                result: {
                    nisab: result.nisab,
                    totalWealth: result.totalWealth,
                    totalZakat: result.totalZakat,
                    hasZakatDue: result.hasZakatDue,
                },
            },
        };

        await upsertGuestHistoryEntry(entry);
        setHistorySavedMessage("Saved to local history");
    };

    useEffect(() => {
        if (!result) {
            return;
        }
        setResult(calculateResult());
    }, [nisabMethod, silverPricePerGram, goldPricePerGram, nisabOverride]);

    const nisabExplanation = getNisabBreakdown({
        nisabMethod,
        silverPricePerGram,
        goldPricePerGram,
        nisabOverride,
    }).detailSummary;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.description}>
                Enter your assets below to quickly estimate your Zakat.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Cash (in hand & bank)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={cash}
                    onChangeText={setCash}
                    placeholder="0.00"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Gold & Silver Value</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={goldValue}
                    onChangeText={setGoldValue}
                    placeholder="0.00"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Short-term Debts (Liabilities)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={debt}
                    onChangeText={setDebt}
                    placeholder="0.00"
                />
            </View>

            <Button title="Calculate Zakat" onPress={handleCalculate} />

            <ZakatResultCard result={result} nisabExplanation={nisabExplanation} />
            {result ? (
                <View style={styles.historyActions}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveToHistory}>
                        <Text style={styles.saveButtonText}>Save to History</Text>
                    </TouchableOpacity>
                    {historySavedMessage ? <Text style={styles.savedText}>{historySavedMessage}</Text> : null}
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
        color: '#555',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    historyActions: {
        marginTop: 12,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: '#0a7d32',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    savedText: {
        marginTop: 8,
        color: '#0a7d32',
        fontSize: 12,
    },
});
