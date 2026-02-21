import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ZakatCalculationResult } from '../../lib/zakat-calculation/types';

interface ZakatResultCardProps {
    result: ZakatCalculationResult | null;
    nisabExplanation?: string;
}

export function ZakatResultCard({ result, nisabExplanation }: ZakatResultCardProps) {
    if (!result) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Calculation Result</Text>

            <View style={styles.row}>
                <Text style={styles.label}>Total Wealth:</Text>
                <Text style={styles.value}>{result.totalWealth.toFixed(2)}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Nisab Threshold:</Text>
                <Text style={styles.value}>{result.nisab.toFixed(2)}</Text>
            </View>
            {nisabExplanation ? (
                <View style={styles.breakdownSection}>
                    <Text style={styles.breakdownTitle}>How this was calculated</Text>
                    <Text style={styles.breakdownText}>{nisabExplanation}</Text>
                </View>
            ) : null}

            <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Zakat Due:</Text>
                <Text style={styles.totalValue}>{result.totalZakat.toFixed(2)}</Text>
            </View>

            {!result.hasZakatDue && (
                <Text style={styles.infoText}>
                    Your wealth is below the Nisab threshold, so no Zakat is due at this time.
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginTop: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        color: '#333',
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
    },
    breakdownSection: {
        marginBottom: 8,
    },
    breakdownTitle: {
        fontSize: 13,
        color: '#555',
        marginBottom: 2,
        fontWeight: '600',
    },
    breakdownText: {
        fontSize: 13,
        color: '#666',
    },
    totalRow: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    infoText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
});
