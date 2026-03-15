import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  I18nManager,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { AppCard, AppScreen, PrimaryButton, SectionTitle } from "../../../../components/ui";
import {
  formatDateAsIso,
  resolveCalculationDate,
} from "../../../../lib/zakat-calculation/detailedCalculationContext";
import {
  useDetailedHawlSetupDraftStore,
  type DetailedHawlSetupDraft,
  type HawlTrackingMode,
} from "../../../../store/detailedHawlSetupDraftStore";
import { appColors, appRadius, appSpacing } from "../../../../theme/designSystem";

type IntroCardId = "detailed" | "debt" | "hawl";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateFromIso(value?: string): Date | null {
  if (!value || !DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map((item) => Number(item));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function isValidIsoDate(value?: string): boolean {
  return parseDateFromIso(value) !== null;
}

function toSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return toSingleParam(value[0]);
  return typeof value === "string" ? value : undefined;
}

function DateField({
  label,
  placeholder,
  value,
  onChange,
  isArabic,
  testID,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange: (next: string) => void;
  isArabic: boolean;
  testID: string;
}) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const resolvedDate = useMemo(() => parseDateFromIso(value) ?? new Date(), [value]);

  const onNativeDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowAndroidPicker(false);
    }
    if (event.type === "dismissed" || !selectedDate) {
      return;
    }
    onChange(formatDateAsIso(selectedDate));
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, isArabic && styles.rtlText]}>{label}</Text>
        <TextInput
          testID={testID}
          value={value ?? ""}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={appColors.textSecondary}
          style={[styles.input, isArabic && styles.rtlText]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, isArabic && styles.rtlText]}>{label}</Text>
        <View style={styles.datePreviewRow}>
          <Text style={[styles.datePreviewValue, isArabic && styles.rtlText]}>
            {value ?? placeholder}
          </Text>
        </View>
        <DateTimePicker
          testID={testID}
          value={resolvedDate}
          mode="date"
          display="inline"
          onChange={onNativeDateChange}
        />
      </View>
    );
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, isArabic && styles.rtlText]}>{label}</Text>
      <Pressable
        style={[styles.dateTrigger, isArabic && styles.rowReverse]}
        onPress={() => setShowAndroidPicker(true)}
        testID={testID}
      >
        <Text style={[styles.datePreviewValue, isArabic && styles.rtlText]}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={appColors.primary} />
      </Pressable>
      {showAndroidPicker ? (
        <DateTimePicker
          testID={`${testID}-android`}
          value={resolvedDate}
          mode="date"
          display="default"
          onChange={onNativeDateChange}
        />
      ) : null}
    </View>
  );
}

function RadioOption({
  label,
  selected,
  onPress,
  isArabic,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isArabic: boolean;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[styles.radioOption, isArabic && styles.rowReverse, selected && styles.radioOptionActive]}
    >
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={[styles.radioLabel, isArabic && styles.rtlText]}>{label}</Text>
    </Pressable>
  );
}

export default function DetailedSetupScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const setDraft = useDetailedHawlSetupDraftStore((state) => state.setDraft);
  const draft = useDetailedHawlSetupDraftStore((state) => state.draft);
  const isArabic = (i18n.resolvedLanguage ?? "en").startsWith("ar");

  const isRTL = I18nManager.isRTL;
  const [openCard, setOpenCard] = useState<IntroCardId | null>(null);
  const [trackingMode, setTrackingMode] = useState<HawlTrackingMode | null>(null);
  const [referenceDate, setReferenceDate] = useState<string>("");
  const [useToday, setUseToday] = useState<boolean | undefined>(undefined);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [validationErrorKey, setValidationErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!draft) return;
    setTrackingMode(draft.trackingMode);
    setReferenceDate(draft.referenceDate ?? "");
    setUseToday(draft.useToday);
    setSaveAsDefault(Boolean(draft.saveAsDefault));
  }, [draft]);

  const cards: {
    id: IntroCardId;
    title: string;
    paragraphs: string[];
    bullets?: string[];
    noteTitle?: string;
    noteBody?: string;
  }[] = [
    {
      id: "detailed",
      title: t("detailedSetup.cards.detailed.title"),
      paragraphs: [
        t("detailedSetup.cards.detailed.body1"),
        t("detailedSetup.cards.detailed.body2"),
      ],
      noteTitle: t("detailedSetup.cards.detailed.noteTitle"),
      noteBody: t("detailedSetup.cards.detailed.noteBody"),
    },
    {
      id: "debt",
      title: t("detailedSetup.cards.debt.title"),
      paragraphs: [
        t("detailedSetup.cards.debt.body1"),
        t("detailedSetup.cards.debt.body2"),
      ],
      bullets: [
        t("detailedSetup.cards.debt.bullet1"),
        t("detailedSetup.cards.debt.bullet2"),
      ],
      noteTitle: t("detailedSetup.cards.debt.noteTitle"),
      noteBody: t("detailedSetup.cards.debt.noteBody"),
    },
    {
      id: "hawl",
      title: t("detailedSetup.cards.hawl.title"),
      paragraphs: [
        t("detailedSetup.cards.hawl.body1"),
        t("detailedSetup.cards.hawl.body2"),
      ],
      bullets: [
        t("detailedSetup.cards.hawl.bullet1"),
        t("detailedSetup.cards.hawl.bullet2"),
      ],
      noteTitle: t("detailedSetup.cards.hawl.noteTitle"),
      noteBody: t("detailedSetup.cards.hawl.noteBody"),
    },
  ];

  const toggleCard = (card: IntroCardId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenCard((prev) => (prev === card ? null : card));
  };

  const onSelectTrackingMode = (mode: HawlTrackingMode) => {
    setTrackingMode(mode);
    setValidationErrorKey(null);
    if (mode !== "estimated") {
      setUseToday(undefined);
    }
    if (mode !== "yearly_zakat_date") {
      setSaveAsDefault(false);
    }
  };

  const validateDraft = (): string | null => {
    if (!trackingMode) {
      return "detailedSetup.validation.trackingModeRequired";
    }

    if (trackingMode === "estimated") {
      if (useToday === undefined) {
        return "detailedSetup.validation.estimatedChoiceRequired";
      }
      if (!useToday && !referenceDate.trim()) {
        return "detailedSetup.validation.referenceDateRequired";
      }
      if (!useToday && !isValidIsoDate(referenceDate.trim())) {
        return "detailedSetup.validation.invalidDate";
      }
      return null;
    }

    if (!referenceDate.trim()) {
      return "detailedSetup.validation.referenceDateRequired";
    }
    if (!isValidIsoDate(referenceDate.trim())) {
      return "detailedSetup.validation.invalidDate";
    }

    return null;
  };

  const handleNext = () => {
    const error = validateDraft();
    if (error) {
      setValidationErrorKey(error);
      return;
    }

    const normalizedReferenceDate = referenceDate.trim();
    const resolvedReferenceDate =
      trackingMode === "estimated"
        ? useToday
          ? undefined
          : normalizedReferenceDate
        : normalizedReferenceDate;
    const calculationDate = resolveCalculationDate({
      routeCalculationDate: undefined,
      draftCalculationDate: undefined,
      draftReferenceDate: resolvedReferenceDate,
    });
    const nextDraft: DetailedHawlSetupDraft = {
      trackingMode,
      referenceDate: resolvedReferenceDate,
      calculationDate,
      useToday: trackingMode === "estimated" ? useToday : undefined,
      saveAsDefault:
        trackingMode === "yearly_zakat_date" ? Boolean(saveAsDefault) : undefined,
    };

    setDraft(nextDraft);

    router.push(
      {
        pathname: "/(public)/calculate/detailed",
        params: {
          hawlTrackingMode: nextDraft.trackingMode ?? undefined,
          hawlReferenceDate: toSingleParam(nextDraft.referenceDate),
          calculationDate: nextDraft.calculationDate,
          hawlUseToday:
            nextDraft.useToday === undefined
              ? undefined
              : nextDraft.useToday
                ? "1"
                : "0",
          hawlSaveAsDefault:
            nextDraft.saveAsDefault === undefined
              ? undefined
              : nextDraft.saveAsDefault
                ? "1"
                : "0",
        },
      } as never,
    );
  };

  return (
    <AppScreen>
      <SectionTitle
        title={t("detailedSetup.title")}
        subtitle={t("detailedSetup.subtitle")}
      />

      <View style={styles.cardList}>
        {cards.map((card) => {
          const expanded = openCard === card.id;
          return (
            <AppCard key={card.id} style={styles.introCard}>
              <Pressable
                onPress={() => toggleCard(card.id)}
                style={[styles.introCardHeader, isRTL && styles.rowReverse]}
                testID={`intro-card-${card.id}-header`}
              >
                <Text style={[styles.introCardTitle, isArabic && styles.rtlText]}>
                  {card.title}
                </Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={appColors.primary}
                />
              </Pressable>
              {expanded ? (
                <View style={styles.introCardBody} testID={`intro-card-${card.id}-body`}>
                  {card.paragraphs.map((line) => (
                    <Text key={`${card.id}-${line}`} style={[styles.bodyText, isArabic && styles.rtlText]}>
                      {line}
                    </Text>
                  ))}
                  {card.bullets?.map((line) => (
                    <View
                      key={`${card.id}-bullet-${line}`}
                      style={[styles.bulletRow, isRTL && styles.bulletRowRtl]}
                    >
                      <Text style={[styles.bulletMark, isArabic && styles.rtlText]}>-</Text>
                      <Text style={[styles.bodyText, styles.bulletText, isArabic && styles.rtlText]}>
                        {line}
                      </Text>
                    </View>
                  ))}
                  {card.noteTitle ? (
                    <Text style={[styles.noteTitle, isArabic && styles.rtlText]}>
                      {card.noteTitle}
                    </Text>
                  ) : null}
                  {card.noteBody ? (
                    <Text style={[styles.bodyText, isArabic && styles.rtlText]}>
                      {card.noteBody}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </AppCard>
          );
        })}
      </View>

      <AppCard style={styles.formCard}>
        <Text style={[styles.formQuestion, isArabic && styles.rtlText]}>
          {t("detailedSetup.form.question")}
        </Text>

        <RadioOption
          testID="tracking-mode-yearly"
          label={t("detailedSetup.form.options.yearly")}
          selected={trackingMode === "yearly_zakat_date"}
          onPress={() => onSelectTrackingMode("yearly_zakat_date")}
          isArabic={isArabic}
        />
        {trackingMode === "yearly_zakat_date" ? (
          <View style={styles.followupBlock}>
            <DateField
              testID="reference-date-input"
              label={t("detailedSetup.form.referenceDateLabel")}
              placeholder={t("detailedSetup.form.referenceDatePlaceholder")}
              value={referenceDate}
              onChange={(next) => {
                setReferenceDate(next);
                setValidationErrorKey(null);
              }}
              isArabic={isArabic}
            />
            <Pressable
              onPress={() => setSaveAsDefault((prev) => !prev)}
              style={[styles.checkboxRow, isRTL && styles.rowReverse]}
              testID="save-as-default-toggle"
            >
              <View style={[styles.checkbox, saveAsDefault && styles.checkboxActive]}>
                {saveAsDefault ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <Text style={[styles.checkboxLabel, isArabic && styles.rtlText]}>
                {t("detailedSetup.form.yearly.saveAsDefault")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <RadioOption
          testID="tracking-mode-nisab"
          label={t("detailedSetup.form.options.nisab")}
          selected={trackingMode === "nisab_reached_date"}
          onPress={() => onSelectTrackingMode("nisab_reached_date")}
          isArabic={isArabic}
        />
        {trackingMode === "nisab_reached_date" ? (
          <View style={styles.followupBlock}>
            <DateField
              testID="reference-date-input"
              label={t("detailedSetup.form.referenceDateLabel")}
              placeholder={t("detailedSetup.form.referenceDatePlaceholder")}
              value={referenceDate}
              onChange={(next) => {
                setReferenceDate(next);
                setValidationErrorKey(null);
              }}
              isArabic={isArabic}
            />
          </View>
        ) : null}

        <RadioOption
          testID="tracking-mode-estimated"
          label={t("detailedSetup.form.options.estimated")}
          selected={trackingMode === "estimated"}
          onPress={() => onSelectTrackingMode("estimated")}
          isArabic={isArabic}
        />
        {trackingMode === "estimated" ? (
          <View style={styles.followupBlock}>
            <Text style={[styles.subQuestion, isArabic && styles.rtlText]}>
              {t("detailedSetup.form.estimated.question")}
            </Text>
            <RadioOption
              testID="estimated-option-today"
              label={t("detailedSetup.form.estimated.startToday")}
              selected={useToday === true}
              onPress={() => {
                setUseToday(true);
                setReferenceDate("");
                setValidationErrorKey(null);
              }}
              isArabic={isArabic}
            />
            <RadioOption
              testID="estimated-option-approximate"
              label={t("detailedSetup.form.estimated.approximateDate")}
              selected={useToday === false}
              onPress={() => {
                setUseToday(false);
                setValidationErrorKey(null);
              }}
              isArabic={isArabic}
            />
            {useToday === false ? (
              <DateField
                testID="reference-date-input"
                label={t("detailedSetup.form.referenceDateLabel")}
                placeholder={t("detailedSetup.form.referenceDatePlaceholder")}
                value={referenceDate}
                onChange={(next) => {
                  setReferenceDate(next);
                  setValidationErrorKey(null);
                }}
                isArabic={isArabic}
              />
            ) : null}
          </View>
        ) : null}
      </AppCard>

      {validationErrorKey ? (
        <Text style={[styles.errorText, isArabic && styles.rtlText]}>
          {t(validationErrorKey as never)}
        </Text>
      ) : null}

      <PrimaryButton
        testID="detailed-setup-next"
        label={t("next")}
        onPress={handleNext}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardList: {
    gap: appSpacing.sm,
  },
  introCard: {
    padding: appSpacing.sm,
  },
  introCardHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: appSpacing.sm,
  },
  introCardTitle: {
    flex: 1,
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  introCardBody: {
    marginTop: appSpacing.xs,
    gap: appSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
    paddingTop: appSpacing.sm,
  },
  bodyText: {
    color: appColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: appSpacing.xs,
  },
  bulletRowRtl: {
    flexDirection: "row-reverse",
  },
  bulletMark: {
    color: appColors.textSecondary,
    lineHeight: 20,
    fontSize: 14,
  },
  bulletText: {
    flex: 1,
  },
  noteTitle: {
    color: appColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  formCard: {
    gap: appSpacing.sm,
  },
  formQuestion: {
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  radioOption: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.md,
    paddingHorizontal: appSpacing.sm,
    paddingVertical: appSpacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.sm,
    backgroundColor: appColors.surface,
  },
  radioOptionActive: {
    borderColor: appColors.primary,
    backgroundColor: "#ECF5F2",
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: appColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: appColors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appColors.primary,
  },
  radioLabel: {
    flex: 1,
    color: appColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  followupBlock: {
    gap: appSpacing.sm,
    marginTop: -appSpacing.xs,
    marginBottom: appSpacing.xs,
  },
  fieldBlock: {
    gap: appSpacing.xs,
  },
  fieldLabel: {
    color: appColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  datePreviewRow: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.md,
    backgroundColor: appColors.surface,
    justifyContent: "center",
    paddingHorizontal: appSpacing.sm,
  },
  datePreviewValue: {
    color: appColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  dateTrigger: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.md,
    backgroundColor: appColors.surface,
    paddingHorizontal: appSpacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: appSpacing.sm,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.md,
    backgroundColor: appColors.surface,
    color: appColors.textPrimary,
    paddingHorizontal: appSpacing.sm,
    paddingVertical: appSpacing.sm,
    fontSize: 16,
  },
  subQuestion: {
    color: appColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  checkboxRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: appColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.surface,
  },
  checkboxActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  checkboxLabel: {
    flex: 1,
    color: appColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  errorText: {
    color: appColors.error,
    fontSize: 13,
    fontWeight: "600",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
});
