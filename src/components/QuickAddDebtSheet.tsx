import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
import Toast from "react-native-toast-message";
import {
  isValidAmount,
  parseCurrencyInput,
  sanitizeCurrencyInput,
} from "../utils/currency";

interface QuickAddDebtSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (amount: number, note?: string) => void;
  currencyCode?: string;
}

const MAX_NOTE_LENGTH = 60;

export function QuickAddDebtSheet({
  visible,
  onDismiss,
  onSave,
  currencyCode = "USD",
}: QuickAddDebtSheetProps) {
  const { t, i18n } = useTranslation(["calculate"]);
  const [amountInput, setAmountInput] = useState("");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  // Memoize parsed amount to avoid repeated parsing
  const parsedAmount = useMemo(
    () => parseCurrencyInput(amountInput),
    [amountInput],
  );

  // Check if there's a draft (unsaved input)
  const hasDraft = amountInput.length > 0 || note.length > 0;

  // Reset form when sheet opens
  useEffect(() => {
    if (visible) {
      setAmountInput("");
      setNote("");
      setAmountError(null);
      setHasSaved(false);
    }
  }, [visible]);

  const handleAmountChange = useCallback((text: string) => {
    const sanitized = sanitizeCurrencyInput(text);
    setAmountInput(sanitized);
    setAmountError(null);
  }, []);

  const handleNoteChange = useCallback((text: string) => {
    if (text.length <= MAX_NOTE_LENGTH) {
      setNote(text);
    }
  }, []);

  const validateAndSave = useCallback(() => {
    if (!isValidAmount(parsedAmount)) {
      setAmountError(
        t("liabilities.validation.invalidAmount", {
          defaultValue: "Enter a valid amount greater than 0",
        }),
      );
      return;
    }

    onSave(parsedAmount, note.trim() || undefined);

    // Show toast
    Toast.show({
      type: "success",
      text1: t("liabilities.toast.added", { defaultValue: "Debt added" }),
      position: "bottom",
      visibilityTime: 2000,
    });

    // Clear inputs for next entry (sheet stays open)
    setAmountInput("");
    setNote("");
    setAmountError(null);
    setHasSaved(true);

    // Refocus amount input for rapid entry
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 0);
  }, [amountInput, note, onSave, t]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const isSaveDisabled = !amountInput || parsedAmount <= 0;

  const cancelLabel = hasSaved
    ? t("liabilities.sheet.done", { defaultValue: "Done" })
    : t("liabilities.sheet.cancel", { defaultValue: "Cancel" });

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modal}
        dismissable={!hasDraft}
        dismissableBackButton={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("liabilities.sheet.title", {
                defaultValue: "Quick Add Debt",
              })}
            </Text>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Amount Field */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {t("liabilities.sheet.amountLabel", { defaultValue: "Amount" })}
                <Text style={styles.required}> *</Text>
              </Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>{currencyCode}</Text>
                <TextInput
                  ref={amountInputRef}
                  style={[
                    styles.amountInput,
                    amountError ? styles.inputError : null,
                    i18n.dir() === "rtl" ? styles.rtlInput : null,
                  ]}
                  value={amountInput}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  textAlign={i18n.dir() === "rtl" ? "right" : "left"}
                  autoFocus={true}
                  testID="debt-amount-input"
                />
              </View>
              {amountError ? (
                <Text style={styles.errorText}>{amountError}</Text>
              ) : null}
            </View>

            {/* Note Field */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {t("liabilities.sheet.noteLabel", { defaultValue: "Note" })}
                </Text>
                <Text style={styles.charCount}>
                  {note.length}/{MAX_NOTE_LENGTH}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.noteInput,
                  i18n.dir() === "rtl" ? styles.rtlInput : null,
                ]}
                value={note}
                onChangeText={handleNoteChange}
                placeholder={t("liabilities.sheet.notePlaceholder", {
                  defaultValue: "Optional description (e.g., Credit card)",
                })}
                placeholderTextColor="#9CA3AF"
                maxLength={MAX_NOTE_LENGTH}
                textAlign={i18n.dir() === "rtl" ? "right" : "left"}
                testID="debt-note-input"
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleDismiss}
              style={styles.cancelButton}
              textColor="#6B7280"
              testID="debt-cancel-button"
            >
              {cancelLabel}
            </Button>
            <Button
              mode="contained"
              onPress={validateAndSave}
              disabled={isSaveDisabled}
              style={styles.saveButton}
              buttonColor="#1F7A6B"
              testID="debt-save-button"
            >
              {t("liabilities.sheet.save", { defaultValue: "Save" })}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 16,
    marginTop: "auto",
    marginBottom: 24,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 0,
    maxHeight: "80%",
  },
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#6B7280",
    fontWeight: "500",
  },
  form: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  required: {
    color: "#EF4444",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: "#111827",
    backgroundColor: "transparent",
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    minHeight: 48,
  },
  rtlInput: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  cancelButton: {
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  saveButton: {
    borderRadius: 8,
    paddingHorizontal: 8,
  },
});
