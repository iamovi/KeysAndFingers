export interface TextOption {
  id?: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'custom';
}

export const typingTexts: TextOption[] = [
  // ===== EASY (short, simple sentences, minimal punctuation) =====
  { id: 'e1', difficulty: 'easy', text: 'The quick brown fox jumps over the lazy dog near the river bank.' },
  { id: 'e2', difficulty: 'easy', text: 'A warm cup of coffee sits on the table beside an open book.' },
  { id: 'e3', difficulty: 'easy', text: 'She walked through the garden and picked a few red roses for the vase.' },
  { id: 'e4', difficulty: 'easy', text: 'The sun set behind the mountains painting the sky in shades of gold.' },
  { id: 'e5', difficulty: 'easy', text: 'He opened the door and let the cool breeze fill the room.' },
  { id: 'e6', difficulty: 'easy', text: 'The cat slept on the warm windowsill all afternoon long.' },
  { id: 'e7', difficulty: 'easy', text: 'A small bird landed on the fence and began to sing a happy tune.' },
  { id: 'e8', difficulty: 'easy', text: 'They packed their bags and drove to the beach for the weekend.' },
  { id: 'e9', difficulty: 'easy', text: 'The children played in the park until the stars came out at night.' },
  { id: 'e10', difficulty: 'easy', text: 'She smiled and waved as the train slowly pulled away from the station.' },
  { id: 'e11', difficulty: 'easy', text: 'He found a coin on the ground and put it in his pocket for luck.' },
  { id: 'e12', difficulty: 'easy', text: 'The rain stopped and a rainbow appeared across the sky.' },
  { id: 'e13', difficulty: 'easy', text: 'We sat by the fire and told stories until it was time for bed.' },
  { id: 'e14', difficulty: 'easy', text: 'The dog ran across the field chasing a bright yellow ball.' },
  { id: 'e15', difficulty: 'easy', text: 'She read the last page of the book and closed it with a sigh.' },
  { id: 'e16', difficulty: 'easy', text: 'A tall glass of cold water is the best thing on a hot summer day.' },
  { id: 'e17', difficulty: 'easy', text: 'He turned off the lights and went to sleep after a long day at work.' },
  { id: 'e18', difficulty: 'easy', text: 'The leaves on the trees turned red and orange as autumn arrived.' },
  { id: 'e19', difficulty: 'easy', text: 'She baked a cake for her friend and added candles on top.' },
  { id: 'e20', difficulty: 'easy', text: 'The moon was bright and full lighting up the quiet village below.' },
  { id: 'e21', difficulty: 'easy', text: 'He grabbed his jacket and walked out into the cool evening air.' },
  { id: 'e22', difficulty: 'easy', text: 'The flowers in the garden bloomed early this spring after the warm rain.' },
  { id: 'e23', difficulty: 'easy', text: 'She poured a glass of juice and sat down on the front porch.' },
  { id: 'e24', difficulty: 'easy', text: 'A gentle wind blew through the open window and moved the curtains.' },
  { id: 'e25', difficulty: 'easy', text: 'The bus arrived on time and they climbed aboard without a word.' },
  { id: 'e26', difficulty: 'easy', text: 'He placed the old photo on the shelf next to a small clock.' },
  { id: 'e27', difficulty: 'easy', text: 'The ice cream melted fast under the hot afternoon sun.' },
  { id: 'e28', difficulty: 'easy', text: 'She tied her shoes and ran down the path toward the lake.' },
  { id: 'e29', difficulty: 'easy', text: 'The teacher wrote the answer on the board for everyone to see.' },
  { id: 'e30', difficulty: 'easy', text: 'A frog jumped off the rock and splashed into the clear pond.' },
  { id: 'e31', difficulty: 'easy', text: 'He stacked the books neatly on the desk before leaving the room.' },
  { id: 'e32', difficulty: 'easy', text: 'The smell of fresh bread filled the kitchen early in the morning.' },
  { id: 'e33', difficulty: 'easy', text: 'She drew a picture of a tree with bright green leaves and a blue sky.' },
  { id: 'e34', difficulty: 'easy', text: 'The bell rang and the students rushed out of the classroom doors.' },
  { id: 'e35', difficulty: 'easy', text: 'He watched the clouds move slowly across the sky from his window.' },
  { id: 'e36', difficulty: 'easy', text: 'The kite flew high above the field on a windy Saturday afternoon.' },
  { id: 'e37', difficulty: 'easy', text: 'She placed a blanket on the grass and lay down under the stars.' },
  { id: 'e38', difficulty: 'easy', text: 'The puppy wagged its tail and jumped up to greet its owner.' },
  { id: 'e39', difficulty: 'easy', text: 'He finished his homework and went outside to ride his bike.' },
  { id: 'e40', difficulty: 'easy', text: 'The snow covered everything in white and the world felt peaceful and still.' },

  // ===== MEDIUM (longer, more varied vocabulary) =====
  { id: 'm1', difficulty: 'medium', text: 'Programming is not about typing fast; it is about thinking clearly and solving problems with elegant solutions that stand the test of time.' },
  { id: 'm2', difficulty: 'medium', text: 'The best way to predict the future is to invent it. Every great developer starts with curiosity, builds with persistence, and ships with confidence.' },
  { id: 'm3', difficulty: 'medium', text: 'In the world of software development, clean code is not a luxury but a necessity. It reduces bugs, improves readability, and makes collaboration seamless.' },
  { id: 'm4', difficulty: 'medium', text: 'Artificial intelligence is transforming how we interact with technology, from voice assistants to recommendation engines that learn our preferences over time.' },
  { id: 'm5', difficulty: 'medium', text: 'The ocean covers more than seventy percent of the Earth and contains mountain ranges, volcanoes, and trenches deeper than any canyon found on dry land.' },
  { id: 'm6', difficulty: 'medium', text: 'A good habit takes about two months to form according to research, but breaking a bad one can take significantly longer depending on the behavior and the individual.' },
  { id: 'm7', difficulty: 'medium', text: 'Reading books regularly not only expands your vocabulary and knowledge but also improves empathy by allowing you to experience the world through different perspectives.' },
  { id: 'm8', difficulty: 'medium', text: 'The human brain consumes roughly twenty percent of the body total energy despite making up only about two percent of its weight, making it one of the most demanding organs.' },
  { id: 'm9', difficulty: 'medium', text: 'Space exploration has led to countless inventions we use every day, including memory foam, scratch resistant lenses, water purification systems, and freeze dried food.' },
  { id: 'm10', difficulty: 'medium', text: 'Learning a musical instrument strengthens neural connections and improves memory, coordination, and mathematical ability, especially when started at a young age.' },
  { id: 'm11', difficulty: 'medium', text: 'Open source software powers most of the internet today. From Linux servers to web browsers, collaborative development has become the backbone of modern technology.' },
  { id: 'm12', difficulty: 'medium', text: 'The invention of the printing press in the fifteenth century revolutionized the spread of information and is considered one of the most important milestones in human history.' },
  { id: 'm13', difficulty: 'medium', text: 'Regular exercise has been shown to reduce anxiety, improve sleep quality, boost self esteem, and increase overall life expectancy by several years on average.' },
  { id: 'm14', difficulty: 'medium', text: 'Climate change is driven by greenhouse gas emissions from burning fossil fuels, deforestation, and industrial agriculture, leading to rising temperatures and extreme weather events.' },
  { id: 'm15', difficulty: 'medium', text: 'The concept of time zones was introduced in the late nineteenth century to standardize train schedules across vast distances, replacing the confusing system of local solar times.' },
  { id: 'm16', difficulty: 'medium', text: 'Effective communication requires active listening, clear articulation of ideas, and the ability to adapt your message to different audiences and contexts.' },
  { id: 'm17', difficulty: 'medium', text: 'Biodiversity is essential for ecosystem stability. The loss of even a single species can trigger a cascade of changes that affect entire food webs and habitats.' },
  { id: 'm18', difficulty: 'medium', text: 'The Renaissance period brought about a renewed interest in art, science, and philosophy, laying the groundwork for many of the cultural and intellectual traditions we value today.' },
  { id: 'm19', difficulty: 'medium', text: 'Version control systems like Git allow developers to track changes, collaborate on projects, and revert to previous versions of their code when something goes wrong.' },
  { id: 'm20', difficulty: 'medium', text: 'Photography evolved from large format cameras requiring minutes of exposure to pocket sized smartphones capable of capturing millions of pixels in a fraction of a second.' },
  { id: 'm21', difficulty: 'medium', text: 'The domestication of fire was one of the earliest turning points in human evolution, enabling cooking, warmth, protection from predators, and the formation of social communities.' },
  { id: 'm22', difficulty: 'medium', text: 'Modern architecture emphasizes function over form, using materials like steel, glass, and concrete to create structures that are both practical and visually striking.' },
  { id: 'm23', difficulty: 'medium', text: 'Sleep plays a critical role in memory consolidation, immune function, and emotional regulation. Most adults need between seven and nine hours of quality sleep each night.' },
  { id: 'm24', difficulty: 'medium', text: 'The invention of the compass transformed navigation by allowing sailors to determine direction regardless of weather conditions, enabling longer and more ambitious voyages.' },
  { id: 'm25', difficulty: 'medium', text: 'Coral reefs support nearly a quarter of all marine species despite covering less than one percent of the ocean floor, making them among the most diverse ecosystems on the planet.' },
  { id: 'm26', difficulty: 'medium', text: 'Writing tests for your code may seem like extra effort at first, but it saves significant time in the long run by catching bugs early and making refactoring safer.' },
  { id: 'm27', difficulty: 'medium', text: 'The ancient Egyptians developed one of the earliest writing systems known as hieroglyphics, which used pictorial symbols to represent words, sounds, and concepts.' },
  { id: 'm28', difficulty: 'medium', text: 'Electric vehicles are becoming increasingly popular as battery technology improves and charging infrastructure expands across cities and highways around the world.' },
  { id: 'm29', difficulty: 'medium', text: 'Meditation has been practiced for thousands of years and modern research confirms its benefits for reducing stress, improving focus, and promoting overall mental well being.' },
  { id: 'm30', difficulty: 'medium', text: 'The World Wide Web was invented by Tim Berners-Lee in 1989 while working at CERN, originally intended as a system for sharing research documents among scientists.' },
  { id: 'm31', difficulty: 'medium', text: 'Forests act as carbon sinks, absorbing billions of tons of carbon dioxide each year and playing a vital role in regulating the global climate and water cycle.' },
  { id: 'm32', difficulty: 'medium', text: 'Typography is both an art and a science. The right font choice can dramatically affect readability, user experience, and the overall tone of a design or publication.' },
  { id: 'm33', difficulty: 'medium', text: 'The discovery of penicillin by Alexander Fleming in 1928 marked the beginning of the antibiotic era, saving millions of lives from bacterial infections worldwide.' },
  { id: 'm34', difficulty: 'medium', text: 'Podcasts have emerged as one of the most popular forms of media, offering on demand content on virtually every topic imaginable to audiences across the globe.' },
  { id: 'm35', difficulty: 'medium', text: 'The human eye can distinguish approximately ten million different colors, yet our perception of color is influenced by lighting, context, and even cultural background.' },
  { id: 'm36', difficulty: 'medium', text: 'Remote work has reshaped the modern workplace, challenging traditional ideas about productivity, collaboration, and the physical boundaries of the office environment.' },
  { id: 'm37', difficulty: 'medium', text: 'Volcanic eruptions, while destructive, also create fertile soil and new landmasses. Some of the most productive agricultural regions sit on ancient volcanic deposits.' },
  { id: 'm38', difficulty: 'medium', text: 'Good user interface design is invisible. When done well, users accomplish their goals effortlessly without ever thinking about the interface they are interacting with.' },
  { id: 'm39', difficulty: 'medium', text: 'The periodic table organizes elements by atomic number and groups them by shared chemical properties, making it one of the most important tools in all of science.' },
  { id: 'm40', difficulty: 'medium', text: 'Journaling is a powerful habit that helps clarify thoughts, track personal growth, and process emotions. Even a few minutes a day can make a meaningful difference.' },

  // ===== HARD (long, complex punctuation, quotes, special chars) =====
  { id: 'h1', difficulty: 'hard', text: 'The "observer pattern" is a software design pattern in which an object, named the subject, maintains a list of its dependents — called observers — and notifies them automatically of any state changes (usually by calling one of their methods).' },
  { id: 'h2', difficulty: 'hard', text: 'According to Moore\'s Law, the number of transistors on a microchip doubles approximately every two years; however, this exponential growth is expected to slow down as we approach the physical limits of silicon-based semiconductors.' },
  { id: 'h3', difficulty: 'hard', text: 'TypeScript\'s type system supports: generics, union & intersection types, conditional types, mapped types, template literal types, and "satisfies" — making it one of the most expressive type systems in mainstream programming languages (as of 2024).' },
  { id: 'h4', difficulty: 'hard', text: 'In quantum computing, a qubit can exist in a "superposition" of states — both 0 and 1 simultaneously — until measured; this property, combined with entanglement, allows quantum computers to solve certain problems exponentially faster than classical machines.' },
  { id: 'h5', difficulty: 'hard', text: 'The TCP/IP model consists of four layers: (1) the link layer, which handles physical network connections; (2) the internet layer, responsible for routing; (3) the transport layer, ensuring reliable data transfer; and (4) the application layer, where protocols like HTTP & DNS operate.' },
  { id: 'h6', difficulty: 'hard', text: 'Friedrich Nietzsche wrote, "He who has a why to live for can bear almost any how." This existentialist perspective — emphasizing purpose over circumstance — has influenced psychology, philosophy, and literature for over a century.' },
  { id: 'h7', difficulty: 'hard', text: 'The Big-O notation describes the upper bound of an algorithm\'s time complexity: O(1) is constant, O(log n) is logarithmic, O(n) is linear, O(n log n) is linearithmic, O(n^2) is quadratic, and O(2^n) is exponential — each representing fundamentally different scalability characteristics.' },
  { id: 'h8', difficulty: 'hard', text: 'CRISPR-Cas9, a revolutionary gene-editing tool discovered in 2012, allows scientists to "cut and paste" DNA sequences with unprecedented precision; its applications range from curing genetic diseases (e.g., sickle cell anemia) to engineering drought-resistant crops.' },
  { id: 'h9', difficulty: 'hard', text: 'The Turing Test, proposed by Alan Turing in 1950, asks: "Can machines think?" If a human evaluator cannot reliably distinguish between a machine\'s responses and a human\'s during a natural-language conversation, the machine is said to have passed the test.' },
  { id: 'h10', difficulty: 'hard', text: 'In distributed systems, the CAP theorem (Brewer\'s theorem) states that it is impossible for a distributed data store to simultaneously guarantee all three of the following: consistency (C), availability (A), and partition tolerance (P); at most, two can be achieved.' },
  { id: 'h11', difficulty: 'hard', text: 'The HTTP/2 protocol introduces multiplexing — sending multiple requests & responses over a single TCP connection — along with header compression (HPACK), server push, and stream prioritization; these features collectively reduce latency by up to 50% compared to HTTP/1.1.' },
  { id: 'h12', difficulty: 'hard', text: 'Shakespeare\'s "To be, or not to be — that is the question: whether \'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them." This soliloquy from Hamlet (Act 3, Scene 1) remains one of the most quoted passages in English literature.' },
  { id: 'h13', difficulty: 'hard', text: 'Machine learning models are broadly categorized into: (a) supervised learning — training on labeled datasets (e.g., classification & regression); (b) unsupervised learning — finding hidden patterns without labels (e.g., clustering); and (c) reinforcement learning — where agents learn by maximizing cumulative rewards.' },
  { id: 'h14', difficulty: 'hard', text: 'The RSA algorithm (Rivest–Shamir–Adleman), published in 1977, relies on the computational difficulty of factoring large prime numbers; a typical RSA key is 2048–4096 bits long, and breaking it with classical computers would take billions of years — though quantum algorithms like Shor\'s could theoretically do it in polynomial time.' },
  { id: 'h15', difficulty: 'hard', text: 'Docker containers encapsulate an application\'s code, runtime, system tools, libraries, and settings into a single "image" that runs consistently across environments; combined with orchestration platforms (Kubernetes, Docker Swarm), they enable scalable, fault-tolerant microservice architectures.' },
  { id: 'h16', difficulty: 'hard', text: 'The Fibonacci sequence — 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89... — appears throughout nature: in the arrangement of sunflower seeds, the spiral of nautilus shells, and the branching of trees; its ratio converges to the "golden ratio" (approximately 1.6180339887).' },
  { id: 'h17', difficulty: 'hard', text: 'Regular expressions (regex) use special characters to define search patterns: "^" matches the start of a string, "$" matches the end, "." matches any character, "*" means zero or more, "+" means one or more, "?" means optional, and "[a-z]" defines a character class — making them invaluable for text processing & validation.' },
  { id: 'h18', difficulty: 'hard', text: 'The human genome contains approximately 3.2 billion base pairs (A, T, G, C) organized into 23 pairs of chromosomes; despite encoding only ~20,000 protein-coding genes, the genome\'s non-coding regions play crucial roles in gene regulation, epigenetics, and evolutionary adaptation.' },
  { id: 'h19', difficulty: 'hard', text: 'Event-driven architecture (EDA) decouples producers & consumers of events via a message broker (e.g., Apache Kafka, RabbitMQ); this pattern enables: real-time data streaming, asynchronous processing, eventual consistency, and horizontal scalability — making it ideal for high-throughput systems.' },
  { id: 'h20', difficulty: 'hard', text: 'Albert Einstein\'s equation E = mc² (energy equals mass times the speed of light squared) demonstrated that mass and energy are interchangeable; this insight — published in his 1905 paper "Does the Inertia of a Body Depend Upon Its Energy Content?" — laid the theoretical foundation for both nuclear energy and nuclear weapons.' },
  { id: 'h21', difficulty: 'hard', text: 'Functional programming treats computation as the evaluation of mathematical functions; key concepts include: immutability, pure functions (no side effects), higher-order functions, closures, currying, and monads — all of which encourage declarative, composable, and testable code.' },
  { id: 'h22', difficulty: 'hard', text: 'The Voyager 1 spacecraft, launched in 1977, is the most distant human-made object in space; as of 2024, it is over 15 billion miles from Earth — transmitting data at 160 bits per second via a 23-watt radio, taking over 22 hours for signals to reach us.' },
  { id: 'h23', difficulty: 'hard', text: 'WebAssembly (Wasm) is a binary instruction format designed as a portable compilation target for high-level languages like C, C++, Rust, and Go; it runs in the browser\'s virtual machine at near-native speed — enabling compute-intensive applications (e.g., games, video editing) on the web.' },
  { id: 'h24', difficulty: 'hard', text: 'The double-slit experiment demonstrates wave-particle duality: when photons or electrons are fired at two narrow slits, they create an interference pattern — as if each particle passes through both slits simultaneously — but observing which slit a particle goes through collapses the pattern entirely.' },
  { id: 'h25', difficulty: 'hard', text: 'OAuth 2.0 defines four grant types: (1) Authorization Code — used by server-side apps; (2) Implicit — for SPAs (now deprecated); (3) Client Credentials — for machine-to-machine communication; and (4) Resource Owner Password — where the user provides credentials directly (discouraged for security reasons).' },
  { id: 'h26', difficulty: 'hard', text: 'The Richter scale measures earthquake magnitude logarithmically: each whole number increase represents a tenfold increase in amplitude and roughly 31.6 times more energy; for example, a magnitude 7.0 earthquake releases about 1,000 times more energy than a magnitude 5.0 event.' },
  { id: 'h27', difficulty: 'hard', text: 'Graph databases (e.g., Neo4j, Amazon Neptune) store data as nodes & edges rather than rows & columns; they excel at traversing complex relationships — social networks, recommendation engines, fraud detection — where traditional relational joins become prohibitively expensive at scale.' },
  { id: 'h28', difficulty: 'hard', text: 'The Sapir-Whorf hypothesis proposes that the structure of a language influences its speakers\' cognition and worldview; while the "strong" version (linguistic determinism) is largely discredited, the "weak" version (linguistic relativity) — suggesting language shapes thought to some degree — has gained empirical support.' },
  { id: 'h29', difficulty: 'hard', text: 'Blockchain technology uses a distributed, append-only ledger secured by cryptographic hashes; each block contains: a timestamp, transaction data, the previous block\'s hash, and a nonce — making retroactive alteration computationally infeasible (requiring re-mining of all subsequent blocks).' },
  { id: 'h30', difficulty: 'hard', text: 'The James Webb Space Telescope (JWST), launched in December 2021, observes the universe in infrared wavelengths (0.6–28.3 μm) using a 6.5-meter primary mirror composed of 18 gold-coated beryllium segments — enabling it to detect light from galaxies formed just 200 million years after the Big Bang.' },
  { id: 'h31', difficulty: 'hard', text: 'CSS Grid Layout offers a two-dimensional system for complex web layouts: "grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));" creates a responsive grid without media queries — automatically adjusting the number of columns based on available viewport width.' },
  { id: 'h32', difficulty: 'hard', text: 'Neuroplasticity — the brain\'s ability to reorganize itself by forming new neural connections throughout life — challenges the old belief that the adult brain is "fixed"; research shows that learning new skills, physical exercise, and even meditation can measurably alter brain structure & function.' },
  { id: 'h33', difficulty: 'hard', text: 'The Heisenberg Uncertainty Principle states that it is fundamentally impossible to simultaneously know both the exact position (Δx) and exact momentum (Δp) of a particle: Δx · Δp ≥ ħ/2 — not due to measurement limitations, but as an intrinsic property of quantum mechanics itself.' },
  { id: 'h34', difficulty: 'hard', text: 'Microservices architecture decomposes an application into loosely coupled services — each with its own database, API, and deployment pipeline; while this enables independent scaling & team autonomy, it introduces challenges: distributed transactions, service discovery, circuit breaking, and "eventual consistency."' },
  { id: 'h35', difficulty: 'hard', text: 'The Rosetta Stone, discovered in 1799, contains a decree inscribed in three scripts — hieroglyphic, demotic, and ancient Greek — enabling Jean-François Champollion to decipher Egyptian hieroglyphs in 1822; this breakthrough unlocked millennia of previously unreadable Egyptian history & literature.' },
  { id: 'h36', difficulty: 'hard', text: 'Zero-knowledge proofs (ZKPs) allow one party to prove knowledge of a value (e.g., a password) without revealing the value itself; applications include: privacy-preserving authentication, anonymous voting systems, and blockchain scalability solutions like zk-rollups & zk-SNARKs.' },
  { id: 'h37', difficulty: 'hard', text: 'The Standard Model of particle physics describes 17 fundamental particles: 6 quarks (up, down, charm, strange, top, bottom), 6 leptons (electron, muon, tau + their neutrinos), 4 gauge bosons (photon, W±, Z⁰, gluon), and the Higgs boson — discovered at CERN in 2012.' },
  { id: 'h38', difficulty: 'hard', text: 'Compiler optimization techniques include: constant folding, dead code elimination, loop unrolling, inline expansion, register allocation, and tail-call optimization; modern compilers (GCC, LLVM/Clang) apply hundreds of such passes — often producing assembly code that outperforms hand-written equivalents.' },
  { id: 'h39', difficulty: 'hard', text: 'The theory of general relativity, published by Einstein in 1915, describes gravity not as a "force" but as the curvature of spacetime caused by mass & energy; its predictions — gravitational lensing, time dilation near massive objects, and gravitational waves — have all been experimentally confirmed.' },
  { id: 'h40', difficulty: 'hard', text: 'RNA interference (RNAi) is a biological process where small RNA molecules inhibit gene expression by destroying specific mRNA sequences; discovered in 1998 by Andrew Fire & Craig Mello (Nobel Prize, 2006), it has become an essential tool in genetics research and a promising therapeutic approach for diseases like cancer & viral infections.' },
];

let lastTextId: string | null = null;

export const getRandomText = (difficulty: 'easy' | 'medium' | 'hard'): TextOption => {
  const filtered = typingTexts.filter(t => t.difficulty === difficulty);
  if (filtered.length <= 1) return filtered[0];
  
  let candidate: TextOption;
  do {
    candidate = filtered[Math.floor(Math.random() * filtered.length)];
  } while (candidate.id === lastTextId);
  
  lastTextId = candidate.id;
  return candidate;
};

export const getTextCount = (difficulty: 'easy' | 'medium' | 'hard' | 'custom'): number => {
  if (difficulty === 'custom') return 0;
  return typingTexts.filter(t => t.difficulty === difficulty).length;
};
