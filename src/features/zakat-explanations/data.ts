import type { LocalizedText, ZakatCategory } from "./types";

const l = (key: string, defaultText: string, arText?: string, frText?: string): LocalizedText => ({
  key,
  defaultText,
  arText,
  frText,
});

export const zakatCategories: ZakatCategory[] = [
  {
    slug: "livestock",
    icon: "cow",
    title: l("zakatExplanations.categories.livestock.title", "Livestock", "الأنعام", "Bétail"),
    shortSummary: l(
      "zakatExplanations.categories.livestock.summary",
      "Zakat on camels, cattle, sheep, and goats based on count thresholds.",
      "زكاة الإبل والبقر والغنم بحسب أنصبة العدد.",
      "Zakat sur les chameaux, bovins, moutons et chèvres selon les seuils de nombre.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.livestock.rate.inKind", "In-kind schedule", "إخراج عيني", "Barème en nature"),
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
        "الماشية السائمة المملوكة بقصد النماء والتناسل.",
        "Le bétail pâturant détenu pour la croissance et la reproduction.",
      ),
      whenDue: l(
        "zakatExplanations.categories.livestock.overview.whenDue",
        "After one lunar year for qualifying herds that meet minimum counts.",
        "بعد مرور حول قمري على القطيع الذي بلغ النصاب.",
        "Après une année lunaire pour les troupeaux atteignant le seuil requis.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.livestock.overview.calculation",
        "Use the classical table for each species to determine due animals.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.livestock.conditions.1", "Ownership is complete and established.", "الملك تام ومستقر.", "La propriété est complète et établie."),
      l("zakatExplanations.categories.livestock.conditions.2", "Minimum threshold is reached for the species.", "بلوغ نصاب النوع.", "Le seuil minimal de l'espèce est atteint."),
      l("zakatExplanations.categories.livestock.conditions.3", "A lunar year passes on qualifying ownership.", "مرور حول قمري على الملك.", "Une année lunaire s'est écoulée sur la propriété concernée."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.livestock.deductions.1",
        "No direct percentage deduction model; due amount follows count-based schedule.",
        "لا يوجد خصم نسبي مباشر؛ المقدار الواجب يتبع جدول العدد.",
        "Il n'y a pas de déduction proportionnelle directe; le dû suit un barème par nombre.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.livestock.items.1", "Camels", "الإبل", "Chameaux"),
      l("zakatExplanations.categories.livestock.items.2", "Cattle and buffalo", "البقر والجاموس", "Bovins et buffles"),
      l("zakatExplanations.categories.livestock.items.3", "Sheep and goats", "الغنم والماعز", "Moutons et chèvres"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.livestock.steps.1.title", "Confirm eligibility", "تحقق من الشروط", "Vérifier l'éligibilité"),
        description: l(
          "zakatExplanations.categories.livestock.steps.1.desc",
          "Check ownership, species, and that the herd reached its threshold.",
          "تحقق من الملك والنوع وبلوغ القطيع للنصاب.",
          "Vérifiez la propriété, l'espèce et l'atteinte du seuil.",
        ),
      },
      {
        title: l("zakatExplanations.categories.livestock.steps.2.title", "Find due tier", "حدد الفئة الواجبة", "Trouver le palier dû"),
        description: l(
          "zakatExplanations.categories.livestock.steps.2.desc",
          "Use the livestock table to find the due animals by count range.",
          "استخدم جدول الأنعام لتحديد الواجب حسب العدد.",
          "Utilisez le barème du bétail pour déterminer le dû selon la tranche.",
        ),
      },
      {
        title: l("zakatExplanations.categories.livestock.steps.3.title", "Discharge zakat", "أدِّ الزكاة", "S'acquitter de la zakat"),
        description: l(
          "zakatExplanations.categories.livestock.steps.3.desc",
          "Pay in-kind where possible, or cash equivalent if your policy allows.",
          "أخرجها من الأنعام أو بالقيمة عند اعتماد ذلك.",
          "Payez en nature si possible, ou en valeur monétaire selon l'avis suivi.",
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
        "الأنعام المخصصة للعمل الشخصي قد يختلف حكمها حسب المذهب والفتوى المعتمدة.",
        "Les animaux utilisés strictement pour le travail personnel peuvent avoir un statut différent selon l'avis suivi.",
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
    title: l("zakatExplanations.categories.grainsFruits.title", "Grains & Fruits", "الحبوب والثمار", "Céréales et fruits"),
    shortSummary: l(
      "zakatExplanations.categories.grainsFruits.summary",
      "Harvest zakat on qualifying crops at 10% or 5% depending on irrigation.",
      "زكاة المحاصيل المستحقة عند الحصاد بنسبة 10% أو 5% بحسب السقي.",
      "Zakat de récolte à 10% ou 5% selon le mode d'irrigation.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.grainsFruits.rate.natural", "Natural watering", "سقي طبيعي", "Arrosage naturel"),
        value: "10%",
      },
      {
        label: l("zakatExplanations.categories.grainsFruits.rate.paid", "Paid irrigation", "سقي بكلفة", "Irrigation payante"),
        value: "5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.grainsFruits.overview.covers",
        "Staple grains and fruits measured at harvest and intended for produce zakat treatment.",
        "الحبوب والثمار الأساسية التي تُقاس عند الحصاد وتدخل في زكاة الزروع.",
        "Les céréales et fruits de base mesurés à la récolte et soumis à la zakat des cultures.",
      ),
      whenDue: l(
        "zakatExplanations.categories.grainsFruits.overview.whenDue",
        "At harvest time when crop quantity reaches the crop nisab.",
        "تجب عند الحصاد إذا بلغ الخارج نصاب الزروع.",
        "Due au moment de la récolte lorsque la quantité atteint le nisab.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.grainsFruits.overview.calculation",
        "Apply the watering-based rate to the harvested amount.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.grainsFruits.conditions.1", "Harvest reaches crop nisab (commonly 5 awsuq).", "بلوغ المحصول نصاب الزروع (غالبا 5 أوسق).", "La récolte atteint le nisab des cultures (souvent 5 awsuq)."),
      l("zakatExplanations.categories.grainsFruits.conditions.2", "Ownership of produce is established at harvest.", "ثبوت ملك المحصول وقت الحصاد.", "La propriété de la récolte est établie au moment de la cueillette."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.grainsFruits.deductions.1",
        "No standard business-expense deduction in the classic crop-zakat model.",
        "لا تُعتمد خصومات نفقات تجارية في الأصل التقليدي لزكاة الزروع.",
        "Pas de déduction standard de charges commerciales dans le modèle classique.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.grainsFruits.items.1", "Wheat, barley, rice, and similar grains", "القمح والشعير والأرز ونحوها", "Blé, orge, riz et céréales similaires"),
      l("zakatExplanations.categories.grainsFruits.items.2", "Dates, raisins, and similar fruits", "التمر والزبيب ونحوها", "Dattes, raisins secs et fruits similaires"),
      l("zakatExplanations.categories.grainsFruits.items.3", "Other crops included by your adopted fatwa", "محاصيل أخرى بحسب الفتوى المعتمدة", "Autres cultures incluses selon l'avis suivi"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.grainsFruits.steps.1.title", "Measure total harvest", "احسب كامل المحصول", "Mesurer la récolte totale"),
        description: l(
          "zakatExplanations.categories.grainsFruits.steps.1.desc",
          "Record net harvested weight for the zakat season.",
          "دوّن وزن المحصول الصافي لموسم الزكاة.",
          "Enregistrez le poids net récolté pour la saison de zakat.",
        ),
      },
      {
        title: l("zakatExplanations.categories.grainsFruits.steps.2.title", "Choose irrigation rate", "اختر نسبة السقي", "Choisir le taux selon l'irrigation"),
        description: l(
          "zakatExplanations.categories.grainsFruits.steps.2.desc",
          "Use 10% for natural watering and 5% for paid irrigation.",
          "اعتمد 10% للسقي الطبيعي و5% للسقي بكلفة.",
          "Utilisez 10% pour l'arrosage naturel et 5% pour l'irrigation payante.",
        ),
      },
      {
        title: l("zakatExplanations.categories.grainsFruits.steps.3.title", "Compute due amount", "احسب المقدار الواجب", "Calculer le montant dû"),
        description: l(
          "zakatExplanations.categories.grainsFruits.steps.3.desc",
          "Multiply harvest by the applicable rate to get zakat due in produce.",
          "اضرب كمية المحصول في النسبة المناسبة لاستخراج الزكاة.",
          "Multipliez la récolte par le taux applicable pour obtenir la zakat due.",
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
        "عند اجتماع طريقتي سقي قد يُعمل بنسبة مركبة وفق التوجيه الشرعي.",
        "Les méthodes d'irrigation mixtes peuvent exiger un taux proportionnel selon l'avis savant.",
      ),
    ],
  },
  {
    slug: "other-agricultural-products",
    icon: "leaf",
    title: l("zakatExplanations.categories.otherAgricultural.title", "Other Agricultural Products", "منتجات زراعية أخرى", "Autres produits agricoles"),
    shortSummary: l(
      "zakatExplanations.categories.otherAgricultural.summary",
      "Agricultural products treated as trade assets are generally calculated at 2.5% on net value.",
      "المنتجات الزراعية التي تعامل كعروض تجارة تُزكّى غالبا 2.5% من الصافي.",
      "Les produits agricoles traités comme actifs commerciaux sont généralement soumis à 2,5% du net.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.otherAgricultural.rate.main", "Trade-assets treatment", "معاملة عروض التجارة", "Traitement des actifs commerciaux"),
        value: "2.5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.otherAgricultural.overview.covers",
        "Non-grain/fruit agricultural outputs sold commercially.",
        "المنتجات الزراعية غير الحبوب والثمار المعدّة للبيع التجاري.",
        "Produits agricoles hors céréales/fruits vendus commercialement.",
      ),
      whenDue: l(
        "zakatExplanations.categories.otherAgricultural.overview.whenDue",
        "After a lunar year on net commercial value if it reaches nisab.",
        "بعد مرور حول قمري على صافي القيمة التجارية إذا بلغ النصاب.",
        "Après une année lunaire sur la valeur commerciale nette si elle atteint le nisab.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.otherAgricultural.overview.calculation",
        "Market value minus due operating costs, then 2.5% if above nisab.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.otherAgricultural.conditions.1", "Assets are held for sale and trade value.", "الأصول معدّة للبيع بقيمة تجارية.", "Les actifs sont détenus pour la vente commerciale."),
      l("zakatExplanations.categories.otherAgricultural.conditions.2", "Net value reaches nisab at valuation date.", "بلوغ الصافي النصاب عند يوم التقييم.", "La valeur nette atteint le nisab à la date d'évaluation."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.otherAgricultural.deductions.1",
        "Deduct due costs directly tied to operations before zakat date.",
        "تُخصم التكاليف الواجبة المرتبطة مباشرة بالنشاط قبل موعد الزكاة.",
        "Déduisez les coûts exigibles liés directement à l'exploitation avant la date de zakat.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.otherAgricultural.items.1", "Vegetables and greenhouse produce for sale", "الخضر ومنتجات البيوت المحمية المعدة للبيع", "Légumes et produits de serre destinés à la vente"),
      l("zakatExplanations.categories.otherAgricultural.items.2", "Herbs, flowers, medicinal and aromatic plants", "الأعشاب والزهور والنباتات الطبية والعطرية", "Herbes, fleurs et plantes médicinales/aromatiques"),
      l("zakatExplanations.categories.otherAgricultural.items.3", "Forest and related products traded commercially", "المنتجات الغابية وما يتصل بها عند الاتجار", "Produits forestiers et assimilés commercialisés"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.otherAgricultural.steps.1.title", "Estimate market value", "قدّر القيمة السوقية", "Estimer la valeur de marché"),
        description: l(
          "zakatExplanations.categories.otherAgricultural.steps.1.desc",
          "Assess current sale value of inventory and receivables.",
          "قيّم قيمة المخزون والذمم القابلة للتحصيل بسعر السوق الحالي.",
          "Évaluez la valeur actuelle de vente du stock et des créances.",
        ),
      },
      {
        title: l("zakatExplanations.categories.otherAgricultural.steps.2.title", "Subtract due liabilities", "اطرح الالتزامات الواجبة", "Déduire les passifs exigibles"),
        description: l(
          "zakatExplanations.categories.otherAgricultural.steps.2.desc",
          "Deduct immediate operating obligations and payable costs.",
          "اخصم الالتزامات التشغيلية العاجلة والتكاليف المستحقة.",
          "Déduisez les obligations d'exploitation immédiates et coûts payables.",
        ),
      },
      {
        title: l("zakatExplanations.categories.otherAgricultural.steps.3.title", "Apply zakat rate", "طبّق نسبة الزكاة", "Appliquer le taux de zakat"),
        description: l(
          "zakatExplanations.categories.otherAgricultural.steps.3.desc",
          "If net amount is at or above nisab, pay 2.5%.",
          "إذا كان الصافي عند النصاب أو فوقه فتجب 2.5%.",
          "Si le montant net atteint ou dépasse le nisab, payez 2,5%.",
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
        "لا تخلط هذا الحكم مع نسب زكاة الزروع إلا بنص فتوى صريح.",
        "Ne mélangez pas cette règle avec les taux de récolte sauf indication explicite de votre fatwa.",
      ),
    ],
  },
  {
    slug: "trade-commerce",
    icon: "storefront-outline",
    title: l("zakatExplanations.categories.trade.title", "Trade & Commerce", "التجارة", "Commerce"),
    shortSummary: l(
      "zakatExplanations.categories.trade.summary",
      "Business goods, sale inventory, and trading assets are generally zakatable at 2.5%.",
      "البضائع التجارية والمخزون المعد للبيع والأصول التجارية تُزكّى غالبا بنسبة 2.5%.",
      "Les biens commerciaux, stocks de vente et actifs de trading sont généralement soumis à 2,5%.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.trade.rate.main", "Net commercial value", "صافي القيمة التجارية", "Valeur commerciale nette"),
        value: "2.5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.trade.overview.covers",
        "Goods purchased for resale, liquid trade assets, and related receivables.",
        "البضائع المشتراة لإعادة البيع والأصول التجارية السائلة والذمم المرتبطة بها.",
        "Biens achetés pour revente, actifs commerciaux liquides et créances associées.",
      ),
      whenDue: l(
        "zakatExplanations.categories.trade.overview.whenDue",
        "After a lunar year on net zakatable business position.",
        "بعد مرور حول قمري على صافي الوضع التجاري الزكوي.",
        "Après une année lunaire sur la position commerciale nette zakatable.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.trade.overview.calculation",
        "Current assets minus due liabilities, then 2.5% if at or above nisab.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.trade.conditions.1", "Assets are intended for trade/sale.", "الأصول معدّة للتجارة والبيع.", "Les actifs sont destinés au commerce/à la vente."),
      l("zakatExplanations.categories.trade.conditions.2", "Net amount reaches nisab.", "بلوغ الصافي النصاب.", "Le montant net atteint le nisab."),
      l("zakatExplanations.categories.trade.conditions.3", "Hawl has passed for the trade capital cycle.", "مرور الحول على رأس المال التجاري.", "Une année lunaire s'est écoulée sur le capital commercial."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.trade.deductions.1",
        "Deduct payable wages, rent, taxes due, and immediate debts.",
        "تُخصم الأجور والإيجار والضرائب المستحقة والديون العاجلة.",
        "Déduisez salaires, loyers, taxes exigibles et dettes immédiates.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.trade.items.1", "Retail and wholesale inventory", "مخزون التجزئة والجملة", "Stock de détail et de gros"),
      l("zakatExplanations.categories.trade.items.2", "Cash in business accounts", "النقد في حسابات النشاط", "Liquidités des comptes professionnels"),
      l("zakatExplanations.categories.trade.items.3", "Collectible receivables from customers", "الذمم المرجو تحصيلها من العملاء", "Créances clients recouvrables"),
      l("zakatExplanations.categories.trade.items.4", "Trading positions in compliant instruments", "مراكز تداول في أدوات متوافقة", "Positions de trading sur instruments conformes"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.trade.steps.1.title", "Value business assets", "قيّم أصول النشاط", "Valoriser les actifs de l'activité"),
        description: l(
          "zakatExplanations.categories.trade.steps.1.desc",
          "Use current market or realizable value near zakat date.",
          "اعتمد القيمة السوقية الحالية أو القابلة للتحقق قرب موعد الزكاة.",
          "Utilisez la valeur de marché actuelle ou réalisable près de la date de zakat.",
        ),
      },
      {
        title: l("zakatExplanations.categories.trade.steps.2.title", "Deduct due obligations", "اخصم الالتزامات الواجبة", "Déduire les obligations exigibles"),
        description: l(
          "zakatExplanations.categories.trade.steps.2.desc",
          "Remove short-term liabilities currently payable.",
          "اطرح الالتزامات قصيرة الأجل المستحقة حاليا.",
          "Retirez les passifs court terme actuellement exigibles.",
        ),
      },
      {
        title: l("zakatExplanations.categories.trade.steps.3.title", "Apply 2.5%", "طبّق 2.5%", "Appliquer 2,5%"),
        description: l(
          "zakatExplanations.categories.trade.steps.3.desc",
          "Pay one quarter of one tenth on the remaining amount.",
          "أخرج ربع العشر من المبلغ الصافي المتبقي.",
          "Payez le quart du dixième sur le montant net restant.",
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
        "الأصول الثابتة طويلة الأجل المستخدمة في النشاط لا تعامل كمخزون بيع.",
        "Les immobilisations à long terme utilisées par l'entreprise ne sont pas traitées comme stock de revente.",
      ),
    ],
  },
  {
    slug: "industry",
    icon: "factory",
    title: l("zakatExplanations.categories.industry.title", "Industry", "الصناعة", "Industrie"),
    shortSummary: l(
      "zakatExplanations.categories.industry.summary",
      "Industrial output and trading stock are generally assessed as business assets at 2.5%.",
      "المخرجات الصناعية والمخزون التجاري تُقوّم غالبا كأصول تجارية بنسبة 2.5%.",
      "La production industrielle et le stock marchand sont généralement évalués comme actifs commerciaux à 2,5%.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.industry.rate.main", "Net industrial trade value", "صافي القيمة الصناعية التجارية", "Valeur industrielle nette commerciale"),
        value: "2.5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.industry.overview.covers",
        "Manufactured inventory, sale-ready goods, and industrial trade receivables.",
        "المخزون الصناعي والسلع الجاهزة للبيع والذمم التجارية الصناعية.",
        "Stock fabriqué, biens prêts à la vente et créances commerciales industrielles.",
      ),
      whenDue: l(
        "zakatExplanations.categories.industry.overview.whenDue",
        "After a lunar year on net zakatable industrial business value.",
        "بعد مرور حول قمري على صافي القيمة الصناعية الزكوية.",
        "Après une année lunaire sur la valeur industrielle nette zakatable.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.industry.overview.calculation",
        "Sale-ready value minus due production-related obligations, then 2.5%.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.industry.conditions.1", "Items are meant for sale, not fixed use.", "العناصر معدّة للبيع لا للاستعمال الثابت.", "Les éléments sont destinés à la vente et non à l'usage immobilisé."),
      l("zakatExplanations.categories.industry.conditions.2", "Net amount reaches nisab.", "بلوغ الصافي النصاب.", "Le montant net atteint le nisab."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.industry.deductions.1",
        "Deduct due wages, supplier payables, and short-term operating costs.",
        "تُخصم الأجور المستحقة وديون الموردين وتكاليف التشغيل القصيرة.",
        "Déduisez salaires dus, dettes fournisseurs et coûts d'exploitation court terme.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.industry.items.1", "Food manufacturing output", "منتجات الصناعات الغذائية", "Produits de l'industrie agroalimentaire"),
      l("zakatExplanations.categories.industry.items.2", "Textile, metal, and electronics products", "منتجات النسيج والمعادن والإلكترونيات", "Produits textiles, métalliques et électroniques"),
      l("zakatExplanations.categories.industry.items.3", "Furniture and construction-material inventory", "مخزون الأثاث ومواد البناء", "Stock de meubles et matériaux de construction"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.industry.steps.1.title", "Value current stock", "قيّم المخزون الحالي", "Valoriser le stock actuel"),
        description: l(
          "zakatExplanations.categories.industry.steps.1.desc",
          "Assess market value of finished and sale-ready products.",
          "قيّم القيمة السوقية للمنتجات التامة والجاهزة للبيع.",
          "Évaluez la valeur de marché des produits finis prêts à la vente.",
        ),
      },
      {
        title: l("zakatExplanations.categories.industry.steps.2.title", "Subtract due costs", "اطرح التكاليف الواجبة", "Déduire les coûts exigibles"),
        description: l(
          "zakatExplanations.categories.industry.steps.2.desc",
          "Remove immediate liabilities and payables due by zakat date.",
          "اخصم الالتزامات والذمم الواجبة السداد عند موعد الزكاة.",
          "Retirez les passifs immédiats et montants dus à la date de zakat.",
        ),
      },
      {
        title: l("zakatExplanations.categories.industry.steps.3.title", "Apply rate", "طبّق النسبة", "Appliquer le taux"),
        description: l("zakatExplanations.categories.industry.steps.3.desc", "Pay 2.5% on the remaining net value.", "أخرج 2.5% من صافي المبلغ المتبقي.", "Payez 2,5% de la valeur nette restante."),
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
        "آلات الإنتاج المقتناة كرأس مال ثابت لها حكم مختلف غالبا عن مخزون البيع.",
        "Les machines de production utilisées comme capital fixe sont généralement traitées différemment du stock de vente.",
      ),
    ],
  },
  {
    slug: "services",
    icon: "briefcase-outline",
    title: l("zakatExplanations.categories.services.title", "Services", "الخدمات", "Services"),
    shortSummary: l(
      "zakatExplanations.categories.services.summary",
      "Service income is zakatable when retained savings reach nisab after due needs and debts.",
      "دخل الخدمات تجب زكاته إذا بلغ المدخر الصافي النصاب بعد الحاجات والديون.",
      "Les revenus de services sont soumis à la zakat lorsque l'épargne nette atteint le nisab après besoins et dettes.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.services.rate.main", "Retained zakatable wealth", "المال المدخر الزكوي", "Patrimoine épargné zakatable"),
        value: "2.5%",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.services.overview.covers",
        "Salaries and service revenues that remain saved and owned.",
        "الرواتب وعوائد الخدمات التي تبقى مدخرة ومملوكة.",
        "Salaires et revenus de services conservés en épargne.",
      ),
      whenDue: l(
        "zakatExplanations.categories.services.overview.whenDue",
        "After a lunar year on savings that stay at or above nisab.",
        "بعد مرور حول قمري على المدخرات التي تبقى عند النصاب أو فوقه.",
        "Après une année lunaire sur l'épargne restant au niveau du nisab ou au-dessus.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.services.overview.calculation",
        "Calculate net retained amount after allowable deductions, then apply 2.5%.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.services.conditions.1", "Savings are above nisab at zakat date.", "المدخرات فوق النصاب يوم الزكاة.", "L'épargne est au-dessus du nisab à la date de zakat."),
      l("zakatExplanations.categories.services.conditions.2", "Ownership and access are complete.", "الملك والتصرف بالمال تامان.", "La propriété et la disponibilité des fonds sont complètes."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.services.deductions.1",
        "Deduct immediate personal debts and due essential obligations.",
        "تُخصم الديون الشخصية العاجلة والالتزامات الأساسية المستحقة.",
        "Déduisez les dettes personnelles immédiates et obligations essentielles exigibles.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.services.items.1", "Salary savings", "مدخرات الرواتب", "Épargne salariale"),
      l("zakatExplanations.categories.services.items.2", "Professional fees retained as savings", "أتعاب مهنية محتفظ بها كادخار", "Honoraires professionnels conservés en épargne"),
      l("zakatExplanations.categories.services.items.3", "Freelance and consulting balances", "أرصدة العمل الحر والاستشارات", "Soldes de freelance et de conseil"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.services.steps.1.title", "Compute retained wealth", "احسب المال المدخر", "Calculer le patrimoine conservé"),
        description: l(
          "zakatExplanations.categories.services.steps.1.desc",
          "Total cash and near-cash holdings from service income.",
          "اجمع النقد وما في حكمه من دخل الخدمات.",
          "Totalisez la trésorerie et quasi-trésorerie issues des services.",
        ),
      },
      {
        title: l("zakatExplanations.categories.services.steps.2.title", "Subtract due obligations", "اطرح الالتزامات الواجبة", "Déduire les obligations exigibles"),
        description: l(
          "zakatExplanations.categories.services.steps.2.desc",
          "Deduct debts currently payable and essential liabilities.",
          "اخصم الديون الحالية والالتزامات الأساسية الواجبة.",
          "Déduisez les dettes actuellement exigibles et obligations essentielles.",
        ),
      },
      {
        title: l("zakatExplanations.categories.services.steps.3.title", "Apply 2.5%", "طبّق 2.5%", "Appliquer 2,5%"),
        description: l(
          "zakatExplanations.categories.services.steps.3.desc",
          "If net retained amount meets nisab, pay 2.5%.",
          "إذا بلغ صافي المدخر النصاب فتجب 2.5%.",
          "Si le montant net conservé atteint le nisab, payez 2,5%.",
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
        "تُراعى نفقات المعيشة المتكررة قبل تحديد الصافي الزكوي النهائي.",
        "Les dépenses de vie récurrentes sont prises en compte avant de fixer le solde final zakatable.",
      ),
    ],
  },
  {
    slug: "debt",
    icon: "hand-coin-outline",
    title: l("zakatExplanations.categories.debt.title", "Debt", "الديون", "Dettes"),
    shortSummary: l(
      "zakatExplanations.categories.debt.summary",
      "Debt rulings distinguish collectible receivables from doubtful debts and debts you owe.",
      "أحكام الديون تفرق بين الدين المرجو وغير المرجو والديون التي عليك.",
      "Les règles distinguent les créances recouvrables, douteuses et les dettes que vous devez.",
    ),
    rates: [
      {
        label: l("zakatExplanations.categories.debt.rate.collectible", "Collectible debt", "دين مرجو", "Dette recouvrable"),
        value: "2.5%",
      },
      {
        label: l("zakatExplanations.categories.debt.rate.doubtful", "Doubtful/uncollectible debt", "دين غير مرجو", "Dette douteuse/irrécouvrable"),
        value: "On collection",
      },
      {
        label: l("zakatExplanations.categories.debt.rate.owed", "Debt you owe", "دين عليك", "Dette que vous devez"),
        value: "Deduct",
      },
    ],
    overview: {
      whatItCovers: l(
        "zakatExplanations.categories.debt.overview.covers",
        "Money owed to you and money you owe others, each with different treatment.",
        "الأموال التي لك والتي عليك، ولكل نوع معاملة زكوية مختلفة.",
        "L'argent qu'on vous doit et celui que vous devez ont chacun un traitement différent.",
      ),
      whenDue: l(
        "zakatExplanations.categories.debt.overview.whenDue",
        "Collectible debt may be included annually; doubtful debt is considered when collected.",
        "الدين المرجو قد يُضم سنويا، وغير المرجو يُنظر فيه عند القبض.",
        "La dette recouvrable peut être incluse annuellement; la douteuse est considérée lors de l'encaissement.",
      ),
      calculationMethod: l(
        "zakatExplanations.categories.debt.overview.calculation",
        "Classify debt type first, then include or deduct based on fatwa guidance.",
      ),
    },
    conditions: [
      l("zakatExplanations.categories.debt.conditions.1", "Collectible receivables: debtor is solvent and repayment is realistically expected.", "الديون المرجوة: المدين مليء والسداد متوقع غالبا.", "Créances recouvrables: débiteur solvable et remboursement probable."),
      l("zakatExplanations.categories.debt.conditions.2", "Doubtful receivables: debtor is insolvent or repayment is unlikely.", "الديون غير المرجوة: المدين معسر أو السداد غير متوقع.", "Créances douteuses: débiteur insolvable ou remboursement peu probable."),
      l("zakatExplanations.categories.debt.conditions.3", "Debts you owe: deducted from zakatable pool if due/near due.", "الديون التي عليك: تخصم إن كانت حالّة أو قريبة الحلول.", "Dettes que vous devez: déduites si exigibles ou proches de l'échéance."),
    ],
    deductions: [
      l(
        "zakatExplanations.categories.debt.deductions.1",
        "Subtract debts you owe before checking if remaining wealth still meets nisab.",
        "اخصم الديون التي عليك قبل التحقق من بقاء الصافي عند النصاب.",
        "Soustrayez vos dettes avant de vérifier si le reste atteint encore le nisab.",
      ),
    ],
    includedItems: [
      l("zakatExplanations.categories.debt.items.1", "Receivables likely to be paid", "ديون مرجوة التحصيل", "Créances probablement recouvrées"),
      l("zakatExplanations.categories.debt.items.2", "Receivables unlikely to be paid", "ديون غير مرجوة التحصيل", "Créances peu susceptibles d'être recouvrées"),
      l("zakatExplanations.categories.debt.items.3", "Personal and business debts currently payable", "ديون شخصية وتجارية مستحقة حاليا", "Dettes personnelles et professionnelles exigibles actuellement"),
    ],
    calculationSteps: [
      {
        title: l("zakatExplanations.categories.debt.steps.1.title", "Classify each debt", "صنّف كل دين", "Classer chaque dette"),
        description: l(
          "zakatExplanations.categories.debt.steps.1.desc",
          "Separate collectible receivables, doubtful receivables, and debts payable by you.",
          "افصل بين الديون المرجوة وغير المرجوة والديون التي عليك.",
          "Séparez créances recouvrables, douteuses et dettes que vous devez.",
        ),
      },
      {
        title: l("zakatExplanations.categories.debt.steps.2.title", "Apply treatment", "طبّق الحكم", "Appliquer le traitement"),
        description: l(
          "zakatExplanations.categories.debt.steps.2.desc",
          "Include collectible debts, defer doubtful ones until received, and deduct debts you owe.",
          "ضم الديون المرجوة، وأجّل غير المرجوة حتى القبض، واخصم الديون التي عليك.",
          "Incluez les dettes recouvrables, reportez les douteuses jusqu'à encaissement et déduisez vos dettes.",
        ),
      },
      {
        title: l("zakatExplanations.categories.debt.steps.3.title", "Check nisab and apply rate", "تحقق من النصاب وطبّق النسبة", "Vérifier le nisab et appliquer le taux"),
        description: l(
          "zakatExplanations.categories.debt.steps.3.desc",
          "On final net amount, apply 2.5% where zakat is due.",
          "على الصافي النهائي تُطبَّق نسبة 2.5% عند وجوب الزكاة.",
          "Sur le montant net final, appliquez 2,5% lorsque la zakat est due.",
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
        "قد تختلف الفتوى المحلية في خصم الديون طويلة الأجل؛ التزم بالمعيار المعتمد لديك.",
        "La politique locale peut différer sur la déduction des dettes longues; alignez-vous sur votre standard adopté.",
      ),
    ],
  },
];

export const getZakatCategoryBySlug = (slug: string): ZakatCategory | undefined =>
  zakatCategories.find((category) => category.slug === slug);
