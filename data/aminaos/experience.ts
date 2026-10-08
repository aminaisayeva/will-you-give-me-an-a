export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string[];
  technologies: string[];
  type: 'full-time' | 'internship' | 'part-time' | 'contract';
}

export const experiences: Experience[] = [
  {
    id: "morgan-stanley-swe",
    company: "Morgan Stanley",
    position: "Software Engineer",
    location: "New York, USA",
    startDate: "Jul 2025",
    endDate: "Present",
    description: [
      "Serving as an AI Accelerator across a 20-person department, leading hands-on mentoring on Copilot and MCP server integration, facilitating biweekly cross-functional brainstorming sessions, and curating high-impact GenAI use cases showcased to senior engineers - driving adoption of AI-assisted development across the full product lifecycle.",
      "Automating conflict identification workflows using Python and GenAI, reducing manual processing time from ~4 hours to a few seconds, and enabling the team to reallocate effort toward higher-value product iteration.",
      "Actively involved in 'Women in Tech' initiative, moderating panel sessions for 50+ attendees, and leading technical workshops."
    ],
    technologies: ["Python", "GenAI", "Copilot", "MCP", "AI-assisted development"],
    type: "full-time"
  },
  {
    id: "columbia-ta",
    company: "Columbia University",
    position: "Teaching Assistant - Java and Python",
    location: "New York, USA",
    startDate: "Jan 2024",
    endDate: "Dec 2024",
    description: [
      "Supported 400+ students as Teaching Assistant for COMS 1004 Java Programming (Spring 2024) and COMS 1002 Computing in Context - Economics (Fall 2024), collaborating with 15-18 person cross-functional instructional teams.",
      "Led technical instruction, Java programming recitations, debugging support, office hours, Economics lab sessions, and assignment grading - strengthening student outcomes in software development, computational thinking, data analysis, and problem-solving."
    ],
    technologies: ["Java", "Python", "Computer Science Education"],
    type: "part-time"
  },
  {
    id: "morgan-stanley-intern",
    company: "Morgan Stanley",
    position: "Software Engineer Intern",
    location: "New York, USA",
    startDate: "May 2024",
    endDate: "Aug 2024",
    description: [
      "Built a secure internal platform (Flask, Python, Angular) serving 200+ users, streamlining access to sensitive datasets and improving compliance workflows - gaining experience designing user-facing applications with API-driven architectures.",
      "Automated a multi-step operational workflow by designing an end-to-end UI process, decreasing task completion time from several hours to <1 second and enabling teams to reallocate ~95% of manual effort to higher-value work.",
      "Led development of a real-time data visualization tool converting complex system outputs into intuitive dashboards, improving decision-making speed for non-technical stakeholders, and increasing data accessibility by 70%+."
    ],
    technologies: ["Flask", "Python", "Angular", "TypeScript", "HTML", "SCSS", "Data Visualization"],
    type: "internship"
  },
  {
    id: "klatch",
    company: "Klatch",
    position: "Product Management Intern",
    location: "New York, USA",
    startDate: "May 2023",
    endDate: "Jul 2023",
    description: [
      "Collaboratively identified and addressed a pressing issue in the event scheduling feature alongside two cross-functional teams, averting potential disruptions for over 500 facilitators.",
      "Utilized Asana to oversee quality assurance processes for new features, conducting bi-weekly pre-deployment tests to ensure seamless user experience and minimize post-launch adjustments."
    ],
    technologies: ["Asana", "Product Management", "QA", "Agile"],
    type: "internship"
  },
  {
    id: "starta-vc",
    company: "Starta VC",
    position: "Venture Capital Intern",
    location: "New York, USA",
    startDate: "Jul 2022",
    endDate: "Aug 2022",
    description: [
      "Conducted weekly competitive analysis of startups, evaluating over 60 from diverse regions within two months; pinpointed 3 standout investment prospects.",
      "Mastered key venture capital metrics, enabling more precise evaluation of startup potential."
    ],
    technologies: ["Competitive Analysis", "Venture Capital", "Market Research"],
    type: "internship"
  },
  {
    id: "ernst-young",
    company: "EY",
    position: "Technology Consulting Intern",
    location: "Baku, Azerbaijan",
    startDate: "May 2022",
    endDate: "Jun 2022",
    description: [
      "Analyzed 40+ legislative documents on IT regulations for financial institutions, ensuring 100% compliance, and used COBIT framework to prioritize critical technical requirements.",
      "Identified top 5 Core Banking System providers in the industry and compiled a comprehensive report, reducing vendor selection time by 30%, aiding the client's decision-making."
    ],
    technologies: ["COBIT Framework", "Regulatory Compliance", "Business Analysis"],
    type: "internship"
  }
];
