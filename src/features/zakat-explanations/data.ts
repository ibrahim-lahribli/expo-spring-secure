import type { LocalizedText, ZakatCategory } from "./types";

const l = (key: string, defaultText: string): LocalizedText => ({ key, defaultText });

export const zakatCategories: ZakatCategory[] = [
  {
    slug: "livestock",
    icon: "cow",
    title: l("zakatExplanations.categories.livestock.title", "Livestock"),
    shortSummary: l(
      "zakatExplanations.categories.livestock.summary",
      "Zakat on camels, cattle, sheep, and goats based on count thresholds.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.livestock.rate.inKind", "In-kind schedule"),
        value: "Tiered",
        condition: l(
          "zakatExplanations.categories.livestock.rate.inKind.condition",
          "Due animals vary by livestock type and total head count.",
        ),
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.livestock.overview.covers",
        "Owned grazing livestock held for growth and breeding value.",
      ),
      whenDue: l(
        "zakatExplanations.categories.livestock.overview.whenDue",
        "After one lunar year for qualifying herds that meet minimum counts.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.livestock.overview.calculation",
        "Use the classical table for each species to determine due animals.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.livestock.conditions.1", "Ownership is complete and established."),
      l("zakatExplanations.categories.livestock.conditions.2", "Minimum threshold is reached for the species."),
      l("zakatExplanations.categories.livestock.conditions.3", "A lunar year passes on qualifying ownership."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.livestock.deductions.1",
        "No direct percentage deduction model; due amount follows count-based schedule.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.livestock.items.1", "Camels"),
      l("zakatExplanations.categories.livestock.items.2", "Cattle and buffalo"),
      l("zakatExplanations.categories.livestock.items.3", "Sheep and goats"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.livestock.steps.1.title", "Confirm eligibility"),
        description: l(
          "zakatExplanations.categories.livestock.steps.1.desc",
          "Check ownership, species, and that the herd reached its threshold.",
        ),
      },
      {
        title: l("zakatExplanations.categories.livestock.steps.2.title", "Find due tier"),
        description: l(
          "zakatExplanations.categories.livestock.steps.2.desc",
          "Use the livestock table to find the due animals by count range.",
        ),
      },
      {
        title: l("zakatExplanations.categories.livestock.steps.3.title", "Discharge zakat"),
        description: l(
          "zakatExplanations.categories.livestock.steps.3.desc",
          "Pay in-kind where possible, or cash equivalent if your policy allows.",
        ),
      },
    ],
    examples: [
      {
        title: l("zakatExplanations.categories.livestock.examples.1.title", "Example: Sheep"),
        inputs: [
          l("zakatExplanations.categories.livestock.examples.1.input1", "Owned sheep: 80"),
          l("zakatExplanations.categories.livestock.examples.1.input2", "Hawl completed: Yes"),
        ],
        result: l(
          "zakatExplanations.categories.livestock.examples.1.result",
          "Result: 1 sheep due according to the common schedule.",
        ),
      },
    ],
    fatwaExcerptArabic: [
      "زكاة الأنعام واجبة في الإبل والبقر والغنم إذا بلغت النصاب وحال عليها الحول.",
      "ويكون الإخراج بحسب الأنصبة المقررة في الجداول الفقهية المعتمدة.",
    ],
    fatwaExplanation: l(
      "zakatExplanations.categories.livestock.fatwaExplanation",
      "This means livestock zakat is count-based, not a flat percentage like trade goods.",
    ),
    notes: [
      l(
        "zakatExplanations.categories.livestock.notes.1",
        "Animals used strictly for personal work may have different rulings based on school and fatwa scope.",
      ),
    ],
    faq: [
      {
        question: l("zakatExplanations.categories.livestock.faq.1.q", "Can I pay cash instead of an animal?"),
        answer: l(
          "zakatExplanations.categories.livestock.faq.1.a",
          "Some authorities allow cash equivalent for welfare and administration needs; follow your fatwa policy.",
        ),
      },
    ],
  },
  {
    slug: "grains-fruits",
    icon: "sprout",
    title: l("zakatExplanations.categories.grainsFruits.title", "Grains & Fruits"),
    shortSummary: l(
      "zakatExplanations.categories.grainsFruits.summary",
      "Harvest zakat on qualifying crops at 10% or 5% depending on irrigation.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.grainsFruits.rate.natural", "Natural watering"),
        value: "10%",
      },
      {
        label: l("zakatExplanations.categories.grainsFruits.rate.paid", "Paid irrigation"),
        value: "5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.grainsFruits.overview.covers",
        "Staple grains and fruits measured at harvest and intended for produce zakat treatment.",
      ),
      whenDue: l(
        "zakatExplanations.categories.grainsFruits.overview.whenDue",
        "At harvest time when crop quantity reaches the crop nisab.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.grainsFruits.overview.calculation",
        "Apply the watering-based rate to the harvested amount.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.grainsFruits.conditions.1", "Harvest reaches crop nisab (commonly 5 awsuq)."),
      l("zakatExplanations.categories.grainsFruits.conditions.2", "Ownership of produce is established at harvest."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.grainsFruits.deductions.1",
        "No standard business-expense deduction in the classic crop-zakat model.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.grainsFruits.items.1", "Wheat, barley, rice, and similar grains"),
      l("zakatExplanations.categories.grainsFruits.items.2", "Dates, raisins, and similar fruits"),
      l("zakatExplanations.categories.grainsFruits.items.3", "Other crops included by your adopted fatwa"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.grainsFruits.steps.1.title", "Measure total harvest"),
        description: l(
          "zakatExplanations.categories.grainsFruits.steps.1.desc",
          "Record net harvested weight for the zakat season.",
        ),
      },
      {
        title: l("zakatExplanations.categories.grainsFruits.steps.2.title", "Choose irrigation rate"),
        description: l(
          "zakatExplanations.categories.grainsFruits.steps.2.desc",
          "Use 10% for natural watering and 5% for paid irrigation.",
        ),
      },
      {
        title: l("zakatExplanations.categories.grainsFruits.steps.3.title", "Compute due amount"),
        description: l(
          "zakatExplanations.categories.grainsFruits.steps.3.desc",
          "Multiply harvest by the applicable rate to get zakat due in produce.",
        ),
      },
    ],
    examples: [
      {
        title: l("zakatExplanations.categories.grainsFruits.examples.1.title", "Example: Naturally watered crop"),
        inputs: [
          l("zakatExplanations.categories.grainsFruits.examples.1.input1", "Harvest: 1,000 kg"),
          l("zakatExplanations.categories.grainsFruits.examples.1.input2", "Rate: 10%"),
        ],
        result: l("zakatExplanations.categories.grainsFruits.examples.1.result", "Result: 100 kg zakat due."),
      },
    ],
    fatwaExcerptArabic: [
      "فيما سقت السماء العشر، وفيما سقي بالنضح نصف العشر.",
      "وتجب زكاة الزروع والثمار عند الحصاد إذا بلغ الخارج النصاب.",
    ],
    fatwaExplanation: l(
      "zakatExplanations.categories.grainsFruits.fatwaExplanation",
      "Harvest zakat is due at collection time, with rate linked to irrigation burden.",
    ),
    notes: [
      l(
        "zakatExplanations.categories.grainsFruits.notes.1",
        "Mixed irrigation methods may require a proportional rate under your scholarly guidance.",
      ),
    ],
  },
  {
    slug: "other-agricultural-products",
    icon: "leaf",
    title: l("zakatExplanations.categories.otherAgricultural.title", "Other Agricultural Products"),
    shortSummary: l(
      "zakatExplanations.categories.otherAgricultural.summary",
      "Agricultural products treated as trade assets are generally calculated at 2.5% on net value.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.otherAgricultural.rate.main", "Trade-assets treatment"),
        value: "2.5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.otherAgricultural.overview.covers",
        "Non-grain/fruit agricultural outputs sold commercially.",
      ),
      whenDue: l(
        "zakatExplanations.categories.otherAgricultural.overview.whenDue",
        "After a lunar year on net commercial value if it reaches nisab.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.otherAgricultural.overview.calculation",
        "Market value minus due operating costs, then 2.5% if above nisab.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.otherAgricultural.conditions.1", "Assets are held for sale and trade value."),
      l("zakatExplanations.categories.otherAgricultural.conditions.2", "Net value reaches nisab at valuation date."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.otherAgricultural.deductions.1",
        "Deduct due costs directly tied to operations before zakat date.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.otherAgricultural.items.1", "Vegetables and greenhouse produce for sale"),
      l("zakatExplanations.categories.otherAgricultural.items.2", "Herbs, flowers, medicinal and aromatic plants"),
      l("zakatExplanations.categories.otherAgricultural.items.3", "Forest and related products traded commercially"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.otherAgricultural.steps.1.title", "Estimate market value"),
        description: l(
          "zakatExplanations.categories.otherAgricultural.steps.1.desc",
          "Assess current sale value of inventory and receivables.",
        ),
      },
      {
        title: l("zakatExplanations.categories.otherAgricultural.steps.2.title", "Subtract due liabilities"),
        description: l(
          "zakatExplanations.categories.otherAgricultural.steps.2.desc",
          "Deduct immediate operating obligations and payable costs.",
        ),
      },
      {
        title: l("zakatExplanations.categories.otherAgricultural.steps.3.title", "Apply zakat rate"),
        description: l(
          "zakatExplanations.categories.otherAgricultural.steps.3.desc",
          "If net amount is at or above nisab, pay 2.5%.",
        ),
      },
    ],
    examples: [
      {
        title: l("zakatExplanations.categories.otherAgricultural.examples.1.title", "Example: Market farm"),
        inputs: [
          l("zakatExplanations.categories.otherAgricultural.examples.1.input1", "Inventory value: 40,000"),
          l("zakatExplanations.categories.otherAgricultural.examples.1.input2", "Due costs: 8,000"),
        ],
        result: l(
          "zakatExplanations.categories.otherAgricultural.examples.1.result",
          "Net 32,000, so zakat due is 800 (2.5%).",
        ),
      },
    ],
    fatwaExcerptArabic: [
      "ما عدا الحبوب والثمار يُعامل معاملة عروض التجارة إذا كان معدًّا للبيع.",
      "فتُقدَّر قيمته ويُخرج ربع العشر من الصافي إذا بلغ النصاب.",
    ],
    fatwaExplanation: l(
      "zakatExplanations.categories.otherAgricultural.fatwaExplanation",
      "These products follow the trade-assets method when they are commercial inventory.",
    ),
    notes: [
      l(
        "zakatExplanations.categories.otherAgricultural.notes.1",
        "Do not mix this rule with crop-harvest rates unless your fatwa explicitly says so.",
      ),
    ],
  },
  {
    slug: "trade-commerce",
    icon: "storefront-outline",
    title: l("zakatExplanations.categories.trade.title", "Trade & Commerce"),
    shortSummary: l(
      "zakatExplanations.categories.trade.summary",
      "Business goods, sale inventory, and trading assets are generally zakatable at 2.5%.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.trade.rate.main", "Net commercial value"),
        value: "2.5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.trade.overview.covers",
        "Goods purchased for resale, liquid trade assets, and related receivables.",
      ),
      whenDue: l(
        "zakatExplanations.categories.trade.overview.whenDue",
        "After a lunar year on net zakatable business position.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.trade.overview.calculation",
        "Current assets minus due liabilities, then 2.5% if at or above nisab.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.trade.conditions.1", "Assets are intended for trade/sale."),
      l("zakatExplanations.categories.trade.conditions.2", "Net amount reaches nisab."),
      l("zakatExplanations.categories.trade.conditions.3", "Hawl has passed for the trade capital cycle."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.trade.deductions.1",
        "Deduct payable wages, rent, taxes due, and immediate debts.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.trade.items.1", "Retail and wholesale inventory"),
      l("zakatExplanations.categories.trade.items.2", "Cash in business accounts"),
      l("zakatExplanations.categories.trade.items.3", "Collectible receivables from customers"),
      l("zakatExplanations.categories.trade.items.4", "Trading positions in compliant instruments"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.trade.steps.1.title", "Value business assets"),
        description: l(
          "zakatExplanations.categories.trade.steps.1.desc",
          "Use current market or realizable value near zakat date.",
        ),
      },
      {
        title: l("zakatExplanations.categories.trade.steps.2.title", "Deduct due obligations"),
        description: l(
          "zakatExplanations.categories.trade.steps.2.desc",
          "Remove short-term liabilities currently payable.",
        ),
      },
      {
        title: l("zakatExplanations.categories.trade.steps.3.title", "Apply 2.5%"),
        description: l(
          "zakatExplanations.categories.trade.steps.3.desc",
          "Pay one quarter of one tenth on the remaining amount.",
        ),
      },
    ],
    examples: [
      {
        title: l("zakatExplanations.categories.trade.examples.1.title", "Example: Small retailer"),
        inputs: [
          l("zakatExplanations.categories.trade.examples.1.input1", "Assets: 120,000"),
          l("zakatExplanations.categories.trade.examples.1.input2", "Due liabilities: 30,000"),
        ],
        result: l("zakatExplanations.categories.trade.examples.1.result", "Net 90,000 -> zakat is 2,250."),
      },
    ],
    fatwaExcerptArabic: [
      "عروض التجارة تُقوَّم عند تمام الحول ويُخرج من صافيها ربع العشر.",
      "ويُخصم ما كان دينًا حالًّا لازم الأداء قبل وقت الزكاة.",
    ],
    fatwaExplanation: l(
      "zakatExplanations.categories.trade.fatwaExplanation",
      "Commercial inventory is valued at zakat date and dues are deducted first.",
    ),
    notes: [
      l(
        "zakatExplanations.categories.trade.notes.1",
        "Long-term fixed assets used by the business are not treated like resale inventory.",
      ),
    ],
  },
  {
    slug: "industry",
    icon: "factory",
    title: l("zakatExplanations.categories.industry.title", "Industry"),
    shortSummary: l(
      "zakatExplanations.categories.industry.summary",
      "Industrial output and trading stock are generally assessed as business assets at 2.5%.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.industry.rate.main", "Net industrial trade value"),
        value: "2.5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.industry.overview.covers",
        "Manufactured inventory, sale-ready goods, and industrial trade receivables.",
      ),
      whenDue: l(
        "zakatExplanations.categories.industry.overview.whenDue",
        "After a lunar year on net zakatable industrial business value.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.industry.overview.calculation",
        "Sale-ready value minus due production-related obligations, then 2.5%.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.industry.conditions.1", "Items are meant for sale, not fixed use."),
      l("zakatExplanations.categories.industry.conditions.2", "Net amount reaches nisab."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.industry.deductions.1",
        "Deduct due wages, supplier payables, and short-term operating costs.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.industry.items.1", "Food manufacturing output"),
      l("zakatExplanations.categories.industry.items.2", "Textile, metal, and electronics products"),
      l("zakatExplanations.categories.industry.items.3", "Furniture and construction-material inventory"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.industry.steps.1.title", "Value current stock"),
        description: l(
          "zakatExplanations.categories.industry.steps.1.desc",
          "Assess market value of finished and sale-ready products.",
        ),
      },
      {
        title: l("zakatExplanations.categories.industry.steps.2.title", "Subtract due costs"),
        description: l(
          "zakatExplanations.categories.industry.steps.2.desc",
          "Remove immediate liabilities and payables due by zakat date.",
        ),
      },
      {
        title: l("zakatExplanations.categories.industry.steps.3.title", "Apply rate"),
        description: l("zakatExplanations.categories.industry.steps.3.desc", "Pay 2.5% on the remaining net value."),
      },
    ],
    examples: [
      {
        title: l("zakatExplanations.categories.industry.examples.1.title", "Example: Factory inventory"),
        inputs: [
          l("zakatExplanations.categories.industry.examples.1.input1", "Sale-ready stock: 500,000"),
          l("zakatExplanations.categories.industry.examples.1.input2", "Due costs: 100,000"),
        ],
        result: l("zakatExplanations.categories.industry.examples.1.result", "Net 400,000 -> zakat is 10,000."),
      },
    ],
    fatwaExcerptArabic: [
      "القطاع الصناعي يُقاس على عروض التجارة فيما يُعد للبيع والاتجار.",
      "وتُخصم التكاليف الواجبة ثم يُخرج ربع العشر من الصافي.",
    ],
    fatwaExplanation: l(
      "zakatExplanations.categories.industry.fatwaExplanation",
      "Industrial inventory for sale follows business-zakat principles in this fatwa framing.",
    ),
    notes: [
      l(
        "zakatExplanations.categories.industry.notes.1",
        "Production machinery used as fixed capital is typically treated differently from sale stock.",
      ),
    ],
  },
  {
    slug: "services",
    icon: "briefcase-outline",
    title: l("zakatExplanations.categories.services.title", "Services"),
    shortSummary: l(
      "zakatExplanations.categories.services.summary",
      "Service income is zakatable when retained savings reach nisab after due needs and debts.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.services.rate.main", "Retained zakatable wealth"),
        value: "2.5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.services.overview.covers",
        "Salaries and service revenues that remain saved and owned.",
      ),
      whenDue: l(
        "zakatExplanations.categories.services.overview.whenDue",
        "After a lunar year on savings that stay at or above nisab.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.services.overview.calculation",
        "Calculate net retained amount after allowable deductions, then apply 2.5%.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.services.conditions.1", "Savings are above nisab at zakat date."),
      l("zakatExplanations.categories.services.conditions.2", "Ownership and access are complete."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.services.deductions.1",
        "Deduct immediate personal debts and due essential obligations.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.services.items.1", "Salary savings"),
      l("zakatExplanations.categories.services.items.2", "Professional fees retained as savings"),
      l("zakatExplanations.categories.services.items.3", "Freelance and consulting balances"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.services.steps.1.title", "Compute retained wealth"),
        description: l(
          "zakatExplanations.categories.services.steps.1.desc",
          "Total cash and near-cash holdings from service income.",
        ),
      },
      {
        title: l("zakatExplanations.categories.services.steps.2.title", "Subtract due obligations"),
        description: l(
          "zakatExplanations.categories.services.steps.2.desc",
          "Deduct debts currently payable and essential liabilities.",
        ),
      },
      {
        title: l("zakatExplanations.categories.services.steps.3.title", "Apply 2.5%"),
        description: l(
          "zakatExplanations.categories.services.steps.3.desc",
          "If net retained amount meets nisab, pay 2.5%.",
        ),
      },
    ],
    examples: [
      {
        title: l("zakatExplanations.categories.services.examples.1.title", "Example: Salary savings"),
        inputs: [
          l("zakatExplanations.categories.services.examples.1.input1", "Saved balance: 18,000"),
          l("zakatExplanations.categories.services.examples.1.input2", "Immediate debt: 2,000"),
        ],
        result: l("zakatExplanations.categories.services.examples.1.result", "Net 16,000 -> zakat is 400."),
      },
    ],
    fatwaExcerptArabic: [
      "يُنظر في المال المتبقي من الأجور والخدمات بعد الحاجات والدُّيون الواجبة.",
      "فإذا بلغ النصاب وحال عليه الحول وجب فيه ربع العشر.",
    ],
    fatwaExplanation: l(
      "zakatExplanations.categories.services.fatwaExplanation",
      "Zakat is on retained savings, not on gross income immediately when earned.",
    ),
    notes: [
      l(
        "zakatExplanations.categories.services.notes.1",
        "Recurring living expenses are considered before determining final retained zakatable balance.",
      ),
    ],
  },
  {
    slug: "debt",
    icon: "hand-coin-outline",
    title: l("zakatExplanations.categories.debt.title", "Debt"),
    shortSummary: l(
      "zakatExplanations.categories.debt.summary",
      "Debt rulings distinguish collectible receivables from doubtful debts and debts you owe.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.debt.rate.collectible", "Collectible debt"),
        value: "2.5%",
      },
      {
        label: l("zakatExplanations.categories.debt.rate.doubtful", "Doubtful/uncollectible debt"),
        value: "On collection",
      },
      {
        label: l("zakatExplanations.categories.debt.rate.owed", "Debt you owe"),
        value: "Deduct",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.debt.overview.covers",
        "Money owed to you and money you owe others, each with different treatment.",
      ),
      whenDue: l(
        "zakatExplanations.categories.debt.overview.whenDue",
        "Collectible debt may be included annually; doubtful debt is considered when collected.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.debt.overview.calculation",
        "Classify debt type first, then include or deduct based on fatwa guidance.",
      ),
    },
    conditions: [
      l(
        "zakatExplanations.categories.debt.conditions.1",
        "Collectible receivables: debtor is solvent and repayment is realistically expected.",
      ),
      l(
        "zakatExplanations.categories.debt.conditions.2",
        "Doubtful receivables: debtor is insolvent or repayment is unlikely.",
      ),
      l(
        "zakatExplanations.categories.debt.conditions.3",
        "Debts you owe: deducted from zakatable pool if due/near due.",
      ),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.debt.deductions.1",
        "Subtract debts you owe before checking if remaining wealth still meets nisab.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.debt.items.1", "Receivables likely to be paid"),
      l("zakatExplanations.categories.debt.items.2", "Receivables unlikely to be paid"),
      l("zakatExplanations.categories.debt.items.3", "Personal and business debts currently payable"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.debt.steps.1.title", "Classify each debt"),
        description: l(
          "zakatExplanations.categories.debt.steps.1.desc",
          "Separate collectible receivables, doubtful receivables, and debts payable by you.",
        ),
      },
      {
        title: l("zakatExplanations.categories.debt.steps.2.title", "Apply treatment"),
        description: l(
          "zakatExplanations.categories.debt.steps.2.desc",
          "Include collectible debts, defer doubtful ones until received, and deduct debts you owe.",
        ),
      },
      {
        title: l("zakatExplanations.categories.debt.steps.3.title", "Check nisab and apply rate"),
        description: l(
          "zakatExplanations.categories.debt.steps.3.desc",
          "On final net amount, apply 2.5% where zakat is due.",
        ),
      },
    ],
    examples: [
      {
        title: l("zakatExplanations.categories.debt.examples.1.title", "Example: Mixed debt position"),
        inputs: [
          l("zakatExplanations.categories.debt.examples.1.input1", "Cash and assets: 25,000"),
          l("zakatExplanations.categories.debt.examples.1.input2", "Collectible receivable: 5,000"),
          l("zakatExplanations.categories.debt.examples.1.input3", "Debt payable by you: 8,000"),
        ],
        result: l(
          "zakatExplanations.categories.debt.examples.1.result",
          "Net zakatable base 22,000 (excluding doubtful receivables), then 2.5% = 550.",
        ),
      },
    ],
    fatwaExcerptArabic: [
      "الدَّين نوعان: دينٌ لك ودينٌ عليك.",
      "فأما الدَّين المرجو فيُزكَّى بحسب القدرة على تحصيله، وأما الميؤوس منه فلا زكاة فيه حتى يُقبض.",
      "وأما الدَّين الذي عليك فيُخصم من المال الزكوي إذا كان حالًّا.",
    ],
    fatwaExplanation: l(
      "zakatExplanations.categories.debt.fatwaExplanation",
      "The key step is debt classification before any math.",
    ),
    notes: [
      l(
        "zakatExplanations.categories.debt.notes.1",
        "Local fatwa policy may differ on long-term debt deduction; align with your adopted standard.",
      ),
    ],
  },
];

export const getZakatCategoryBySlug = (slug: string): ZakatCategory | undefined =>
  zakatCategories.find((category) => category.slug === slug);
