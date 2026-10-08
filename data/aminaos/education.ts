export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string[];
  coursework?: string[];
  activities?: string[];
  note?: string;
}

export const education: Education[] = [
  {
    id: "columbia-ms",
    institution: "Columbia University",
    degree: "Master of Science",
    field: "Computer Science, Major in Machine Learning and Artificial Intelligence",
    location: "New York, USA",
    startDate: "Fall 2026",
    endDate: "May 2028",
    note: "Starting in Fall 2026 as a part-time student",
    coursework: [],
    activities: []
  },
  {
    id: "columbia-ba",
    institution: "Columbia University",
    degree: "Bachelor of Arts",
    field: "Double Major in Computer Science and Economics",
    location: "New York, USA",
    startDate: "Sep 2021",
    endDate: "May 2025",
    gpa: "3.8",
    honors: ["Dean's List"],
    coursework: [],
    activities: [
      "Teaching Assistant - Introduction to Computer Science (Jan 2024 - May 2024)",
      "President, Columbia Economics Society (Sep 2021 - Sep 2024)",
      "Director of Consulting, Columbia Economics Society (Apr 2022 - Apr 2023)",
      "Consulting Representative, Columbia Economics Society (Sep 2021 - Apr 2022)",
      "Operating Committee Leader, Columbia Organization of Rising Entrepreneurs (Sep 2022 - May 2024)",
      "Education Pillar - Mentorship Co-Lead, Application Development Initiative (Sep 2022 - May 2024)",
      "Impact Analyst, CUIIN (Sep 2022 - Feb 2024)",
      "Associate Consultant, Global Research and Consulting Group (Feb 2022 - Feb 2024)"
    ]
  }
];
