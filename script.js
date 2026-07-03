const plannerForm = document.querySelector("#plannerForm");
const exportButton = document.querySelector("#exportButton");
const resetButton = document.querySelector("#resetButton");

const fields = {
  businessBrief: document.querySelector("#businessBrief"),
  businessType: document.querySelector("#businessType"),
  campaignGoal: document.querySelector("#campaignGoal"),
  targetLocation: document.querySelector("#targetLocation"),
  monthlyBudget: document.querySelector("#monthlyBudget")
};

const outputs = {
  keywordChips: document.querySelector("#keywordChips"),
  intentGroups: document.querySelector("#intentGroups"),
  adGroupTable: document.querySelector("#adGroupTable"),
  matchTypes: document.querySelector("#matchTypes"),
  negativeKeywords: document.querySelector("#negativeKeywords"),
  campaignPreview: document.querySelector("#campaignPreview"),
  adCopyIdeas: document.querySelector("#adCopyIdeas")
};

const profileMap = {
  dental: {
    id: "dental",
    primaryTerm: "dentist",
    categoryTerm: "dental clinic",
    services: ["teeth cleaning", "teeth whitening", "emergency dentist", "family dentist", "dental implants", "dental checkup", "cosmetic dentist", "oral hygiene clinic", "dental consultation", "children dentist", "dental care", "tooth pain dentist", "teeth polishing", "dental services"],
    negativeBase: ["jobs", "salary", "course", "training", "internship", "free course", "DIY", "home remedy", "meaning", "definition", "pdf", "template", "download", "software", "YouTube", "cheap free", "government", "university"]
  },
  "local-service": {
    id: "local-service",
    primaryTerm: "local service provider",
    categoryTerm: "local service",
    services: ["service appointment", "service quote", "service consultation", "same day service", "local provider", "professional service", "emergency service", "service booking"],
    negativeBase: ["jobs", "salary", "course", "training", "internship", "DIY", "home remedy", "meaning", "definition", "pdf", "template", "download", "software", "YouTube", "cheap free", "government"]
  },
  ecommerce: {
    id: "ecommerce",
    primaryTerm: "online store",
    categoryTerm: "ecommerce store",
    services: ["buy online", "online deals", "product delivery", "best price", "discount offers", "new arrivals", "product collection", "online shopping"],
    negativeBase: ["jobs", "salary", "course", "training", "internship", "manual", "repair", "used", "definition", "pdf", "template", "download", "software", "YouTube", "wholesale jobs"]
  },
  b2b: {
    id: "b2b",
    primaryTerm: "business service",
    categoryTerm: "B2B service",
    services: ["business consultation", "agency services", "professional solution", "managed service", "pricing consultation", "business strategy", "lead generation service", "marketing consultant"],
    negativeBase: ["jobs", "salary", "course", "training", "internship", "free template", "meaning", "definition", "pdf", "download", "software", "YouTube", "examples only", "university"]
  },
  education: {
    id: "education",
    primaryTerm: "training program",
    categoryTerm: "education program",
    services: ["professional course", "training classes", "certification program", "online classes", "career training", "short course", "skills training", "admission consultation"],
    negativeBase: ["jobs", "salary", "teacher salary", "free pdf", "torrent", "meaning", "definition", "template", "download", "software", "YouTube", "government"]
  },
  healthcare: {
    id: "healthcare",
    primaryTerm: "healthcare clinic",
    categoryTerm: "medical clinic",
    services: ["doctor appointment", "clinic consultation", "medical checkup", "specialist appointment", "health screening", "same day clinic", "emergency clinic", "patient consultation"],
    negativeBase: ["jobs", "salary", "course", "training", "internship", "DIY", "home remedy", "symptoms only", "meaning", "definition", "pdf", "template", "download", "YouTube"]
  },
  "real-estate": {
    id: "real-estate",
    primaryTerm: "real estate agent",
    categoryTerm: "real estate agency",
    services: ["property consultation", "homes for sale", "apartments for sale", "property investment", "real estate agent", "property valuation", "buy property", "rental property"],
    negativeBase: ["jobs", "salary", "license course", "training", "internship", "meaning", "definition", "pdf", "template", "download", "software", "YouTube", "government"]
  }
};

const goalPhraseMap = {
  leads: ["get quote", "consultation", "contact today", "lead form"],
  sales: ["buy online", "best price", "order online", "discount"],
  calls: ["call now", "phone number", "open now", "near me"],
  appointments: ["book appointment", "schedule visit", "same day appointment", "available today"],
  awareness: ["best", "top rated", "reviews", "compare"]
};

let latestPlan = null;

plannerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  latestPlan = buildPlan(getFormData());
  renderPlan(latestPlan);
});

exportButton.addEventListener("click", () => {
  if (!latestPlan) {
    latestPlan = buildPlan(getFormData());
    renderPlan(latestPlan);
  }

  const exportText = createExportText(latestPlan);
  const blob = new Blob([exportText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "keyword-campaign-plan.txt";
  link.click();
  URL.revokeObjectURL(url);
});

resetButton.addEventListener("click", () => {
  plannerForm.reset();
  latestPlan = null;
  resetOutputs();
});

function getFormData() {
  return {
    brief: fields.businessBrief.value.trim(),
    type: fields.businessType.value,
    goal: fields.campaignGoal.value,
    location: fields.targetLocation.value.trim(),
    budget: fields.monthlyBudget.value.trim()
  };
}

function buildPlan(data) {
  const location = normalizeLocation(data.location);
  const profile = getPlanningProfile(data);
  const servicePhrases = getServicePhrases(data.brief, profile);
  const keywordGroups = buildKeywordGroups(profile, servicePhrases, location, data.goal);
  const keywordIdeas = buildKeywordIdeas(keywordGroups, profile, servicePhrases, location, data.goal);
  const adGroups = buildAdGroups(profile, keywordGroups, location);
  const matchTypes = buildMatchTypes(keywordIdeas);
  const campaignName = `${titleCase(profile.categoryTerm)} Search - ${titleCase(location)}`;
  const budget = data.budget ? `${data.budget} monthly budget` : "budget to be confirmed";

  return {
    ...data,
    primaryTerm: profile.primaryTerm,
    location,
    budget,
    campaignName,
    keywordIdeas,
    keywordGroups,
    intentGroups: buildIntentGroups(keywordGroups, location),
    adGroups,
    matchTypes,
    negatives: buildNegativeKeywords(profile),
    adCopy: buildAdCopy(profile, location, data.goal, budget)
  };
}

function buildKeywordGroups(profile, servicePhrases, location, goal) {
  if (profile.id === "dental") {
    return [
      {
        label: "High intent / ready to book",
        intent: "Ready to book",
        keywords: [
          `book dentist appointment ${location}`,
          `dental consultation ${location}`,
          `dentist appointment ${location}`,
          `same day dentist ${location}`,
          "free dental consultation",
          `trusted dentist ${location}`
        ]
      },
      {
        label: "Local service keywords",
        intent: "Local service",
        keywords: [
          "dentist near me",
          `dental clinic ${location}`,
          `best dentist ${location}`,
          `affordable dentist ${location}`,
          "dentist open near me",
          "best dental clinic near me"
        ]
      },
      {
        label: "Treatment/service keywords",
        intent: "Treatment or service",
        keywords: [
          `teeth cleaning ${location}`,
          `teeth cleaning near me`,
          `teeth whitening ${location}`,
          `best teeth whitening ${location}`,
          `teeth whitening cost ${location}`,
          `dental implants ${location}`,
          `dental implants cost ${location}`,
          `best dental implants ${location}`,
          `family dentist ${location}`,
          `dental checkup ${location}`,
          `cosmetic dentist ${location}`,
          `oral hygiene clinic ${location}`,
          `children dentist ${location}`,
          `dental care ${location}`,
          `teeth polishing ${location}`,
          `dental services ${location}`
        ]
      },
      {
        label: "Emergency keywords",
        intent: "Urgent need",
        keywords: [
          `emergency dentist ${location}`,
          `tooth pain dentist ${location}`,
          `same day dental clinic ${location}`,
          "urgent dentist near me",
          "emergency dental clinic near me"
        ]
      },
      {
        label: "Research/comparison keywords",
        intent: "Comparison",
        keywords: [
          `best dental clinic ${location}`,
          `dental clinic reviews ${location}`,
          `affordable dental clinic ${location}`,
          `top dentist ${location}`,
          `compare dentists ${location}`
        ]
      }
    ];
  }

  const primary = profile.primaryTerm;
  const goalPhrases = goalPhraseMap[goal] || goalPhraseMap.leads;

  return [
    {
      label: "High intent / ready to book",
      intent: "Ready to book",
      keywords: [
        `${goalPhrases[0]} ${primary} ${location}`,
        `${primary} consultation ${location}`,
        `book ${primary} ${location}`,
        `contact ${primary} ${location}`,
        `${primary} appointment ${location}`,
        `trusted ${primary} ${location}`
      ]
    },
    {
      label: "Local service keywords",
      intent: "Local service",
      keywords: [
        `${primary} near me`,
        `${profile.categoryTerm} ${location}`,
        `best ${primary} ${location}`,
        `affordable ${primary} ${location}`,
        `${primary} open near me`,
        `top rated ${primary} ${location}`
      ]
    },
    {
      label: "Treatment/service keywords",
      intent: "Service category",
      keywords: servicePhrases.slice(0, 9).map((service) => `${service} ${location}`)
    },
    {
      label: "Emergency keywords",
      intent: "Urgent need",
      keywords: [
        `emergency ${primary} ${location}`,
        `same day ${primary} ${location}`,
        `urgent ${primary} near me`,
        `${primary} open now`,
        `fast ${profile.categoryTerm} ${location}`
      ]
    },
    {
      label: "Research/comparison keywords",
      intent: "Comparison",
      keywords: [
        `best ${profile.categoryTerm} near me`,
        `${profile.categoryTerm} reviews ${location}`,
        `compare ${primary} providers ${location}`,
        `${primary} cost ${location}`,
        `${profile.categoryTerm} pricing ${location}`
      ]
    }
  ];
}

function buildKeywordIdeas(keywordGroups, profile, servicePhrases, location, goal) {
  const goalPhrases = goalPhraseMap[goal] || goalPhraseMap.leads;
  const fallbackPhrases = [
    ...servicePhrases.map((service) => `best ${service} ${location}`),
    ...servicePhrases.map((service) => `${service} near me`),
    ...goalPhrases.map((phrase) => `${profile.primaryTerm} ${phrase} ${location}`),
    `${profile.categoryTerm} near me`,
    `${profile.categoryTerm} services ${location}`,
    `trusted ${profile.categoryTerm} ${location}`,
    `affordable ${profile.categoryTerm} ${location}`,
    `same day ${profile.categoryTerm} ${location}`
  ];

  return uniqueList([...keywordGroups.flatMap((group) => group.keywords), ...fallbackPhrases])
    .map(cleanKeyword)
    .filter(isStrongKeyword)
    .slice(0, 32);
}

function buildIntentGroups(keywordGroups, location) {
  return keywordGroups.map((group) => ({
    label: group.label,
    description: `${group.intent} searches for ${location}. Examples: ${group.keywords.slice(0, 4).join(", ")}.`,
    examples: group.keywords.slice(0, 5)
  }));
}

function buildAdGroups(profile, keywordGroups, location) {
  if (profile.id === "dental") {
    return [
      createAdGroup("Dental Clinic " + titleCase(location), "Local service", findKeywords(keywordGroups, ["dental clinic", "dentist near me", "best dentist", "trusted dentist"]), "Phrase and exact", "Core local ad group for clinic and dentist searches."),
      createAdGroup("Teeth Cleaning", "Treatment/service", findKeywords(keywordGroups, ["teeth cleaning", "dental checkup", "teeth polishing"]), "Phrase", "Keep cleaning and polishing terms in a focused ad group."),
      createAdGroup("Teeth Whitening", "Treatment/service", findKeywords(keywordGroups, ["teeth whitening", "cosmetic dentist"]), "Phrase and exact", "Useful for cosmetic treatment demand."),
      createAdGroup("Emergency Dentist", "Emergency", findKeywords(keywordGroups, ["emergency dentist", "tooth pain", "urgent dentist", "same day dental"]), "Exact and phrase", "Prioritize urgent searches and call-focused copy."),
      createAdGroup("Dental Implants", "Treatment/service", findKeywords(keywordGroups, ["dental implants"]), "Phrase and exact", "Separate higher-value treatment demand from general clinic searches."),
      createAdGroup("Family Dental Care", "Treatment/service", findKeywords(keywordGroups, ["family dentist", "children dentist", "dental care"]), "Phrase", "Group family and children dental care searches together."),
      createAdGroup("Dental Consultation", "Ready to book", findKeywords(keywordGroups, ["dental consultation", "book dentist", "dentist appointment", "free dental consultation"]), "Exact and phrase", "Best for appointment and consultation-led landing pages.")
    ];
  }

  return [
    createAdGroup(`${titleCase(profile.categoryTerm)} ${titleCase(location)}`, "Local service", findKeywords(keywordGroups, ["near me", location, "best", "trusted"]), "Phrase and exact", "Core local ad group for provider and service searches."),
    createAdGroup(`${titleCase(profile.primaryTerm)} Appointments`, "Ready to book", findKeywords(keywordGroups, ["book", "consultation", "appointment", "contact"]), "Exact and phrase", "Use for conversion-ready searches."),
    createAdGroup("Service Categories", "Service category", keywordGroups[2].keywords.slice(0, 6), "Phrase", "Split this further when a service category gets enough volume."),
    createAdGroup("Emergency Or Same Day", "Urgent need", keywordGroups[3].keywords.slice(0, 5), "Phrase and exact", "Use urgent copy and clear availability claims only when true."),
    createAdGroup("Research And Comparison", "Comparison", keywordGroups[4].keywords.slice(0, 5), "Phrase or broad", "Use for controlled discovery with strong negative keywords.")
  ];
}

function createAdGroup(name, intent, keywords, match, note) {
  return {
    name,
    intent,
    keywords: uniqueList(keywords).filter(isStrongKeyword).slice(0, 6),
    match,
    note
  };
}

function buildMatchTypes(keywordIdeas) {
  const strongExamples = keywordIdeas.filter(isStrongKeyword);

  return [
    {
      label: "Broad match",
      description: "Use for cautious discovery when you have conversion tracking, enough budget, and a strong negative keyword list.",
      examples: strongExamples.slice(0, 3)
    },
    {
      label: "Phrase match",
      description: "Use for service and location phrases where the search should stay close to the core offer.",
      examples: strongExamples.slice(3, 6).map((keyword) => `"${keyword}"`)
    },
    {
      label: "Exact match",
      description: "Use for the most valuable ready-to-book searches where control matters most.",
      examples: strongExamples.slice(6, 9).map((keyword) => `[${keyword}]`)
    }
  ];
}

function buildNegativeKeywords(profile) {
  const sharedNegatives = ["jobs", "salary", "course", "training", "internship", "meaning", "definition", "pdf", "template", "download", "software", "YouTube", "cheap free", "government", "university"];
  return uniqueList([...profile.negativeBase, ...sharedNegatives]).slice(0, 20);
}

function buildAdCopy(profile, location, goal, budget) {
  return [
    {
      headline: `${titleCase(profile.categoryTerm)} in ${titleCase(location)}`,
      description: `Plan search campaigns around clear intent, focused ad groups, and ${budget}.`
    },
    {
      headline: `${readableGoal(goal)} From Search`,
      description: "Use phrase and exact match for high-intent searches before expanding into broader discovery."
    },
    {
      headline: `Organized Keywords By Intent`,
      description: "Separate local, service, urgent, and comparison searches before moving into a live account."
    }
  ];
}

function renderPlan(plan) {
  renderChips(outputs.keywordChips, plan.keywordIdeas);
  renderStack(outputs.intentGroups, plan.intentGroups);
  renderAdGroupTable(plan.adGroups);
  renderStack(outputs.matchTypes, plan.matchTypes);
  renderChips(outputs.negativeKeywords, plan.negatives, "negative");
  renderCampaignPreview(plan);
  renderAdCopy(plan.adCopy);
}

function renderChips(container, items, modifier = "") {
  container.className = "chip-cloud";
  container.innerHTML = items.map((item) => `<span class="chip ${modifier}">${escapeHtml(item)}</span>`).join("");
}

function renderStack(container, items) {
  container.className = "stack-list";
  container.innerHTML = items
    .map(
      (item) => `
        <div class="stack-item">
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.description)}</p>
          ${renderMiniChips(item.examples || [])}
        </div>
      `
    )
    .join("");
}

function renderMiniChips(items) {
  if (!items.length) {
    return "";
  }

  return `
    <div class="mini-chip-row">
      ${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function renderAdGroupTable(adGroups) {
  outputs.adGroupTable.className = "table-wrap";
  outputs.adGroupTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Ad group</th>
          <th>Intent</th>
          <th>Keyword examples</th>
          <th>Match type</th>
          <th>Planning note</th>
        </tr>
      </thead>
      <tbody>
        ${adGroups
          .map(
            (group) => `
              <tr>
                <td>${escapeHtml(group.name)}</td>
                <td>${escapeHtml(group.intent)}</td>
                <td>${escapeHtml(group.keywords.join(", ") || "Add location-specific terms")}</td>
                <td>${escapeHtml(group.match)}</td>
                <td>${escapeHtml(group.note)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderCampaignPreview(plan) {
  outputs.campaignPreview.className = "campaign-preview";
  outputs.campaignPreview.innerHTML = plan.adGroups
    .map(
      (group) => `
        <div class="campaign-block">
          <span class="mini-label">${escapeHtml(plan.campaignName)}</span>
          <strong>${escapeHtml(group.name)}</strong>
          <p>${escapeHtml(group.intent)} intent. Suggested match type: ${escapeHtml(group.match)}.</p>
          ${renderMiniChips(group.keywords.slice(0, 4))}
        </div>
      `
    )
    .join("");
}

function renderAdCopy(items) {
  outputs.adCopyIdeas.className = "ad-copy-grid";
  outputs.adCopyIdeas.innerHTML = items
    .map(
      (item) => `
        <div class="ad-copy-card">
          <strong>${escapeHtml(item.headline)}</strong>
          <p>${escapeHtml(item.description)}</p>
        </div>
      `
    )
    .join("");
}

function resetOutputs() {
  outputs.keywordChips.className = "chip-cloud empty-state";
  outputs.keywordChips.textContent = "Generate a plan to see keyword ideas.";
  outputs.intentGroups.className = "stack-list empty-state";
  outputs.intentGroups.textContent = "Search intent groups will appear here.";
  outputs.adGroupTable.className = "table-wrap empty-state";
  outputs.adGroupTable.textContent = "Ad group suggestions will appear here.";
  outputs.matchTypes.className = "stack-list empty-state";
  outputs.matchTypes.textContent = "Match type guidance will appear here.";
  outputs.negativeKeywords.className = "chip-cloud empty-state";
  outputs.negativeKeywords.textContent = "Negative keyword ideas will appear here.";
  outputs.campaignPreview.className = "campaign-preview empty-state";
  outputs.campaignPreview.textContent = "Campaign blocks will appear here.";
  outputs.adCopyIdeas.className = "ad-copy-grid empty-state";
  outputs.adCopyIdeas.textContent = "Starter ad copy ideas will appear here.";
}

function getPlanningProfile(data) {
  const brief = data.brief.toLowerCase();
  const dentalSignals = ["dentist", "dental", "teeth", "tooth", "implant", "orthodontic", "oral"];

  if (dentalSignals.some((signal) => brief.includes(signal))) {
    return profileMap.dental;
  }

  return profileMap[data.type] || profileMap["local-service"];
}

function getServicePhrases(brief, profile) {
  const normalizedBrief = brief.toLowerCase();
  const detectedServices = profile.services.filter((service) => normalizedBrief.includes(service.split(" ")[0]) || normalizedBrief.includes(service));
  const extractedPhrases = extractBriefPhrases(brief);
  const phrases = uniqueList([...detectedServices, ...extractedPhrases, ...profile.services]);

  return phrases.filter(isStrongKeyword).slice(0, 10);
}

function extractBriefPhrases(brief) {
  if (!brief) {
    return [];
  }

  const stopWords = new Set(["and", "for", "the", "with", "from", "that", "this", "into", "offering", "business", "company", "patients", "customers", "clients"]);
  const words = brief
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  const phrases = [];
  for (let index = 0; index < words.length - 1; index += 1) {
    phrases.push(`${words[index]} ${words[index + 1]}`);
  }

  return phrases;
}

function findKeywords(keywordGroups, signals) {
  const allKeywords = keywordGroups.flatMap((group) => group.keywords);
  return allKeywords.filter((keyword) => signals.some((signal) => keyword.toLowerCase().includes(signal.toLowerCase())));
}

function normalizeLocation(location) {
  if (!location.trim()) {
    return "target location";
  }

  return titleCase(location.split(",")[0].trim());
}

function cleanKeyword(keyword) {
  return keyword.replace(/\s+/g, " ").trim();
}

function isStrongKeyword(keyword) {
  const clean = cleanKeyword(keyword);
  return clean.split(/\s+/).length >= 2 && clean.length >= 8;
}

function createExportText(plan) {
  return [
    "Google Ads Keyword Research & Campaign Structure Dashboard",
    "Portfolio planning export",
    "",
    `Campaign name: ${plan.campaignName}`,
    `Business brief: ${plan.brief || "Not provided"}`,
    `Business type: ${readableType(plan.type)}`,
    `Campaign goal: ${readableGoal(plan.goal)}`,
    `Target location: ${plan.location}`,
    `Budget: ${plan.budget}`,
    "",
    "Keyword ideas:",
    ...plan.keywordIdeas.map((keyword) => `- ${keyword}`),
    "",
    "Intent groups:",
    ...plan.keywordGroups.map((group) => `- ${group.label}: ${group.keywords.slice(0, 6).join(", ")}`),
    "",
    "Ad groups:",
    ...plan.adGroups.map((group) => `- ${group.name} | ${group.intent} | ${group.match}: ${group.keywords.join(", ")}`),
    "",
    "Match type suggestions:",
    ...plan.matchTypes.map((matchType) => `- ${matchType.label}: ${matchType.examples.join(", ")}`),
    "",
    "Negative keyword ideas:",
    ...plan.negatives.map((keyword) => `- ${keyword}`),
    "",
    "Note: This export is generated locally for planning and portfolio purposes only."
  ].join("\n");
}

function uniqueList(items) {
  return [...new Set(items.map((item) => cleanKeyword(item)).filter(Boolean))];
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function readableType(type) {
  return {
    "local-service": "Local service",
    ecommerce: "Ecommerce",
    b2b: "B2B service",
    education: "Education or training",
    healthcare: "Healthcare",
    "real-estate": "Real estate"
  }[type] || "Local service";
}

function readableGoal(goal) {
  return {
    leads: "Generate leads",
    sales: "Drive online sales",
    calls: "Increase phone calls",
    appointments: "Book appointments",
    awareness: "Build search visibility"
  }[goal] || "Generate leads";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
