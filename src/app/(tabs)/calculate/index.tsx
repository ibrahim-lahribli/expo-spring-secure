import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Appbar, Button, Card, Chip } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Reusable Components
function ContinueDraftCard() {
  const { t } = useTranslation(["calculate"]);

  return (
    <Card style={styles.continueDraftCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle}>
            {t("continueDraft", { defaultValue: "Continue Draft" })}
          </Text>
          <Text style={styles.cardSubtitle}>
            {t("quickUpdated", {
              defaultValue: "Demo • Quick • updated 2h ago",
            })}
          </Text>
          <Text style={styles.placeholderText}>
            {t("draftPlaceholder", {
              defaultValue: "Drafts will appear here once available.",
            })}
          </Text>
        </View>
        <Button mode="outlined" disabled={true} style={styles.resumeButton}>
          {t("resume", { defaultValue: "Resume" })}
        </Button>
      </View>
    </Card>
  );
}

function NisabInfoBanner() {
  const { t } = useTranslation(["calculate"]);

  return (
    <Card style={styles.nisabBanner}>
      <View style={styles.bannerContent}>
        <View style={styles.bannerLeft}>
          <View style={styles.bannerHeader}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color="#D97706"
              style={styles.bannerIcon}
            />
            <Text style={styles.bannerTitle}>
              {t("nisabNotSet", { defaultValue: "Nisab not set" })}
            </Text>
          </View>
          <Text style={styles.bannerBody}>
            {t("nisabBody", {
              defaultValue: "Set your nisab method and value in Settings.",
            })}
          </Text>
        </View>
        <Button mode="text" disabled={true} compact={true}>
          {t("goToSettings", { defaultValue: "Go to Settings" })}
        </Button>
      </View>
    </Card>
  );
}

interface MethodCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  showRecommended?: boolean;
}

function MethodCard({
  icon,
  title,
  description,
  showRecommended = false,
}: MethodCardProps) {
  return (
    <Card style={styles.methodCard}>
      <View style={styles.methodCardContent}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={24} color="#1F7A6B" />
        </View>
        <View style={styles.methodCardMiddle}>
          <View style={styles.titleRow}>
            <Text style={styles.methodTitle}>{title}</Text>
            {showRecommended && (
              <Chip compact={true} style={styles.recommendedChip}>
                Recommended
              </Chip>
            )}
          </View>
          <Text style={styles.methodDescription}>{description}</Text>
        </View>
        <View style={styles.methodCardRight}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#9CA3AF"
          />
        </View>
      </View>
    </Card>
  );
}

export default function CalculateScreen() {
  const { t } = useTranslation(["calculate"]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Appbar.Header>
        <Appbar.Content title={t("title", { defaultValue: "Calculate" })} />
        <Appbar.Action icon="account" />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContinueDraftCard />

        <View style={styles.spacer} />

        <NisabInfoBanner />

        <View style={styles.spacer} />

        <Text style={styles.sectionTitle}>
          {t("chooseMethod", { defaultValue: "Choose method" })}
        </Text>

        <View style={styles.spacer} />

        <MethodCard
          icon="lightning-bolt"
          title={t("quickCalculate", {
            defaultValue: "Quick Calculate",
          })}
          description={t("quickCalculateDesc", {
            defaultValue:
              "Simple assets like cash, savings, gold, and personal debts. Best for most individuals.",
          })}
          showRecommended={true}
        />

        <View style={styles.spacer} />

        <MethodCard
          icon="magic-staff"
          title={t("guidedWizard", {
            defaultValue: "Guided Wizard",
          })}
          description={t("guidedWizardDesc", {
            defaultValue:
              "Step-by-step help for complex assets like stocks, crops, livestock, or mixed income sources.",
          })}
        />

        <View style={styles.spacer} />

        <MethodCard
          icon="store"
          title={t("businessMode", {
            defaultValue: "Business Mode",
          })}
          description={t("businessModeDesc", {
            defaultValue:
              "Specialized for traders and companies. Calculate on inventory, receivables, and payables.",
          })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16, // 8px base unit * 2
    paddingBottom: 32, // 8px base unit * 4
  },
  spacer: {
    height: 16, // 8px base unit * 2
  },

  // Continue Draft Card
  continueDraftCard: {
    backgroundColor: "#F0FDF4", // Lighter green tint for placeholder feel
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1FAE5", // Dashed-like border effect
    opacity: 0.8, // Slightly faded to indicate placeholder
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16, // 8px base unit * 2
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
    fontWeight: "500",
  },
  resumeButton: {
    marginLeft: 16,
    opacity: 0.6, // More faded to show disabled state
  },

  // Nisab Banner
  nisabBanner: {
    backgroundColor: "#FEF3C7", // More prominent amber background
    borderRadius: 8, // Less rounded for banner feel
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B", // Accent border for banner effect
    elevation: 2, // Subtle shadow for prominence
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16, // 8px base unit * 2
  },
  bannerLeft: {
    flex: 1,
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bannerIcon: {
    marginEnd: 8,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "700", // Bolder for banner prominence
    color: "#92400E", // Darker amber for better contrast
  },
  bannerBody: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "left", // Will auto-mirror in RTL
    writingDirection: "auto", // Ensure proper RTL handling
  },

  // Method Cards
  methodCard: {
    borderRadius: 12,
    backgroundColor: "white",
  },
  methodCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16, // 8px base unit * 2
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginEnd: 16,
  },
  methodCardMiddle: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  recommendedChip: {
    backgroundColor: "#1F7A6B",
    height: 28, // Consistent with 8px base unit
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  methodDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  methodCardRight: {
    marginStart: 16,
  },
});
