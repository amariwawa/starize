export type Contestant = {
  slug: string;
  name: string;
  category: string;
  image: string;
  shortBio: string;
  writeUp: string;
  auditionVideo: string;
  isQualified: boolean;
};

const DEFAULT_AUDITION_VIDEO = "https://www.youtube.com/embed/ysz5S6PUM-U";

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const baseContestants = [
  {
    name: "Rotimi-John Olufela",
    category: "Gratitude - Anendlessocean",
    image: "/images/contestants/Contestant pictures/Rotimi Olufela.jpg",
    shortBio:
      "Rotimi-John Olufela is a music student at OAU who treats music as both lifestyle and identity.",
    writeUp:
      "I am Rotimi-John Olufela, a music student at Obafemi Awolowo University. Music has always been a big part of who I am, not just something I do. Whether I am creating, performing, or exploring new sounds, I love turning ideas into melody and rhythm that people can feel and connect with.",
    isQualified: true,
  },

  {
    name: "Ayomide Babalola",
    category: "Amazing - Sunmisola Agbebi",
    image: "/images/contestants/Contestant pictures/Ayomide Babalola.jpg",
    shortBio:
      "Ayomide Babalola is an Economics Education graduate whose music journey started in children choir at age 12.",
    writeUp:
      "I am Babalola Ayomide, an Economics Education graduate from Obafemi Awolowo University and the firstborn in a family of five. My passion for God and singing started early. I joined children choir at age 12 and have served in groups like Harmony Music Group, Mass Worshippers, and NTMC. I am committed to learning, sharing, and inspiring.",
    isQualified: true,
  },

  {
    name: "Precious Ikechukwu",
    category: "Lovin' me - Jonathan McReynolds",
    image: "/images/contestants/Contestant pictures/Precious Ikechukwu.jpg",
    shortBio:
      "Precious Ikechukwu, a Broadcast Journalism student, sings to help others feel Christ's warmth and love.",
    writeUp:
      "I am Precious Ikechukwu, a Broadcast Journalism student at Obafemi Awolowo University. Singing is how I express what I feel and experience. Beyond expression, my goal is to help people encounter the warmth and love of Christ through every song. I see singing as a gift entrusted to me for others.",
    isQualified: true,
  },


  {
    name: "Success Iyayi",
    category: "My Help - Grace Charles",
    image: "/images/contestants/Contestant pictures/Iyayi success.jpg",
    shortBio:
      "Iyayi Success Joy is a microbiology student, singer, songwriter, and voice-over artist with a science future in view.",
    writeUp:
      "My name is Iyayi Success Joy, a Part 3 Microbiology student at Obafemi Awolowo University. I am a singer, songwriter, and voice-over artist, with a growing interest in becoming a food microbiologist. Music remains central to my creative identity and expression.",
    isQualified: true,
  },
  {
    name: "Gloria Adenike",
    category: "Omo'ba - Pelumi Deborah",
    image: "/images/contestants/Contestant pictures/Gloria.jpg",
    shortBio:
      "Gloria Adenike pursues music platforms that demand excellence and allow her to connect with souls.",
    writeUp:
      "I am Gloria Adenike, a student of Obafemi Awolowo University with a strong passion for music. I actively pursue opportunities that challenge me to grow in excellence and expand my impact. Through my sound, I aim to reach and connect with souls.",
    isQualified: true,
  },
  {
    name: "Boluwatife Waiye",
    category: "I Almost Let Go - Kurt Carr",
    image: "/images/contestants/Contestant pictures/Boluwatife Waiye.jpg",
    shortBio:
      "Waiye Boluwatife is a dedicated vocalist focused on growth, emotional expression, and performance excellence.",
    writeUp:
      "Waiye Boluwatife is a student of Obafemi Awolowo University and a passionate vocalist committed to growth, expression, and musical excellence. With a strong focus on vocal development and intentional performance, Boluwatife aims to connect deeply with audiences and communicate emotion through song.",
    isQualified: true,
  },
  {
    name: "Precious Chinaza Okafor",
    category: "Mercy Said No - CeCe Winans",
    image: "/images/contestants/Contestant pictures/Precious Okafor.jpg",
    shortBio:
      "Precious Chinaza Okafor calls music her second language and uses it to express, connect, and inspire.",
    writeUp:
      "My name is Precious Chinaza Okafor, a Microbiology graduate of OAU. Music has been part of me for as long as I can remember, from choir as a little girl to where I am now. It has become my second language for expressing emotions and connecting with something greater. Through singing, I hope to share something real and inspiring with everyone who listens.",
    isQualified: true,
  },



  {
    name: "Godswill Etete",
    category: "For Your Name Is Holy - Paul Wilbur",
    image: "/images/contestants/Contestant pictures/Godswill etete.jpg",
    shortBio:
      "Etete Godswill Akaninyene is a final-year Biology Education student, vocal coach, keyboardist, and songwriter.",
    writeUp:
      "My name is Etete Godswill Akaninyene, a final-year student of Biology Education in the Faculty of Education at Obafemi Awolowo University. I am first a lover of God, and also a vocal coach, keyboardist, and songwriter. I have been passionate about music for as long as I can remember, and singing and songwriting are key ways I express myself.",
    isQualified: true,
  },
  {
    name: "Layo",
    category: "You Say - Lauren Daigle",
    image: "/images/contestants/Contestant pictures/Layo.jpg",
    shortBio:
      "Layo draws inspiration from early exposure to music at home and a lifelong love for art and creativity.",
    writeUp:
      "I am Layo. I sing because music has always been part of my life. My mum sang a lot while I was growing up, and I spent years listening to R&B, blues, and old musicals. I also love art, including drawing and painting. Music and creativity have shaped who I am.",
    isQualified: true,
  },
  {
    name: "Adekoya Oluwanishola",
    category: "Believe For It - CeCe Winans",
    image: "/images/contestants/Contestant pictures/Oluwanishola Adekoya.jpg",
    shortBio:
      "Adekoya Oluwanishola joined to refine skill and pair anointing with excellence in ministry and artistry.",
    writeUp:
      "My name is Adekoya Oluwanishola, a Part 3 Nursing Science student at Obafemi Awolowo University. I deeply love singing and ministering to God's people. I believe anointing must be matched with excellence in craft. That is why I joined this platform: to learn, refine my voice, master my gift, and stay accountable to growth while blessing lives.",
    isQualified: true,
  },
  {
    name: "Eniola Busayo",
    category: "Holy Place - Grace Idowu",
    image: "/images/contestants/Contestant pictures/Eniola Busayo .jpg",
    shortBio:
      "Adebajo Busayo Eniola sees music as connection, structure, and the place where she feels most at home.",
    writeUp:
      "I am Adebajo Busayo Eniola, a Music student of Obafemi Awolowo University. Music has been woven into my life for as long as I can remember. To me, music is not just melody, it is connection. It shapes how I think, feel, and relate with others, and it is where I feel most at home.",
    isQualified: true,
  },

  {
    name: "Deborah Olaoye",
    category: "Alabaster Box - Kim Burrell",
    image: "/images/contestants/Contestant pictures/Deborah .jpg",
    shortBio:
      "Deborah Olaoye is a Business Administration student who describes music as healing and powerfully expressive.",
    writeUp:
      "My name is Deborah Olaoye, a student of Business Administration at UoPeople. I believe music is an explosive expression of beautiful sounds, and it carries healing. Music remains one of my strongest personal languages of expression.",
    isQualified: true,
  },

];

export const contestants: Contestant[] = baseContestants.map((contestant) => ({
  slug: toSlug(contestant.name),
  name: contestant.name,
  category: contestant.category,
  image: contestant.image,
  shortBio: contestant.shortBio,
  writeUp: contestant.writeUp,
  auditionVideo: DEFAULT_AUDITION_VIDEO,
  isQualified: !!(contestant as any).isQualified,
}));

export const getContestantBySlug = (slug: string) =>
  contestants.find((contestant) => contestant.slug === slug);
