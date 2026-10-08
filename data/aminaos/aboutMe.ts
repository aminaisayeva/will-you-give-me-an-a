export interface PersonalInfo {
  name: string;
  title: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  bio: string;
  skills: {
    technical: string[];
    languages: string[];
    interests: string[];
  };
}

export const personalInfo: PersonalInfo = {
  name: "Amina Isayeva",
  title:
    "Software Engineer at Morgan Stanley | M.S. CS (ML & AI) Candidate, Columbia University",
  location: "New York, USA",
  email: "ai2464@columbia.edu",
  linkedin: "https://www.linkedin.com/in/aminaisayeva/",
  github: "https://github.com/aminaisayeva",
  bio: "Hi! I'm Amina - a Software Engineer at Morgan Stanley and incoming part-time M.S. Computer Science (Machine Learning & AI Track) student at Columbia University. I graduated from Columbia in May 2025 with a double major in Computer Science and Economics.",
  skills: {
    technical: [
      "Python",
      "Java",
      "C",
      "C++",
      "Swift",
      "TypeScript",
      "JavaScript",
      "HTML",
      "CSS",
      "React",
      "Angular",
      "Flask",
      "Firebase",
      "MySQL",
      "Git",
      "UNIX",
      "Linux",
      "Figma",
    ],
    languages: [
      "English (fluent)",
      "Russian (fluent)",
      "Azerbaijani (native)",
      "French (intermediate)",
      "Mandarin (beginner)",
    ],
    interests: [
      "education equity",
      "escape rooms",
      "sustainability",
      "linguistics",
      "AI/ML",
      "astronomy",
      "sudoku",
      "backgammon",
      "puzzles",
    ],
  },
};
