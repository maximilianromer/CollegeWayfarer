// Museum Mode Mock Data
// This file contains all the prerecorded data for the museum/demo version

import { User, College, ChatSession, ChatMessage, Advisor, CollegeRecommendation, AdvisorType, OnboardingResponses } from "@shared/schema";

// Demo user profile description
export const DEMO_PROFILE_DESCRIPTION = `Alex is a driven and curious high school senior from California with a strong passion for computer science and its intersection with environmental sustainability. With a 3.9 GPA and a 1480 SAT score, Alex has demonstrated academic excellence while also pursuing meaningful extracurricular activities. As president of the Coding Club and an active volunteer for local environmental organizations, Alex seeks to merge technical skills with environmental advocacy.

Alex is looking for a mid-sized university that offers strong programs in both computer science and environmental studies, ideally in a location with access to tech industry opportunities and natural settings. A collaborative campus culture with opportunities for undergraduate research and internships would be ideal. Financial aid is an important consideration, and Alex is open to exploring merit-based scholarship opportunities.`;

// Demo onboarding responses
export const DEMO_ONBOARDING: OnboardingResponses = {
  programs: "I'm interested in computer science, particularly AI and machine learning. I also want to explore environmental studies or sustainability programs.",
  academicEnv: "I prefer smaller class sizes where I can interact with professors directly. Access to research opportunities as an undergraduate is important to me.",
  location: "I'd like to be on the West Coast, preferably California or the Pacific Northwest. Urban or suburban settings with access to nature would be ideal.",
  culture: "I'm looking for a collaborative rather than competitive environment. I'd like a diverse campus with strong environmental and tech communities.",
  academicStats: "GPA: 3.9/4.0, SAT: 1480 (740 Math, 740 Reading). I've taken 6 AP classes including AP Computer Science A (5), AP Environmental Science (5), AP Calculus BC (4).",
  financialAid: "Financial aid is important for my family. I'm hoping for merit scholarships and need-based aid. Estimated family contribution is around $25,000/year.",
  other: "I'm the president of my school's Coding Club and volunteer regularly with local environmental organizations. I'd love a school where I can continue these interests."
};

// Prerecorded AI chat responses
export const CHAT_RESPONSES: { [key: string]: string } = {
  default: `That's a great question! Based on your profile, I'd be happy to help you explore this further.

When thinking about college applications, it's important to consider how your interests in technology and sustainability align with each school's programs and culture.

Here are a few things to keep in mind:
- **Research programs**: Look for schools with strong CS departments that also have environmental or sustainability initiatives
- **Campus culture**: Visit campuses if possible to get a feel for the student community
- **Financial fit**: Use net price calculators on each school's website to estimate actual costs

Would you like me to elaborate on any of these points or discuss specific schools?`,

  "tell me more about": `Great choice to learn more about this school! Here's what I can share based on your interests:

**Academic Strengths:**
This institution offers excellent programs that align with your interests in computer science and environmental studies. Many students find opportunities to combine these fields through interdisciplinary research and coursework.

**Campus Life:**
The collaborative atmosphere you're seeking is definitely present here. Students often describe the community as supportive rather than cutthroat, with plenty of opportunities for undergraduate research.

**Location & Opportunities:**
The location provides access to both tech industry internships and natural environments for environmental research. Many students participate in summer internships and research programs.

**Financial Considerations:**
Based on your family situation, you may qualify for both merit and need-based aid. I'd recommend using their net price calculator and reaching out to the financial aid office directly.

Is there a specific aspect of this school you'd like to explore further?`,

  "college recommendations": `Based on your profile, here are some colleges that might be a great fit for you:

**Strong Matches:**
1. **Stanford University** - Excellent CS and environmental programs, Bay Area location
2. **UC Berkeley** - Top-ranked CS, strong sustainability research, diverse campus
3. **Harvey Mudd College** - Small classes, hands-on CS education, collaborative culture

**Good Fits:**
1. **University of Washington** - Strong CS, beautiful Pacific Northwest setting
2. **Pomona College** - Liberal arts approach, excellent undergraduate research
3. **Cal Poly San Luis Obispo** - Applied learning focus, moderate cost

**Safety Schools:**
1. **UC Santa Cruz** - Growing CS program, environmental focus, beautiful campus
2. **University of Oregon** - Good CS program, strong environmental studies

Would you like me to elaborate on any of these recommendations?`,

  "financial aid": `Financial aid can seem complex, but let me break it down for you based on your situation:

**Types of Aid You Might Receive:**
- **Need-based grants**: Given your family's estimated contribution, you likely qualify for institutional need-based aid at many private universities
- **Merit scholarships**: Your 3.9 GPA and 1480 SAT make you competitive for merit awards
- **Work-study**: Many schools offer part-time campus jobs

**Key Steps:**
1. **Complete the FAFSA** as soon as possible after October 1st
2. **Fill out the CSS Profile** if your schools require it
3. **Check each school's financial aid deadlines**
4. **Apply for external scholarships** from local organizations

**Estimated Costs:**
For private universities, after aid, you might pay $15,000-30,000/year. Public universities like UC schools might be $20,000-35,000/year for in-state students.

Would you like help with any specific aspect of the financial aid process?`,

  "application tips": `Here are my top tips for strengthening your college applications:

**Essays:**
- Your combination of CS and environmental interests is unique - tell your story authentically
- Show how these interests connect and what you hope to achieve
- Use specific examples from your Coding Club leadership and volunteer work

**Activities:**
- Quality over quantity - depth of commitment matters more than number of activities
- Highlight leadership roles and tangible impact you've made
- Consider pursuing a project that combines your interests before applications are due

**Letters of Recommendation:**
- Ask teachers who know you well and can speak to your character
- Provide them with a "brag sheet" of your accomplishments
- Give them plenty of time (at least a month before deadlines)

**Timeline:**
- Start essays over the summer
- Finalize your school list by September
- Submit early applications by November
- Regular decision deadlines are typically January 1-15

Is there a specific part of the application process you'd like to discuss further?`
};

// Function to get a contextual chat response
export function getChatResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("tell me more about") || lowerMessage.includes("what about") || lowerMessage.includes("more info")) {
    return CHAT_RESPONSES["tell me more about"];
  }
  if (lowerMessage.includes("recommend") || lowerMessage.includes("suggestion") || lowerMessage.includes("which college") || lowerMessage.includes("what school")) {
    return CHAT_RESPONSES["college recommendations"];
  }
  if (lowerMessage.includes("financial") || lowerMessage.includes("scholarship") || lowerMessage.includes("afford") || lowerMessage.includes("cost") || lowerMessage.includes("pay")) {
    return CHAT_RESPONSES["financial aid"];
  }
  if (lowerMessage.includes("essay") || lowerMessage.includes("application") || lowerMessage.includes("tips") || lowerMessage.includes("advice") || lowerMessage.includes("how do i")) {
    return CHAT_RESPONSES["application tips"];
  }

  return CHAT_RESPONSES["default"];
}

// Prerecorded college recommendations
export const PRERECORDED_RECOMMENDATIONS: Omit<CollegeRecommendation, "id" | "userId" | "createdAt" | "updatedAt">[] = [
  {
    name: "Stanford University",
    description: "A world-renowned private research university in Silicon Valley with cutting-edge computer science programs and strong interdisciplinary opportunities combining technology with environmental sustainability.",
    reason: "Stanford's location in the heart of Silicon Valley provides unparalleled tech industry access, while their Woods Institute for the Environment offers opportunities to apply CS skills to sustainability challenges. Their collaborative culture and undergraduate research opportunities align perfectly with your goals.",
    acceptanceRate: 4,
    recommendedBy: null,
    advisorNotes: null
  },
  {
    name: "UC Berkeley",
    description: "California's flagship public university offering top-ranked computer science and environmental science programs with a vibrant, diverse campus community.",
    reason: "Berkeley's EECS program is world-class, and their proximity to Bay Area tech companies means excellent internship opportunities. The campus culture is collaborative with strong environmental activism, matching your interests perfectly.",
    acceptanceRate: 14,
    recommendedBy: null,
    advisorNotes: null
  },
  {
    name: "Harvey Mudd College",
    description: "A small, highly selective STEM-focused liberal arts college emphasizing hands-on learning and close faculty relationships within the Claremont Colleges consortium.",
    reason: "Harvey Mudd's intimate class sizes (you mentioned preferring smaller classes) and focus on undergraduate research make it ideal. Their CS program emphasizes real-world applications, and you'd benefit from cross-registration at the other Claremont colleges for environmental studies.",
    acceptanceRate: 13,
    recommendedBy: null,
    advisorNotes: null
  },
  {
    name: "University of Washington",
    description: "A major public research university in Seattle with excellent computer science and environmental programs, surrounded by the natural beauty of the Pacific Northwest.",
    reason: "UW's Paul G. Allen School of Computer Science is highly ranked, and Seattle's tech scene (Amazon, Microsoft) provides industry connections. The location satisfies your preference for access to nature while being in a tech hub.",
    acceptanceRate: 48,
    recommendedBy: null,
    advisorNotes: null
  },
  {
    name: "Pomona College",
    description: "A highly selective liberal arts college in Southern California known for close student-faculty relationships and access to resources across the Claremont Colleges consortium.",
    reason: "Pomona's emphasis on undergraduate research and small class sizes matches your preferences. You can take CS courses at Harvey Mudd while enjoying Pomona's strong environmental studies program and collaborative culture.",
    acceptanceRate: 7,
    recommendedBy: null,
    advisorNotes: null
  }
];

// Demo advisor
export const DEMO_ADVISOR: Omit<Advisor, "id" | "userId" | "createdAt" | "updatedAt"> = {
  name: "Ms. Johnson",
  type: AdvisorType.SCHOOL_COUNSELOR,
  shareToken: "demo-showcase",
  isActive: true
};

// Demo colleges for the kanban board
export const DEMO_COLLEGES: Omit<College, "id" | "userId" | "createdAt" | "updatedAt">[] = [
  { name: "Stanford University", status: "applying", position: 1 },
  { name: "UC Berkeley", status: "applying", position: 2 },
  { name: "Harvey Mudd College", status: "researching", position: 1 },
  { name: "Pomona College", status: "researching", position: 2 },
  { name: "University of Washington", status: "researching", position: 3 }
];

// Demo chat sessions
export const DEMO_CHAT_SESSIONS: Omit<ChatSession, "id" | "userId" | "createdAt" | "updatedAt">[] = [
  { title: "College recommendations discussion" },
  { title: "Financial aid questions" }
];
