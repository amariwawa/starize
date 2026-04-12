export type Contestant = {
  slug: string;
  name: string;
  category: string;
  image: string;
  shortBio: string;
  writeUp: string;
  auditionVideo: string;
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
  },
  {
    name: "Nisola",
    category: "Redeemer - Nicole C. Mullen",
    image: "/images/contestants/Contestant pictures/Bosewuoluwanisola.jpg",
    shortBio:
      "Bosewuoluwanisola (Nisola), a microbiology student at OAU, sees music as a language of the soul.",
    writeUp:
      "I am Bosewuoluwanisola, a microbiology student of Obafemi Awolowo University. Music is not just something I enjoy, it is part of who I am. It shapes my moods and moments, and every genre carries a message that speaks deeply to me. For me, music is felt, lived, and loved.",
  },
  {
    name: "Ayomide Babalola",
    category: "Amazing - Sunmisola Agbebi",
    image: "/images/contestants/Contestant pictures/Ayomide Babalola.jpg",
    shortBio:
      "Ayomide Babalola is an Economics Education graduate whose music journey started in children choir at age 12.",
    writeUp:
      "I am Babalola Ayomide, an Economics Education graduate from Obafemi Awolowo University and the firstborn in a family of five. My passion for God and singing started early. I joined children choir at age 12 and have served in groups like Harmony Music Group, Mass Worshippers, and NTMC. I am committed to learning, sharing, and inspiring.",
  },
  {
    name: "Ashola Matthew Ayomide",
    category: "Nazarene - Anendlessocean",
    image: "/images/contestants/Contestant pictures/Matthew Ayomide.jpg",
    shortBio:
      "Ashola Matthew Ayomide is a Part 2 Architecture student who has loved singing since childhood.",
    writeUp:
      "My name is Ashola Matthew Ayomide, a Part 2 Architecture student at Obafemi Awolowo University. Since I was little, I have always loved singing and listening to music. Music has helped shape my life, and I desire to make my voice heard around the world.",
  },
  {
    name: "Precious Ikechukwu",
    category: "Lovin' me - Jonathan McReynolds",
    image: "/images/contestants/Contestant pictures/Precious Ikechukwu.jpg",
    shortBio:
      "Precious Ikechukwu, a Broadcast Journalism student, sings to help others feel Christ's warmth and love.",
    writeUp:
      "I am Precious Ikechukwu, a Broadcast Journalism student at Obafemi Awolowo University. Singing is how I express what I feel and experience. Beyond expression, my goal is to help people encounter the warmth and love of Christ through every song. I see singing as a gift entrusted to me for others.",
  },
  {
    name: "Daniel Eyo",
    category: "All Glory - Sunmisola Agbebi",
    image: "/images/contestants/Contestant pictures/Daniel Eyo.jpg",
    shortBio:
      "Daniel Eyo is a Dramatic Arts student whose love for singing and composing began in primary school.",
    writeUp:
      "My name is Eyo Daniel, a Dramatic Arts student at Obafemi Awolowo University. Music has been my comfort and passion from a very young age. I discovered my talent for singing and composing early, and with support from my mum and friends, I have continued to grow with confidence.",
  },
  {
    name: "Bikom Helen",
    category: "So Will I - Hillsong United",
    image: "/images/contestants/Contestant pictures/Bikom Helen.jpg",
    shortBio:
      "Bikom Helen Jabi is an OAU student who finds deep fulfillment in singing and has now stepped into competition.",
    writeUp:
      "I am Bikom Helen Jabi, a student of Obafemi Awolowo University. I have loved music for as long as I can remember, and I have always taken every opportunity to sing. Singing brings me fulfillment, and I am excited to finally push myself by joining a competition like this.",
  },
  {
    name: "Success Iyayi",
    category: "My Help - Grace Charles",
    image: "/images/contestants/Contestant pictures/Iyayi success.jpg",
    shortBio:
      "Iyayi Success Joy is a microbiology student, singer, songwriter, and voice-over artist with a science future in view.",
    writeUp:
      "My name is Iyayi Success Joy, a Part 3 Microbiology student at Obafemi Awolowo University. I am a singer, songwriter, and voice-over artist, with a growing interest in becoming a food microbiologist. Music remains central to my creative identity and expression.",
  },
  {
    name: "Gloria Adenike",
    category: "Omo'ba - Pelumi Deborah",
    image: "/images/contestants/Contestant pictures/Gloria.jpg",
    shortBio:
      "Gloria Adenike pursues music platforms that demand excellence and allow her to connect with souls.",
    writeUp:
      "I am Gloria Adenike, a student of Obafemi Awolowo University with a strong passion for music. I actively pursue opportunities that challenge me to grow in excellence and expand my impact. Through my sound, I aim to reach and connect with souls.",
  },
  {
    name: "Boluwatife Waiye",
    category: "I Almost Let Go - Kurt Carr",
    image: "/images/contestants/Contestant pictures/Boluwatife Waiye.jpg",
    shortBio:
      "Waiye Boluwatife is a dedicated vocalist focused on growth, emotional expression, and performance excellence.",
    writeUp:
      "Waiye Boluwatife is a student of Obafemi Awolowo University and a passionate vocalist committed to growth, expression, and musical excellence. With a strong focus on vocal development and intentional performance, Boluwatife aims to connect deeply with audiences and communicate emotion through song.",
  },
  {
    name: "Precious Chinaza Okafor",
    category: "Mercy Said No - CeCe Winans",
    image: "/images/contestants/Contestant pictures/Precious Okafor.jpg",
    shortBio:
      "Precious Chinaza Okafor calls music her second language and uses it to express, connect, and inspire.",
    writeUp:
      "My name is Precious Chinaza Okafor, a Microbiology graduate of OAU. Music has been part of me for as long as I can remember, from choir as a little girl to where I am now. It has become my second language for expressing emotions and connecting with something greater. Through singing, I hope to share something real and inspiring with everyone who listens.",
  },
  {
    name: "Aina Olajumoke",
    category: "Rescue Story - Zach Williams",
    image: "/images/contestants/Contestant pictures/Aina Jumoke.jpg",
    shortBio:
      "Aina Olajumoke is a chemistry student and believer who embraces music as worship and lifestyle.",
    writeUp:
      "I am Aina Olajumoke, a Chemistry student of Obafemi Awolowo University. I am a believer and a passionate lover of music as both worship and lifestyle. I also explore shoemaking as a creative interest. Through this music journey, I am open to sharing my voice, growing, and connecting.",
  },
  {
    name: "Temiloluwa Aribatise",
    category: "What a Beautiful Name - Hillsong Worship",
    image: "/images/contestants/Contestant pictures/Temiloluwa .jpg",
    shortBio:
      "Temiloluwa Aribatise loves using music for joyful worship and is eager to grow through gospel competition.",
    writeUp:
      "I am Temiloluwa Aribatise, a student in the Faculty of Education at Obafemi Awolowo University. I have loved music for as long as I can remember, and singing brings me joy and fulfillment. It is one of my deepest ways of expression through worship, and I am excited to grow through this gospel competition experience.",
  },
  {
    name: "Owofadeju Mayowa",
    category: "You Are The Reason I Live - Chimdi Ochei",
    image: "/images/contestants/Contestant pictures/Mayowa.jpg",
    shortBio:
      "Owofadeju Mayowa, a 400-level OAU student, has loved singing from childhood and enjoys creating beautiful music.",
    writeUp:
      "I am Owofadeju Mayowa, a 400-level student of Obafemi Awolowo University. I have loved singing from a young age, and I am grateful for the people God has used to support my passion. I enjoy listening to beautiful music and even more, contributing to the creation of it.",
  },
  {
    name: "Godswill Etete",
    category: "For Your Name Is Holy - Paul Wilbur",
    image: "/images/contestants/Contestant pictures/Godswill etete.jpg",
    shortBio:
      "Etete Godswill Akaninyene is a final-year Biology Education student, vocal coach, keyboardist, and songwriter.",
    writeUp:
      "My name is Etete Godswill Akaninyene, a final-year student of Biology Education in the Faculty of Education at Obafemi Awolowo University. I am first a lover of God, and also a vocal coach, keyboardist, and songwriter. I have been passionate about music for as long as I can remember, and singing and songwriting are key ways I express myself.",
  },
  {
    name: "Layo",
    category: "You Say - Lauren Daigle",
    image: "/images/contestants/Contestant pictures/Layo.jpg",
    shortBio:
      "Layo draws inspiration from early exposure to music at home and a lifelong love for art and creativity.",
    writeUp:
      "I am Layo. I sing because music has always been part of my life. My mum sang a lot while I was growing up, and I spent years listening to R&B, blues, and old musicals. I also love art, including drawing and painting. Music and creativity have shaped who I am.",
  },
  {
    name: "Adekoya Oluwanishola",
    category: "Believe For It - CeCe Winans",
    image: "/images/contestants/Contestant pictures/Oluwanishola Adekoya.jpg",
    shortBio:
      "Adekoya Oluwanishola joined to refine skill and pair anointing with excellence in ministry and artistry.",
    writeUp:
      "My name is Adekoya Oluwanishola, a Part 3 Nursing Science student at Obafemi Awolowo University. I deeply love singing and ministering to God's people. I believe anointing must be matched with excellence in craft. That is why I joined this platform: to learn, refine my voice, master my gift, and stay accountable to growth while blessing lives.",
  },
  {
    name: "Eniola Busayo",
    category: "Holy Place - Grace Idowu",
    image: "/images/contestants/Contestant pictures/Eniola Busayo .jpg",
    shortBio:
      "Adebajo Busayo Eniola sees music as connection, structure, and the place where she feels most at home.",
    writeUp:
      "I am Adebajo Busayo Eniola, a Music student of Obafemi Awolowo University. Music has been woven into my life for as long as I can remember. To me, music is not just melody, it is connection. It shapes how I think, feel, and relate with others, and it is where I feel most at home.",
  },
  {
    name: "Olaniyi Precious",
    category: "No Fear - Madison Ryann Ward",
    image: "/images/contestants/Contestant pictures/Olaniyi Precious.jpg",
    shortBio:
      "Olaniyi Precious is a passionate singer and music student committed to growth and vocal depth.",
    writeUp:
      "I am Olaniyi Precious, a passionate singer and music student with deep love for vocal expression. Music has shaped my journey and given me confidence to express emotion with depth. This competition is an opportunity for me to challenge myself, grow, and share my voice with a wider audience.",
  },
  {
    name: "Deborah Olaoye",
    category: "Alabaster Box - Kim Burrell",
    image: "/images/contestants/Contestant pictures/Deborah .jpg",
    shortBio:
      "Deborah Olaoye is a Business Administration student who describes music as healing and powerfully expressive.",
    writeUp:
      "My name is Deborah Olaoye, a student of Business Administration at UoPeople. I believe music is an explosive expression of beautiful sounds, and it carries healing. Music remains one of my strongest personal languages of expression.",
  },
  {
    name: "Olutoki Oyinkansola",
    category: "Yahweh Will Manifest Himself - Oasis Ministry",
    image: "/images/contestants/Contestant pictures/Oyinkansola .jpg",
    shortBio:
      "Olutoki Oyinkansola uses singing, songwriting, and creativity to worship and express her God-given purpose.",
    writeUp:
      "I am Olutoki Oyinkansola, currently studying International Relations at Obafemi Awolowo University. I love Jesus, and I love singing, songwriting, fashion, and creative expression. My walk with God has helped me discover my calling and purpose: to worship Him through music.",
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
}));

export const getContestantBySlug = (slug: string) =>
  contestants.find((contestant) => contestant.slug === slug);
