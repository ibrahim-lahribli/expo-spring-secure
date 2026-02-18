import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ZakatCalculationResult } from '../../lib/zakat-engine/src/core/types';
import { mapQuickToEngineInput } from '../../lib/zakat-mappers/quick-mapping';
import { runZakatCalculation } from '../../lib/zakat-mappers/run';
import { ZakatResultCard } from './ZakatResultCard';

export function QuickCalculatorForm() {
    const [cash, setCash] = useState('');
    const [goldValue, setGoldValue] = useState('');
    const [debt, setDebt] = useState('');
    const [result, setResult] = useState<ZakatCalculationResult | null>(null);

    const handleCalculate = () => {
        const input = {
            cash: parseFloat(cash) || 0,
            goldValue: parseFloat(goldValue) || 0,
            debt: parseFloat(debt) || 0,
        };

        // Ensure non-negative values
        if (input.cash < 0) input.cash = 0;
        if (input.goldValue < 0) input.goldValue = 0;
        if (input.debt < 0) input.debt = 0;

        const engineInput = mapQuickToEngineInput(input);
        const calculationResult = runZakatCalculation(engineInput);

        setResult(calculationResult);
    };

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

            <ZakatResultCard result={result} />
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
});
