import type { Locale } from "./translations";

const en = {
  nav: {
    product: "Product",
    solutions: "Solutions",
    howItWorks: "How it works",
    architecture: "How Masteacon works",
    security: "Trust & control",
    signIn: "Sign in",
    getStarted: "Get started",
    explore: "EXPLORE MASTEACON",
    openMenu: "Open navigation",
    closeMenu: "Close navigation",
  },

  hero: {
    eyebrow: "KNOWLEDGE INTELLIGENCE · TRUSTED ANSWERS",
    titleStart: "Turn scattered knowledge into",
    titleAccent: " trusted answers.",
    description:
      "Bring your knowledge together. Ask naturally. Get clear answers with visible sources and context you can verify.",
    primary: "Start building",
    secondary: "Explore the platform",
    signals: [
      "Evidence connected",
      "Search by meaning",
      "Focused workspaces",
      "Intelligent workflows",
    ],
  },

  preview: {
    sectionEyebrow: "THE PLATFORM",
    sectionTitle: "One intelligence layer.",
    sectionTitleSecond: "Four ways to work.",
    sectionDescription:
      "From knowledge organization to reliable answers and intelligent workflows, Masteacon keeps everything connected to the information behind it.",

    tabs: {
      command: {
        label: "Command Center",
        eyebrow: "KNOWLEDGE COMMAND CENTER",
        title: "See what your knowledge can do.",
        description:
          "Track knowledge coverage, answer activity and workspace intelligence from one calm operating surface.",
        metricLabel: "Knowledge coverage",
        metricValue: "100%",
      },
      library: {
        label: "Knowledge Library",
        eyebrow: "KNOWLEDGE LIBRARY",
        title: "Bring scattered knowledge into one place.",
        description:
          "Upload and organize your documents while Masteacon prepares them for fast, relevant answers.",
        metricLabel: "Ready documents",
        metricValue: "24",
      },
      chat: {
        label: "Ask Masteacon",
        eyebrow: "ANSWERS WITH EVIDENCE",
        title: "Ask naturally. Verify every answer.",
        description:
          "Move beyond exact keyword matching and get answers connected to the knowledge you control.",
        metricLabel: "Answer evidence",
        metricValue: "Active",
      },
      agent: {
        label: "Intelligent Workflows",
        eyebrow: "WORKFLOW ACTIVITY",
        title: "Turn knowledge into action.",
        description:
          "Run intelligent workflows across documents and workspaces with clear steps and results you can review.",
        metricLabel: "Execution status",
        metricValue: "Visible",
      },
    },

    ask: "Ask Masteacon",
    question: "What does our knowledge say?",
    answerReady: "Trusted response ready",
    answerDescription:
      "Relevant knowledge was found and reviewed before the answer was prepared.",
    relevantContext: "Relevant context first",
    liveSignal: "Live workspace signal",
    grounded: "Evidence connected",
  },

  problem: {
    eyebrow: "WHY MASTEACON",
    title: "Your knowledge is everywhere.",
    accent: "Your answers shouldn't be.",
    description:
      "Masteacon turns fragmented organizational knowledge into a trusted, searchable layer your team can actually use.",
    without: "Without Masteacon",
    withoutTitle: "Fragmented knowledge",
    with: "With Masteacon",
    withTitle: "Trusted intelligence",
    badge: "MASTEACON INTELLIGENCE",

    withoutItems: [
      "Knowledge scattered across documents and folders",
      "Keyword search misses meaning and context",
      "Teams repeat the same research",
      "AI answers arrive without evidence",
      "Important knowledge disappears inside silos",
    ],

    withItems: [
      "One searchable knowledge layer",
      "Find answers even without exact keyword matches",
      "Answers with visible supporting evidence",
      "Intelligent workflows across trusted knowledge",
      "Organized workspaces with controlled context",
    ],
  },

  steps: {
    eyebrow: "HOW IT WORKS",
    title: "From documents to dependable intelligence.",
    items: [
      {
        number: "01",
        title: "Bring your knowledge",
        description:
          "Add the information your team relies on to a focused workspace.",
      },
      {
        number: "02",
        title: "Build intelligence",
        description:
          "Masteacon organizes your content so the right information can be found when it matters.",
      },
      {
        number: "03",
        title: "Ask. Verify. Act.",
        description:
          "Get clear answers, review supporting sources and move forward with confidence.",
      },
    ],
  },

  architecture: {
    eyebrow: "HOW MASTEACON WORKS",
    title: "From scattered knowledge to",
    titleSecond: "answers you can trust.",
    description:
      "Masteacon prepares your knowledge, finds what matters for each question and keeps every answer connected to the information behind it.",

    stages: [
      {
        number: "01",
        title: "Bring your knowledge",
        description: "Add the information your team relies on.",
      },
      {
        number: "02",
        title: "Understand",
        description: "Masteacon makes your content ready to work with.",
      },
      {
        number: "03",
        title: "Organize",
        description: "Related knowledge is connected into useful context.",
      },
      {
        number: "04",
        title: "Find what matters",
        description:
          "The most relevant information is selected for each question.",
      },
      {
        number: "05",
        title: "Answer with evidence",
        description:
          "Answers stay connected to the knowledge behind them.",
      },
    ],

    questionLabel: "YOUR QUESTION",
    question: "Ask naturally.",
    flow: [
      "Find relevant knowledge",
      "Connect the context",
      "Prepare the answer",
    ],
    answerLabel: "TRUSTED ANSWER",
    answerTitle: "Relevant context. Clear evidence.",
    answerDescription: "The knowledge behind the answer stays visible.",
    signals: [
      "Relevant knowledge",
      "Visible evidence",
      "Trusted context",
      "Clear answers",
    ],
  },

  capabilities: {
    eyebrow: "CORE CAPABILITIES",
    title: "Built for knowledge that",
    titleSecond: "needs to stay useful.",
    description:
      "Masteacon brings your knowledge, relevant context and trusted answers together in one focused intelligence platform.",

    items: [
      {
        number: "01",
        title: "Knowledge Library",
        description:
          "Organize trusted documents inside focused workspaces built around your team's knowledge.",
        meta: "Documents in one place",
      },
      {
        number: "02",
        title: "Smart Search",
        description:
          "Find relevant information even when your question uses different wording.",
        meta: "Meaning-aware discovery",
      },
      {
        number: "03",
        title: "Answers with Sources",
        description:
          "Get clear answers while keeping supporting information visible and easy to review.",
        meta: "Visible answer evidence",
      },
      {
        number: "04",
        title: "Intelligent Workflows",
        description:
          "Run knowledge-aware workflows with clear steps and results you can review.",
        meta: "Guided actions",
      },
      {
        number: "05",
        title: "Knowledge Workspaces",
        description:
          "Keep documents, context and intelligent workflows organized around a clear scope.",
        meta: "Focused context",
      },
      {
        number: "06",
        title: "Activity Visibility",
        description:
          "See how answers and workflows progress instead of treating the system like a black box.",
        meta: "Reviewable activity",
      },
    ],
  },

  audience: {
    eyebrow: "BUILT FOR KNOWLEDGE-HEAVY WORK",
    title: "One intelligence layer.",
    titleSecond: "Different ways to use it.",
    description:
      "Wherever teams depend on documents, internal knowledge and repeated research, Masteacon helps turn that information into something searchable and actionable.",

    items: [
      {
        label: "PRODUCT",
        title: "Product teams",
        description:
          "Search requirements, product notes and internal decisions without losing the context behind them.",
      },
      {
        label: "ENGINEERING",
        title: "Engineering teams",
        description:
          "Find technical knowledge, architecture notes and operational context through natural language.",
      },
      {
        label: "RESEARCH",
        title: "Research teams",
        description:
          "Explore document collections intelligently and keep answers tied to supporting evidence.",
      },
      {
        label: "OPERATIONS",
        title: "Operations",
        description:
          "Turn policies, procedures and internal references into a searchable knowledge layer.",
      },
    ],
  },

  trust: {
    eyebrow: "TRUST & CONTROL",
    title: "AI is more useful when",
    accent: " you can see why.",
    description:
      "Masteacon keeps context, evidence and activity visible so teams can understand what supports an answer before relying on it.",
    signals: [
      "Source evidence",
      "Workspace context",
      "Relevant context",
      "Workflow history",
    ],
    flowLabel: "MASTEACON / TRUSTED ANSWER FLOW",
    flowTitle: "Context before every answer",

    stages: [
      {
        number: "01",
        title: "Knowledge",
        description: "Trusted workspace information",
      },
      {
        number: "02",
        title: "Relevant context",
        description: "Finds what matters for the question",
      },
      {
        number: "03",
        title: "Evidence",
        description: "Keeps supporting knowledge connected",
      },
    ],

    statusLabel: "Answer status",
    statusTitle: "Sources connected",
    ready: "READY",
  },

  faq: {
    eyebrow: "FAQ",
    title: "A few things worth",
    titleSecond: "knowing first.",

    items: [
      {
        question: "What is Masteacon?",
        answer:
          "Masteacon is a knowledge intelligence platform for organizing documents, finding relevant information and producing clear answers from trusted knowledge.",
      },
      {
        question: "How does Masteacon find relevant information?",
        answer:
          "Masteacon looks at meaning and context, so it can find related information even when your question uses different wording.",
      },
      {
        question: "How does Masteacon keep answers trustworthy?",
        answer:
          "Masteacon uses relevant knowledge from your workspace and keeps supporting sources visible so you can review what an answer is based on.",
      },
      {
        question: "Which document formats are supported?",
        answer:
          "The current knowledge library supports PDF, DOCX and TXT documents.",
      },
      {
        question: "What can Masteacon workflows do?",
        answer:
          "Masteacon can carry out supported knowledge and workspace actions, return clear results and show the steps taken along the way.",
      },
    ],
  },

  finalCta: {
    eyebrow: "TRUSTED KNOWLEDGE · CLEAR ANSWERS",
    title: "Your knowledge already exists. Make it usable.",
    button: "Build your workspace",
  },

  footer: {
    description:
      "Knowledge intelligence for teams that need answers they can trust.",
    signIn: "Sign in",
    create: "Create account",
  },
};

const tr: typeof en = {
  nav: {
    product: "Ürün",
    solutions: "Çözümler",
    howItWorks: "Nasıl çalışır",
    architecture: "Masteacon nasıl çalışır",
    security: "Güven ve kontrol",
    signIn: "Giriş yap",
    getStarted: "Başla",
    explore: "MASTEACON'U KEŞFET",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
  },

  hero: {
    eyebrow: "BİLGİ ZEKÂSI · GÜVENİLİR YANITLAR",
    titleStart: "Dağınık bilgiyi",
    titleAccent: " güvenilir yanıtlara dönüştürün.",
    description:
      "Bilginizi bir araya getirin. Doğal şekilde sorun. Görünür kaynaklara ve doğrulayabileceğiniz bağlama dayanan net yanıtlar alın.",
    primary: "Başlamaya hazır",
    secondary: "Platformu keşfet",
    signals: [
      "Kanıtla destekli",
      "Anlama göre arama",
      "Odaklı çalışma alanları",
      "Akıllı iş akışları",
    ],
  },

  preview: {
    sectionEyebrow: "PLATFORM",
    sectionTitle: "Tek bir bilgi katmanı.",
    sectionTitleSecond: "Dört farklı çalışma biçimi.",
    sectionDescription:
      "Bilgiyi düzenlemekten güvenilir yanıtlar ve akıllı iş akışları oluşturmaya kadar Masteacon her şeyi temelindeki bilgiyle bağlantılı tutar.",

    tabs: {
      command: {
        label: "Komuta Merkezi",
        eyebrow: "BİLGİ KOMUTA MERKEZİ",
        title: "Bilginizin neler yapabildiğini görün.",
        description:
          "Bilgi kapsamını, yanıt etkinliğini ve çalışma alanı içgörülerini tek bir sade merkezden takip edin.",
        metricLabel: "Bilgi kapsamı",
        metricValue: "%100",
      },
      library: {
        label: "Bilgi Kütüphanesi",
        eyebrow: "BİLGİ KÜTÜPHANESİ",
        title: "Dağınık bilgiyi tek yerde toplayın.",
        description:
          "Dokümanlarınızı yükleyip düzenleyin; Masteacon onları hızlı ve ilgili yanıtlar için hazırlar.",
        metricLabel: "Hazır doküman",
        metricValue: "24",
      },
      chat: {
        label: "Masteacon'a Sor",
        eyebrow: "KANITLI YANITLAR",
        title: "Doğal şekilde sorun. Her yanıtı doğrulayın.",
        description:
          "Tam kelime eşleşmesinin ötesine geçin ve kontrol ettiğiniz bilgiyle bağlantılı yanıtlar alın.",
        metricLabel: "Yanıt kanıtı",
        metricValue: "Aktif",
      },
      agent: {
        label: "Akıllı İş Akışları",
        eyebrow: "İŞ AKIŞI ETKİNLİĞİ",
        title: "Bilgiyi eyleme dönüştürün.",
        description:
          "Dokümanlar ve çalışma alanları üzerinde adımları ve sonuçları inceleyebileceğiniz akıllı iş akışları yürütün.",
        metricLabel: "İşlem durumu",
        metricValue: "Görünür",
      },
    },

    ask: "Masteacon'a Sor",
    question: "Bilgimiz bize ne söylüyor?",
    answerReady: "Güvenilir yanıt hazır",
    answerDescription:
      "Yanıt hazırlanmadan önce ilgili bilgi bulundu ve değerlendirildi.",
    relevantContext: "Önce ilgili bağlam",
    liveSignal: "Canlı çalışma alanı göstergesi",
    grounded: "Kanıt bağlı",
  },

  problem: {
    eyebrow: "NEDEN MASTEACON",
    title: "Bilginiz her yerde olabilir.",
    accent: "Yanıtlarınız olmamalı.",
    description:
      "Masteacon dağınık kurumsal bilgiyi ekibinizin gerçekten kullanabileceği güvenilir ve aranabilir bir katmana dönüştürür.",
    without: "Masteacon olmadan",
    withoutTitle: "Dağınık bilgi",
    with: "Masteacon ile",
    withTitle: "Güvenilir bilgi zekâsı",
    badge: "MASTEACON BİLGİ ZEKÂSI",

    withoutItems: [
      "Bilginin dokümanlara ve klasörlere dağılması",
      "Kelime aramalarının anlamı ve bağlamı kaçırması",
      "Ekiplerin aynı araştırmayı tekrar tekrar yapması",
      "Yapay zekâ yanıtlarının kanıtsız gelmesi",
      "Önemli bilginin klasörler içinde kaybolması",
    ],

    withItems: [
      "Tek ve aranabilir bir bilgi katmanı",
      "Tam kelime eşleşmesi olmadan da ilgili bilgiye ulaşma",
      "Görünür kaynaklarla desteklenen yanıtlar",
      "Güvenilir bilgi üzerinde akıllı iş akışları",
      "Kontrollü bağlama sahip düzenli çalışma alanları",
    ],
  },

  steps: {
    eyebrow: "NASIL ÇALIŞIR",
    title: "Dokümanlardan güvenilir bilgi zekâsına.",
    items: [
      {
        number: "01",
        title: "Bilginizi getirin",
        description:
          "Ekibinizin güvendiği bilgileri odaklı bir çalışma alanına ekleyin.",
      },
      {
        number: "02",
        title: "Bilgiyi kullanılabilir hale getirin",
        description:
          "Masteacon içeriğinizi doğru bilginin gerektiği anda bulunabileceği şekilde düzenler.",
      },
      {
        number: "03",
        title: "Sorun. Doğrulayın. Harekete geçin.",
        description:
          "Net yanıtlar alın, destekleyen kaynakları inceleyin ve güvenle ilerleyin.",
      },
    ],
  },

  architecture: {
    eyebrow: "MASTEACON NASIL ÇALIŞIR",
    title: "Dağınık bilgiden",
    titleSecond: "güvenebileceğiniz yanıtlara.",
    description:
      "Masteacon bilginizi hazırlar, her soru için önemli olanı bulur ve her yanıtı arkasındaki bilgiyle bağlantılı tutar.",

    stages: [
      {
        number: "01",
        title: "Bilginizi getirin",
        description: "Ekibinizin güvendiği bilgileri ekleyin.",
      },
      {
        number: "02",
        title: "Anlamlandırın",
        description: "Masteacon içeriğinizi çalışmaya hazır hale getirir.",
      },
      {
        number: "03",
        title: "Düzenleyin",
        description: "İlişkili bilgiler anlamlı bir bağlam içinde birleştirilir.",
      },
      {
        number: "04",
        title: "Önemli olanı bulun",
        description: "Her soru için en ilgili bilgi seçilir.",
      },
      {
        number: "05",
        title: "Kanıtla yanıtlayın",
        description: "Yanıtlar arkasındaki bilgiyle bağlantılı kalır.",
      },
    ],

    questionLabel: "SORUNUZ",
    question: "Doğal şekilde sorun.",
    flow: [
      "İlgili bilgiyi bul",
      "Bağlamı birleştir",
      "Yanıtı hazırla",
    ],
    answerLabel: "GÜVENİLİR YANIT",
    answerTitle: "İlgili bağlam. Açık kanıt.",
    answerDescription: "Yanıtın arkasındaki bilgi görünür kalır.",
    signals: [
      "İlgili bilgi",
      "Görünür kanıt",
      "Güvenilir bağlam",
      "Net yanıtlar",
    ],
  },

  capabilities: {
    eyebrow: "TEMEL YETENEKLER",
    title: "Değerini koruması gereken",
    titleSecond: "bilgiler için tasarlandı.",
    description:
      "Masteacon bilginizi, ilgili bağlamı ve güvenilir yanıtları tek bir odaklı bilgi platformunda bir araya getirir.",

    items: [
      {
        number: "01",
        title: "Bilgi Kütüphanesi",
        description:
          "Güvenilir dokümanları ekibinizin bilgisine odaklanan çalışma alanlarında düzenleyin.",
        meta: "Dokümanlar tek yerde",
      },
      {
        number: "02",
        title: "Akıllı Arama",
        description:
          "Sorunuz farklı kelimeler kullansa bile ilgili bilgileri bulun.",
        meta: "Anlama göre keşif",
      },
      {
        number: "03",
        title: "Kaynaklı Yanıtlar",
        description:
          "Destekleyen bilgiyi görünür ve incelenebilir tutarken net yanıtlar alın.",
        meta: "Görünür yanıt kanıtı",
      },
      {
        number: "04",
        title: "Akıllı İş Akışları",
        description:
          "Adımlarını ve sonuçlarını inceleyebileceğiniz bilgi odaklı iş akışları yürütün.",
        meta: "Yönlendirilmiş işlemler",
      },
      {
        number: "05",
        title: "Bilgi Çalışma Alanları",
        description:
          "Dokümanları, bağlamı ve akıllı iş akışlarını net bir kapsam etrafında düzenleyin.",
        meta: "Odaklı bağlam",
      },
      {
        number: "06",
        title: "Etkinlik Görünürlüğü",
        description:
          "Sistemi kara kutu olarak görmek yerine yanıtların ve iş akışlarının nasıl ilerlediğini görün.",
        meta: "İncelenebilir etkinlik",
      },
    ],
  },

  audience: {
    eyebrow: "BİLGİ YOĞUN ÇALIŞMALAR İÇİN",
    title: "Tek bir bilgi katmanı.",
    titleSecond: "Farklı çalışma biçimleri.",
    description:
      "Ekipler dokümanlara, kurum içi bilgiye ve tekrar eden araştırmalara nerede ihtiyaç duyarsa Masteacon bu bilgiyi aranabilir ve kullanılabilir hale getirir.",

    items: [
      {
        label: "ÜRÜN",
        title: "Ürün ekipleri",
        description:
          "Gereksinimleri, ürün notlarını ve kurum içi kararları bağlamını kaybetmeden bulun.",
      },
      {
        label: "MÜHENDİSLİK",
        title: "Mühendislik ekipleri",
        description:
          "Teknik bilgileri, mimari notları ve operasyonel bağlamı doğal dil kullanarak bulun.",
      },
      {
        label: "ARAŞTIRMA",
        title: "Araştırma ekipleri",
        description:
          "Doküman koleksiyonlarını akıllıca keşfedin ve yanıtları destekleyen kanıtlarla bağlantılı tutun.",
      },
      {
        label: "OPERASYON",
        title: "Operasyon ekipleri",
        description:
          "Politikaları, prosedürleri ve kurum içi kaynakları aranabilir bir bilgi katmanına dönüştürün.",
      },
    ],
  },

  trust: {
    eyebrow: "GÜVEN & KONTROL",
    title: "Yapay zekâ, nedenini",
    accent: " görebildiğinizde daha değerlidir.",
    description:
      "Masteacon bağlamı, kanıtı ve etkinliği görünür tutar; böylece ekipler bir yanıta güvenmeden önce onu neyin desteklediğini anlayabilir.",
    signals: [
      "Kaynak kanıtı",
      "Çalışma alanı bağlamı",
      "İlgili bağlam",
      "İş akışı geçmişi",
    ],
    flowLabel: "MASTEACON / GÜVENİLİR YANIT AKIŞI",
    flowTitle: "Her yanıttan önce bağlam",

    stages: [
      {
        number: "01",
        title: "Bilgi",
        description: "Güvenilir çalışma alanı bilgisi",
      },
      {
        number: "02",
        title: "İlgili bağlam",
        description: "Soru için önemli olanı bulur",
      },
      {
        number: "03",
        title: "Kanıt",
        description: "Destekleyen bilgiyi bağlantılı tutar",
      },
    ],

    statusLabel: "Yanıt durumu",
    statusTitle: "Kaynaklar bağlı",
    ready: "HAZIR",
  },

  faq: {
    eyebrow: "SSS",
    title: "Başlamadan önce",
    titleSecond: "bilmeniz gerekenler.",

    items: [
      {
        question: "Masteacon nedir?",
        answer:
          "Masteacon; dokümanları düzenlemek, ilgili bilgiyi bulmak ve güvenilir bilgilerden net yanıtlar üretmek için tasarlanmış bir bilgi zekâsı platformudur.",
      },
      {
        question: "Masteacon ilgili bilgiyi nasıl bulur?",
        answer:
          "Masteacon anlamı ve bağlamı dikkate alır; böylece sorunuz dokümandaki ifadeden farklı olsa bile ilişkili bilgiyi bulabilir.",
      },
      {
        question: "Masteacon yanıtları nasıl güvenilir tutar?",
        answer:
          "Masteacon çalışma alanınızdaki ilgili bilgiyi kullanır ve destekleyen kaynakları görünür tutar; böylece yanıtın neye dayandığını inceleyebilirsiniz.",
      },
      {
        question: "Hangi doküman türleri destekleniyor?",
        answer:
          "Mevcut bilgi kütüphanesi PDF, DOCX ve TXT dokümanlarını destekliyor.",
      },
      {
        question: "Masteacon iş akışları ne yapabilir?",
        answer:
          "Masteacon desteklenen bilgi ve çalışma alanı işlemlerini gerçekleştirebilir, net sonuçlar döndürebilir ve süreçte izlenen adımları gösterebilir.",
      },
    ],
  },

  finalCta: {
    eyebrow: "GÜVENİLİR BİLGİ · NET YANITLAR",
    title: "Bilginiz zaten var. Onu kullanılabilir hale getirin.",
    button: "Çalışma alanınızı oluşturun",
  },

  footer: {
    description:
      "Güvenebileceği yanıtlara ihtiyaç duyan ekipler için bilgi zekâsı.",
    signIn: "Giriş yap",
    create: "Hesap oluştur",
  },
};

export const landingTranslations: Record<Locale, typeof en> = {
  en,
  tr,
};
