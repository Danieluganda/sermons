import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const dataDir = process.env.DATA_DIR || __dirname;

console.log("Server starting...");
const dbPath = process.env.DB_PATH || path.join(dataDir, "notes.db");
const db = new Database(dbPath);
console.log("Database connected at", dbPath);

const googleClientId = process.env.GOOGLE_CLIENT_ID;
if (!googleClientId) {
  console.warn("WARNING: GOOGLE_CLIENT_ID is not set. Google Auth will fail.");
}
const googleClient = new OAuth2Client(googleClientId);
// Shared Notes API
app.get('/api/shared-notes', (req, res) => {
  const notes = db.prepare('SELECT * FROM shared_notes ORDER BY created_at DESC').all();
  res.json(notes);
});

app.post('/api/shared-notes', (req, res) => {
  const { title, scripture, content, date, author } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing fields' });
  const stmt = db.prepare('INSERT INTO shared_notes (title, scripture, content, date, author) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(title, scripture, content, date, author || 'Anonymous');
  res.json({ success: true, id: info.lastInsertRowid });
});

// Comments API
app.get('/api/shared-notes/:id/comments', (req, res) => {
  const noteId = req.params.id;
  const comments = db.prepare('SELECT * FROM comments WHERE note_id = ? ORDER BY created_at ASC').all(noteId);
  res.json(comments);
});

app.post('/api/shared-notes/:id/comments', (req, res) => {
  const noteId = req.params.id;
  const { author, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing comment text' });
  const stmt = db.prepare('INSERT INTO comments (note_id, author, text) VALUES (?, ?, ?)');
  const info = stmt.run(noteId, author || 'Anonymous', text);
  res.json({ success: true, id: info.lastInsertRowid });
});

// Shared Notes API
app.get('/api/shared-notes', (req, res) => {
  const notes = db.prepare('SELECT * FROM shared_notes ORDER BY created_at DESC').all();
  res.json(notes);
});

app.post('/api/shared-notes', (req, res) => {
  const { title, scripture, content, date, author } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing fields' });
  const stmt = db.prepare('INSERT INTO shared_notes (title, scripture, content, date, author) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(title, scripture, content, date, author || 'Anonymous');
  res.json({ success: true, id: info.lastInsertRowid });
});

// Comments API
app.get('/api/shared-notes/:id/comments', (req, res) => {
  const noteId = req.params.id;
  const comments = db.prepare('SELECT * FROM comments WHERE note_id = ? ORDER BY created_at ASC').all(noteId);
  res.json(comments);
});

app.post('/api/shared-notes/:id/comments', (req, res) => {
  const noteId = req.params.id;
  const { author, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing comment text' });
  const stmt = db.prepare('INSERT INTO comments (note_id, author, text) VALUES (?, ?, ?)');
  const info = stmt.run(noteId, author || 'Anonymous', text);
  res.json({ success: true, id: info.lastInsertRowid });
});


// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    scripture TEXT,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    tags TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS revelations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'audio', 'video', 'image'
    url TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
  );
`);

// Migration: Ensure category column exists in notes table
// Migration: Ensure category and tags columns exist in notes table
try {
  db.prepare("ALTER TABLE notes ADD COLUMN category TEXT DEFAULT 'General'").run();
  console.log("Added category column to notes table.");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error:", err.message);
  }
}
try {
  db.prepare("ALTER TABLE notes ADD COLUMN tags TEXT DEFAULT ''").run();
  console.log("Added tags column to notes table.");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error:", err.message);
  }
}

const INITIAL_SERMONS = [
  {
    title: "AP. GRACE LUBEGA SUNDAY SERVICE (382) 8/3/2026",
    scripture: "Leviticus 26.10-13 KJV",
    date: "2026-03-08",
    category: "Sunday Service",
    content: `THE GREAT CONNECTION: RECONCILING THE TWO TESTAMENTS

📖 Anchor Scripture: Leviticus 26.10-13 KJV💥
[10] And ye shall eat old store, and bring forth the old because of the new. [11] And I will set my tabernacle among you: and my soul shall not abhor you. [12] And I will walk among you, and will be your God, and ye shall be my people. [13] I am the LORD your God, which brought you forth out of the land of Egypt, that ye should not be their bondmen; and I have broken the bands of your yoke, and made you go upright

🎀We live in a disposable culture and we are bound to dispose of the old because of the new and it is not wrong to want the new because it is our natural disposition.

📖 Scripture: Acts 17.21 KJV- It is natural for us to want the new. 

🌹Unfortunately, many Christians apply this logic to the Bible and because of that we miss what God wants to get into our spirits. Some of us discard certain scriptures because we have read them too often, yet we end up missing the revelation of the moment. 

🎀Opening your inner ear is key to hearing what is not said but is deliberately implied. This is the only way wisdom can grow in you (Psalms 62.11). The inner ear hears differently from the physical ear. 

🌹Sometimes the way of instruction can bore you if you think you already know what is being told to you. However, only God knows and examines our hearts for how much we have received or understood. 

🎀The way we are supposed to relate to truth is supposed to be different from the way normal men respond to the things of this world (2 Timothy 3.16). It is easy to assume that you know yet you do not carry a revelation of what is being taught to you.

🌹Some of us have completely disconnected from the Old Testament wisdom which shouldn't be so. However, we also have a generation which is stuck in the Old Testament. Then we have another larger percentage of Christendom that does not appreciate the importance of knowing the word. 

🎀God comes to our level so that we would go to him and not to make us complacent in the low level we are in thus we should not settle for just relatable teachings. 

📖 Scripture: Daniel 11.23 KJV- This is the knowledge of God beyond the hand that blesses. Philippians 1.9-10 tells us that in expression of our love for God, we should find the love for learning about the expression of his judgment beyond his provisions. Loving God only by what He has given makes us transactional. 

🌹Without understanding this truth, we shall struggle to live in the liberties of the spirit. We need to find the reconciliation of the old and the new. If we stay old, we become legalistic and if we stay only in the new only we become anti-nomian.

💭How to become legalistic?
📖 Scripture: Hebrews 7.28 KJV- The law produced men who have weaknesses. These priests are limited by human weakness. 

🎀Positioning is also important; take for instance a sick man positioned either after the death and resurrection of Jesus or before the cross. In one pespective he is in the right position for healing and in another he is limited because he is positioned wrong. 

📖 Scripture: Ephesians 1.18 KJV- Ministry growth is a knowledge issue. Proverbs 11.9 teaches us that the just shall be delivered by knowledge.

📖 Scripture: 2 Peter 1.1 KJV- If you do not understand the righteousness of God, faith will not work through you. The price to pay to grow men in the understanding of what they can do in God is in teaching knowledge. 

💥This kind of message is for; 
🔸️For seekers who are hungry to learn the word.
🔸️Those in trouble; to see the plan of God from ages past to now
🔸️Those who struggle to see Jesus in the Old Testament. 

🌹There has to be a balance between the Old and the New. Failure to understand the foundation of grace from the old, you will live an irresponsible life. We need to see how the Old and New come together which in turn will tame us as believers. 

📖 Scripture: Colossians 2.16-17 NKJV- This is a powerful revelation; God has given us the key to how to read the Bible. The Old which was food, drink, festivals, moin and Sabbath was used to judge men in the Old was actually a shadow of Christ. 

 🎀 Paul gave us the reconciliation of the Old and New; the Old Testament is the shadow of the New but whose substance (material) is Christ. 

🌹Every part written in the Old Testament portrays the person of Christ. Understanding this will help you to fall in love with the bible. 

📖 Scripture: Genesis 22.8 NKJV- The lamb here is a shadow of Jesus who was to come (John 1.29). 

📖 Scripture: Genesis 4.25-26 NKJV- Seth was a replacement of the purposes of true worship that Cain tried to kill. Abel was an expression of the spirit of true worship. In verse 26, God continues to show what the birth of Seth revived by his son Enoch.

💭How many things that are happening now are perhaps a shadow of what will happen in the future? 

🎀Some of the things unravelling out of you are deeper and older than you because perhaps they are connected to something from the old. 

📖 Scripture: Exodus 12.13 NKJV- The passover lamb in the Old was a shadow of the sacrifice of the Son of God (1 Corinthians 5.7).

📖 Scripture: John 6.23 NKJV- Manna which they thought fell from heaven wasn't really from heaven but the heavenlies. Jesus was the only true bread of life from heaven. 

🌹John 6.35 tells also us that the bread that they ate wouldn't give them everlasting life but he could. This teaches us that there are people who dwell in a dimension of fullness and they minister in a place of overflow thus they can never run out. 

🎀We dwell in a realm of endless provision. Men in this kind of dimension can not run out (1 Corinthians 2.10). We carry the one with bottomless things. 

📖 Scripture: Proverbs 4.18 MSG- The path of the just shines brighter and brighter unto a perfect day.

📖 Scripture: 1 John 4.17 KJV- As He is so are we in this world. 

📖 Scripture: Matthew 6.11 KJV- The daily bread was Him not food. 

📖 Scripture: 1 Corinthians 6.19 NKJV- Your body is the temple of the Holy Ghost and men now look unto you for help. 

📖 Scripture: Ecclesiastes 5.9 AMP- The king is served by the field and he is an advantage to the field. 

📖 Scripture: Isaiah 60.16 NLT- Men will seek to advance what is upon you. Powerful kings will satisfy your every need. 

📖 Scripture: Matthew 5.17 NKJV- Jesus did not come to destroy the law but to fulfil it; we should fulfil the law even our teachings. 

📖 Scripture: Galatians 3.24 KJV- The law was a school master that led us to Christ. This doesn't make the school master bad. The law is important in the foundation of who we are and we will never understand grace until we understand the law. 

📖 Scripture: John 1.17 KJV- There is a reason why Moses came before Christ. Romans 3.19 tells us that the law was to bring us before God as guilty so that we can appreciate Grace. 

📖 Scripture: Leviticus 26.10 KJV- You must understand the law and bring forth the old because of the New. The Old can only be brought forth because of the New. 

📖 Scripture: Matthew 13.52 KJV- We begin with the New to learn of the Old. This is a balanced Christian. 

🔥🔥🔥HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "MEN GATHER SEASON IX WITH AP. GRACE LUBEGA: THE AKEDAH PRINCIPLE",
    scripture: "Genesis 22:1-2 NKJV",
    date: "2026-03-09",
    category: "Men Gather",
    content: `THE AKEDAH PRINCIPLE 

📖 Anchor Scripture: Genesis 22:1-2 NKJV
[1] Now it came to pass after these things that God tested Abraham, and said to him, “Abraham!” And he said, “Here I am.” [2] Then He said, “Take now your son, your only son Isaac, whom you love, and go to the land of Moriah, and offer him there as a burnt offering on one of the mountains of which I shall tell you.”

🎯This is a secret that will change our lives forever. The reason why most men are stuck, regressed, and frustrated in life is that they fail to apply it. This principle will change our lives out of any turmoil.

📖 Scripture: Genesis 22.1 NKJV- "Tested" here is "nâsâh" which means to prove, refine or reveal what is already latent. When God is talking about testing here it is not like the one in James 1.2-4. This testing is a process one has to go through to be refined and the end goal is to reveal what is latent.

💥Nothing Latent in a man can find manifestation without a test. 

📖 Scripture: Romans 4.13 KJV- Abraham had to go through a process to reveal the greatness inside Him for the Great call of God on his life.

🎀Without being tested, that latent power can not be manifested. Many men are walking on earth with a lot of potential and gifts which are not manifested because they were not tested and the ones who failed the test.

🎯Abraham never had children before his old age until God gave him a son, Isaac, whom he dearly loved. When God calls him in verse 1, Abraham says "here I am", "Hineni", which shows the surrendered nature of his spirit. This was a broken heart that was willing to go wherever God sent him.

📖 Scripture: Isaiah 6.8 NKJV- Isaiah too responded similarly to the call. 

🎀If Abraham had never come with an attitude of surrender, God would not have asked him to sacrifice his son. Thus God tells him to take Isaac to Moriah to offer him as a burnt offering. 

📖 Scripture: Genesis 22.2 NKJV- "Moriah" here means "chosen-by-God". God was telling him to get what he loved most and take it to where God chose. 

🎯It is natural for a man to protect whatever he loves and to put certain boundaries in protecting that thing. God knew if Abraham took what he loved to where he desired he would put limitations and boundaries to protect it so he told him to take it to where He wanted.

🎀God tells Abraham to take his beloved son to where He chose. This is consecration because if he did not do this, what was latent in him would never manifest. God was looking for Abraham's heart. 

📖 Scripture: Genesis 12.2-3 NKJV-When God first met Abraham the first instruction He gave him was to leave his homeland. God then addressed strength (the blessing) where his weakness (childlessness) was. 

🎯God can not put on you what is not already latent in you. God has never sent a word to a man when He knows it is not in that man to perform. 

📖 Scripture: Genesis 15.2 NKJV- God was not thinking about a seed but for nations. God placed a demand where Abraham placed his desire.

📖 Scripture: 2 Samuel 24.16-24 NKJV- Moriah was not a mistake. There was a cost to pay for David to get the land of Moriah. 2 Chronicles 3.1 shows us that later Solomon also built the temple at Moriah. Thus Moriah carried great significance. 

📖 Scripture: Genesis 22.5 NKJV- Abraham knew that the territory he was going to was only for men with a covenant and not slaves. 

📖 Scripture: Genesis 22.8 NKJV- God will provide Himself THE LAMB for a burnt offering. This understanding was born out of a certain experience; it was more than faith but something innate in Abraham which was the latent power. That latent power in him could never manifest until God told Him to put his son on the altar for sacrifice. 

💥The Akedah principle💥
🎀This looks at the thing inside that binds men. What binds you? This binding is not bondage; it is a liberty that binds you.

🎯Akedah is a place which binds you to obey God; it causes something inside you that you might not understand but is a work of God in you. 

🎀Sometimes it conflicts with God's instructions but is aligned with God's redemptive purposes. The redemptive purposes of God were designed not to kill Isaac even if Abraham believed otherwise.

🎯Abraham believed that Isaac was going to die but innate in him was a knowing that God would provide Himself a lamb. This understanding would never have got out if God had never forced him out of His comfort zone. This required Abraham to go where God needed him.

📖 Scripture: Genesis 22.9-11 NKJV- Abraham was absolutely ready to sacrifice his son. He was totally yielded to the will of God.  He turned to the angel with the willingness to slay the boy with the thought that perhaps there would be a deeper instruction on how to kill his son. 

📖 Scripture: Genesis 22.12-13 NKJV- This is how God knows that you fear Him. 

🎀God is looking for men who are bound to sacrifice anything and everything from wherever God chooses. 

📖 Scripture: Genesis 22.14 NKJV- This is God's favourite coordinate.  When you do not see provision, there is a misalignment between what you love that God is testing you with and where it is situated. In the Mount where He is situated, there is always provision. 

🎯Very few of us are surrendered enough to consecrate everything we have to God. This is why it is important to ask God what to do. Many of us ask God to bless what we have already chosen and not to choose for us.

🎀Most times we are invited so much by desire and we are seduced by lust to what we see working in others without understanding the sacrifice. There is a difference between a man in whose ministry God makes the choices and another where the man still makes the choices. 

🎯At the mountain where God chooses is where He provides. God's redemptive purposes are sometimes confused with our inefficiency and rebellion against the sacrifices required by Grace. It is not about the lamb that God will provide but about our hearts.

🎀Many men are not fully surrendered. To many, their God is transactional because the heart is not yet right as it ought to be. This means that we defile what is latent. 

🎯Many will die with frustrated potential because they failed to do what they should have done because of rebellion. 

🎀When you understand this, you will be amazed by how much God has given to those in Moriah. 

💭What binds you?

🔥🔥🔥 HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "MEN GATHER SEASON IX WITH PR. POJU OYEMADE",
    scripture: "1 Timothy 2.1-8 KJV",
    date: "2026-03-09",
    category: "Men Gather",
    content: `The 5 Ps on which this teaching is premised;
🔸️ Man as a priest
🔸️Man as a prophet
🔸️Man as a protector
🔸️Man as a provider
🔸️Man as a promoter

🎯Priesthood- God has assigned men to spiritually lead in their immediate environment; to take responsibility for the spiritual well-being of those connected to them. 

🎀This is done by offering to God spiritual sacrifices on behalf of those connected to them for God's program to come to pass in their lives.

📖 Scripture: 1Timothy 2.1-8 KJV-  Paul in verse 8 becomes gender specific to define the assignment of men in the church. Paul emphasised that men must pray.

🎯Like Paul commanded women to pray, he also commanded men to pray with a certain state of mind. Paul knew that most men approach prayer with anger and doubt in their hearts. He teaches that men must lead in the prayer realm. 

📖 Scripture: 1 Timothy 2.13 KJV- Men must lead first and then women follow the pattern. Global statistics show an approximate 45 to 55 per cent ratio of men to women in the service of the Lord. Men must rise in the service of the Lord.

💥God wants men to carry His word inside His kingdom.

📖 Scripture: Exodus 17.9-11 KJV- The first kind of service is not visible to everyone but it determines the outcome on the field. Everyone who will be successful like Moses must have men who are not visible but are lifting up their hands to support the visible one.

🎀Paul calls men to take up the work of lifting up holy hands to God so that those connected to them start to progress because of their sacrifice. God wants men involved in this work. 

📖 Scripture: Deuteronomy 16.16 KJV- This was an instruction of the assignment given to men. 

🎯Paul calls men to lift up Holy hands without anger; anger is a spirit highly attached to the male species. Ephesians 6.4 also calls parents not to stir their children to anger. It is believed that men easily bottle up anger mostly because they believe that life has been unfair to them. 

🎀This is because male children are normally raised as the ones with a privileged status which makes them grow with a sense of entitlement which catches up with them when things do not go their way.

📖 Scripture: James 4.3 KJV- The reason why men feel wronged in life because they have not mastered the art of going to God in prayer to ask God. 

📖 Scripture: Psalm 34.10 KJV- It is easy for men to depend on their own strength and end up lacking and hungry. Men must learn to ask God and to depend on Him.

📖 Scripture: Matthew 7.14 KJV- Narrow is the way that leads to life and few find it. The way of the transgressor is hard yet wide and many find it. You must find the way of life. 

🎯There is no reason to carry anger but you just need to find the easy path of life. Men must understand that they have a role to their families, friends and society. 

📖 Scripture: Matthew 23.11 KJV- Men must serve God. They have to stand as priests for their immediate family. Men ought to intercede for their friends and not to compete with them (Job 42.10). 

🎀Men ought to take spiritual responsibility for the spiritual atmosphere in the Church (Matthew 6.6). Those who can make intercession will elevate in to the prophetic.

🎯The first assignment you have as a man is to lift up holy hands for others. Let go of resentment and anger. Those who stand to pray for the church they are under are the ones who catch the spirit of that church. 

💥Take responsibility for the spiritual climate and environment in which you live. 

📖 Scripture: Exodus 4.23 KJV- Pharaoh had to let the Israelites go because he knew the death of their firstborn sons was the beginning of destruction for their lineage. God acknowledged Israel as his son so that the son would serve him. Our sonship will only be realised fully when we enter into service. 

📖 Scripture: Luke 4.3 KJV- Jesus refused to be driven by his needs but by the needs of others. This is why he fed the 5000. All our resources in Christ will only start being visible when we start taking up assignments that look invisible but yet help other people.

🎀When you start to serve, the resources of God will be open to you. It is a service that gives answers to all your problems. Never let the condition of your life become a reason to not serve God. 

🎯Be a promoter; every man is called to reproduce himself. Understand personal leadership; you can't lead others when you can't lead yourself  (Proverbs 16.23). In whatever field you are in you must become the top 1% in that field. Become an expert in a field; mastery is key. After you become a master, become a promoter.

🎀Jesus too reproduced himself in others. Our futures are hinged on how many people we have reproduced. Become a promoter; do not hoard knowledge and skill. 

🎯Be a prophet; a prophet is not a speaker but a seer. When the prophets speak, he is saying what He saw that others couldn't see. Prophets see what others can't. 

🎀When you serve in the church, your reward goes beyond the church. You will find your gifts producing fruit beyond the walls of the church. 

📖 Scripture: Hebrews 11.27 KJV- To be a seer in a realm, you must first be an intercessor. 

📖 Scripture: Ezekiel 13.2-6 KJV- The only people who will become seers are the ones who will stand in the gap. This is where we should stand as Christians; we must gain mastery in the priesthood. 

🎯Do everything you do with the whole of your heart. As you continue to do, you start to become the master of your field (Isaiah 53.12). 

🔥🔥🔥 HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "PR. POJU OYEMADE THURSDAY SERVICE (572) 5/3/2026",
    scripture: "1 Peter 1.23 KJV",
    date: "2026-03-05",
    category: "Thursday Service",
    content: `THE LIFE OF GOD AND THE MIND OF MAN

📖Anchor Scripture: 1 Peter 1.23 KJV💥
[23] being born again, not of corruptible seed, but of incorruptible, by the word of God, which liveth and abideth for ever. 

🌹When we were born again, we were begotten not of corruptible seed but of incorruptible seed which is the Word of God.

📖 Scripture: James 1:18 KJV- [18] Of his own will begat he us with the word of truth, that we should be a kind of firstfruits of his creatures.

🎀We are the first specimen of His new creation. In 2 Peter, God talks about the destruction of the earth, where a new heaven and a new earth will emerge. The only part of this creation that will survive to the next dispensation will be those who are born again. 

📖 Scripture: 1 Corinthians 15.37-39 KJV- To every single seed, God gives it a body as it has pleased Him. He looks at the seed and gives it a body that is suitable for its life. Take for instance, a monkey can not function effectively in the body of a horse.

🌹The physical body we have now was not designed for the seed inside us now; the body that can house that seed is like the one Jesus had after resurrection which lives supernaturally. We carry a supernatural life limited inside this human body.

📖 Scripture: 1 Corinthians 15.45-47 KJV-Adam was the first man but Jesus came as the second Adam and ended His race. When Jesus was raised a second man emerged. Jesus was sent as the last Adam. 

🎀Our God is one of mercy and justice; He shows justice so that his mercy will not be violated. 

📖 Scripture: Romans 3.24-26 KJV- God can not justify us without creating room to pay the price so that we are justified freely before Him. 

📖 Scripture: 2 Corinthians 5.21 KJV- Christ has reconciled us back to God. 

🌹The body we live in was designed for the old life not the new life. Only born-again believers have the new life that is for the age of the life to come. 

🎀We can not demonstrate the new life without looking strange to the people of this world. However, the soul in us is still inclined to the way of life of the old man. 

📖 Scripture: John 1.4-5 KJV- The results we carry in this life originate from the life of God in us.

📖 Scripture: Romans 7.24-25/8.1-2 KJV- Paul discovered a law, the law of the Spirit of life, which would neutralise the destructions of the body. 

📖 Scripture: Romans 8.23/ Ephesians 1.13-14 KJV- The Holy Spirit is within us today, neutralising the limitations of the life of God so that we can begin to experience the supernatural life while in this human body. 

📖 Scripture: Romans 8.11 KJV- The Holy Spirit helps us to find expression in this body. 

📖 Scripture: Romans 12.2 KJV- We should not be conformed to this world.

🌹Every evil act originates from an evil thought in the mind of a man. If a thought is never entertained, it can never be expressed through your body. To do great things, allow your mind to host great thoughts. 

🎀The narrow way that leads to life is easy, it is only hard to find. It is the way of the transgressors that is hard to walk on but easy to find. All breakthroughs should be a product of the Christian mind. 

📖 Scripture: John 1.5 NKJV- This kind of light produces things. 

📖 Scripture: Colossians 1.10 KJV- Whatever doesn't affect your walk and makes you productive is not of the light. 

🌹God put his life inside us so that it can have expression. 

📖 Scripture: Romans 12.2 KJV- "Transformed" here is "Metaphorsis"; the life in a caterpillar and butterfly is the same but it is their form which changes. 

📖 Scripture: Genesis 4.17 KJV- When God answers prayers, it is not situations that change, it is us who change. 

📖 Scripture: Proverbs 4.23 KJV- What you see in your life is not necessarily God's will but the state of your heart. When we pray, God causes His peace that surpasses mere knowledge to fill your heart and by the entrance of this in your heart, then transformation happens. 

📖 Scripture: Matthew 5.16 KJV/Mark 4.11 KJV- We are doing things that the men of this world step away from. The person in contact with that light thinks differently. 

🔥DON'T FOCUS ON DESTROYING THE OLD, FOCUS ON BUILDING THE NEW

🎀Jesus demonstrated His own new light by redeeming mankind, He never sought the death or defeat of the Pharisees. 

📖 Scripture: Acts 12.14-15 KJV- Rhoda would have come in with Peter so that the evidence speaks for itself. No one argues with prosperity once it has evident results. 

🌹The light that Jesus had is the expression of the life of God in us. 

💥There is a principle governing impact; say less to maximise impact. 

🎀It was the nature of Jesus to do miracles not a product of prayer and fasting. Jesus carried that light; which gives understanding of what to do. To translate this light, meditation is key. Through meditation, we learn what to do. 

📖 Scripture: Ephesians 1.13-18 KJV- We can no longer be mentally lazy as Christians; we must do a search. 

🌹When we approach God in prayer for our future, He first gives us hope. You can not receive supernatural guidance on things that are not your assignment. 

🔥Stay in the lane of your assignment. 

🎀God will always first show you the hope of His calling on your life; where He opens your eyes to what you are supposed to do so that you do not run in another's lane.

🌹Then second He will show is the riches of His glorious inheritance in Christ. Romans 11.33 and Ephesians 3.8 describe these riches which are wisdom to know what to do. Here you start doing God's work in God's way. 

🎀After that you are endowed with the power to execute your assignment. The law of the new creature is that you can't do what you will but what God wills. 

📖 Scripture: John 1.13 KJV- God will not back the will of your flesh. 

🔥🔥🔥HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "AP. GRACE LUBEGA SUNDAY SERVICE (381) 1/3/2026",
    scripture: "Romans 12.2 NKJV",
    date: "2026-03-01",
    category: "Sunday Service",
    content: `UNDERSTANDING THE GOOD, ACCEPTABLE AND PERFECT WILL OF GOD

📖Anchor Scripture: Romans 12.2 NKJV💥
[2] And do not be conformed to this world, but be transformed by the renewing of your mind, that you may prove what that good and acceptable and perfect will of God.

🎀This is a truth many of us hear but do not apply to because we are familiar with this scripture. 

💥Two points of emphasis💥 
🌹There are two words in this scripture that are important to note; 
🔸️Conformed which means that a believer can be conformed to this world (Ephesians 4.17 to 18 tells us that it is possible to walk like the Gentiles). Conforming here is "suschēmatizō" which means having the same form as and similar to the world. 

📖 Scripture: Romans 12.2 AMP- You are not supposed to be like the world even in the smallest things. 

🔸️The other word is the reconciling bridge to what we must be which is transformation i.e. "metamorphoo". We grow in stages and learn in phases; we mature through stages by how quickly we progress through the phases. Your spiritual life is composed of stages, each with its own phases. 

📖 Scripture: 2 Corinthians 13.5 NKJV- This calls us to have a true estimate of where we are as Christians. It is easy to carry a wrong estimate of yourself and avoid expending yourself in levels whose maturity you do not carry.

📖 Scripture: Psalm 131.1 NKJV- The psalmist recognises that there is a process to spiritual maturity. Even marriage requires a certain level of maturity to stay married (Matthew 19.11). 

📖 Scripture: 1 Timothy 3.6 NKJV- It is easy to confuse gifting for maturity  

🎀Transformation shows us that some stages are more active than others like the adult stage of a butterfly's life cycle and the eggs. 

🌹This transformation must be handled with wisdom and we must examine ourselves to see how we are progressing in transformation. Transformation comes from the renewal of the mind. 

📖 Scripture: Romans 12.2 ESV- Transformation deals with inner wisdom which doesn't impose laws on men but by growth that constrains men at will (Isaiah 29.13). The ESV puts emphasis on "by testing you may discern what the will of God is, what is good and acceptable and perfect". 

🎀The will of God is singular but by the progressive aspects of your life, you start moving through the different stages of this singular will. 

🌹God's will is absolute and final but the true examination then is where we are according to this will. This mirror is on where we are, not where God is. It spells the stages of your individual life of transformation in salvation. 

📝Sermon Recommendation: The Lessons from Judas Iscariot.

💥The dynamics of the will of God💥
🎀The preceptive will of God- what God intends to do. Take for instance, 1 Timothy 2.4 assures us that God desires all men to be saved. God desired salvation for Judas too but he took advantage of his betrayal to establish divine will. This is why Jesus washed Judas' feet also. 

📖 Scripture: Romans 12.2 NKJV- To understand the work of grace and the finished work of Christ we should study the book of Romans. 

💥The triad of the will of God💥
🎯The Good will of God. 
➡️Here we talk about two aspects
🔸️God is Good
🔸️God does Good

📖 Scripture: Psalms 34.8 NKJV- The Lord is Good and this goodness is tied to his benevolence; His natural act of wishing the best for others. 

📖 Scripture: Psalm 119.68 NKJV- God is good and He does good.

📖 Scripture: Matthew 7.7-11 NKJV- It is impossible to believe this scripture if one is not convinced of how God loves them. 

🌹This is the realm where faith grows. If you are not convinced of how much love God has for you you will struggle to believe (Galatians 5.6). Verse 11 shows us that God gives us good things. A very good number of Christians have not matured to how good God is and how much God loves them. 

🔥NOTHING WORKS AGAINST YOU

📖 Scripture: 2 Corinthians 4.18 NKJV- What do you see? 

📖 Scripture: James 1.17 NKJV- Every good and perfect gift comes from above and it comes from the FATHER of lights. We are those lights. 

📖 Scripture: Romans 8.28 NKJV- All things work together for your good. 

🔥GOD IS GOOD

🎀This is the dimension where we understand the redemptive power of God. He reveals things to you to redeem you. 

📖 Scripture: 1 Timothy 2.4 NKJV- Salvation extends to all the things that must be redeemed in that journey. 

🎯The Acceptable Will of God.
🌹"Acceptable" in the Greek is "dokimazō" which means well pleasing to God and it is a stage that deals with transitioning from "knowing" to "doing" in a way that aligns with the heart of God. It is a response to Grace; it is a place of sacrifice. 

📖 Scripture: Genesis 8.20-21 NKJV- This is a level of response to what God has done in a man's life. Men's character is aligned with the character of God because they understand what has been done in Christ. At this stage, your desires and life style harmonises to the character of God (2 Corinthians 5.9). 

📖 Scripture: Romans 12.14-21 NKJV- You must overcome evil with good; don't stay neutral (Jeremiah 17.10 KJV).

📖 Scripture: Hebrews 13.20-21 ESV- God equips you to do His will; men are not good people, God is the one who works through us (Philippians 2.6-7).

🎯The Perfect Will of God.
🎀From the Greek is "teleios" which means complete, mature and meeting its flawless end. Here you go beyond doing good to seeking to know the purpose of God in your life and your assignment; to know why you do the things you do. 

🌹People in this stage want to know what God has called them for and want to do everything that God wants for them. 

💭WHAT IS YOUR END?

🎀When you get to this process you start to come from the end to the beginning. This sets clear milestones for your ministry.

📖 Scripture: Matthew 5.48 NKJV- Therefore you shall be perfect, just as your Father in heaven is perfect.

📖 Scripture: Colossians 4.12 NKJV- Epaphras prayed that they would see the end and the purpose for what it is. 

📖 Scripture: 1 Corinthians 9.16 KJV- There are men whom necessity is laid upon to preach the gospel. Such men live at the end. 

🌹This is the dimension of mature judgement; you start to see things with such a unique eye of maturity (Phillipians 1.9-10). Here you learn to see things right because you see things right. 

📖 Scripture: Colossians 1.28 NKJV- This is the mandate of the church especially for the apostolic. 

📖 Scripture: 1 Corinthians 2.6 NKJV- The wisdom of this age has an expiration date but to the mature, he gives what is consistent and has no expiry date. When you are established in the perfect will whatever is built on you lasts.

💭Have you matured to a place where everything about you is tagged to the purposes of God?

📖 Scripture: Ephesians 3.19 NKJV/AMP- This is the realm that opens the fullness of God. This is a place for surrendered men. Everything men do here is in His name, for His glory. This is a place where impartation happens. This is a place for a man fully yielded and integrated with God; every step of their way is ordered by Him. They look at the end of things. 

🔥🔥🔥 HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "PHANEROO DEVOTION: UNDERSTANDING THE JUDGMENTS OF GOD",
    scripture: "Philippians 1:9 KJV",
    date: "2026-03-01",
    category: "Devotion",
    content: `PHANEROO MINISTRIES INTERNATIONAL DEVOTION
Sunday, 1st March 2026
Apostle Grace Lubega
 
UNDERSTANDING THE JUDGMENTS OF GOD

📖Anchor Scripture: Philippians 1:9 KJV💥
“And this I pray, that your love may abound yet more and more in knowledge and in all judgment.”

When many people think about the judgments of God, they often imagine doom, misfortune, or punishment falling upon those who have gone astray. In their minds, judgment is synonymous with condemnation and disaster only. However, this understanding is incomplete.

To truly understand God’s judgments, we must first understand His heart. God’s judgments are not merely about punishment; they are about setting things right and enforcing what is fair and aligned with His will on the earth.

When Jesus encountered the woman who had suffered from a bleeding condition for twelve years (Luke 13:11–16), He did not see a hopeless case. He saw a daughter of Abraham who was bound by an affliction that had no right to torment her. When He healed her, He was executing judgment—He was declaring that her suffering was unlawful under God’s covenant and bringing her back into divine order.

This same principle applies to us today.

When you speak against an addiction that has gripped your child and declare freedom because God promised to preserve your children—that is judgment. When you command a downward spiral in your marriage to stop because Scripture says what God has joined together, no one can separate—that is judgment. 

Here are some practical steps on how to execute God’s judgment in your life.

1. Understand God’s Will Through His Word: You cannot judge rightly without knowing what God has declared in His Word. Spend time in Scripture to understand His promises and covenant rights.

2. Speak with Authority: Job 22:28 says, “You will also declare a thing, and it will be established for you.” Declare God’s Word boldly over the situation. Speak as one enforcing heaven’s verdict.

3. Act in Faith: Your words must be backed by faith. Refuse to retreat into fear or doubt after you have declared God’s judgment.

4. Be Consistent: Continue standing on the Word. Do not allow circumstances to intimidate you into silence or change your confession.

God’s judgments are at work whenever you face a situation that contradicts His Word and you command it to align with His divine purpose. Hallelujah!

*FURTHER STUDY:* Job 22:28; Luke 13:11–16
 
*GOLDEN NUGGET:* God’s judgments are at work whenever you face a situation that contradicts His Word and you command it to align with His divine purpose.
 
*PRAYER:* Loving Father, I thank You for this Word. Thank You for the power and authority You have placed on my lips. By that power, I judge circumstances and situations that do not align with Your will. I bring into order what the enemy has misaligned and correct the course of events for Your glory. In Jesus’ name, Amen.


bit.ly/TheMysteryOfConsecration
*#PhanerooDevotion📜*`
  },
  {
    title: "AP. GRACE LUBEGA THURSDAY SERVICE (570) 19/2/2026",
    scripture: "Isaiah: 53.11-12 NKJV",
    date: "2026-02-19",
    category: "Thursday Service",
    content: `THE SATISFACTION OF THE SOUL

📖Anchor Scripture: Isaiah: 53.11-12 NKJV💥
[11] He shall see the labor of His soul, and be satisfied. By His knowledge My righteous Servant shall justify many, For He shall bear their iniquities. [12] Therefore I will divide Him a portion with the great, And He shall divide the spoil with the strong, Because He poured out His soul unto death, And He was numbered with the transgressors; And He bore the sin of many, And made intercession for the transgressors.

🌹The labor of the soul of Jesus was the price He paid for our redemption. The satisfaction of His soul is the result of that labor—the justification of many.

📖 Scripture: Hebrews 12:2 NKJV- For the joy that was set before Him, He endured the cross. That joy was you and me.

🎀When we understand the labor of His soul, we begin to understand the value He placed on us. He didn't just die for us; He poured out His soul unto death.

🌹Satisfaction is a state of fullness and contentment. When God is satisfied with the labor of His soul, it means the work is complete and the results are guaranteed.

📖 Scripture: John 19:30 NKJV- "It is finished." The labor was over, and the satisfaction began.

🎀Because He poured out His soul, He was given a portion with the great and divided the spoil with the strong. This is the inheritance we share in Christ.

🌹We are the spoil of His victory. We are the ones He justified by His knowledge.

📖 Scripture: Romans 5:1 NKJV- Therefore, having been justified by faith, we have peace with God through our Lord Jesus Christ.

🎀The satisfaction of the soul of Jesus is our peace and our justification. When we walk in this truth, we no longer live under condemnation or guilt.

🌹He bore our iniquities so that we wouldn't have to. He made intercession for us so that we could be reconciled to the Father.

📖 Scripture: Hebrews 7:25 NKJV- He always lives to make intercession for them.

🎀The work of intercession continues because His satisfaction is ongoing. Every time a soul is saved, every time a believer grows in knowledge, the soul of Jesus is satisfied.

🌹We should live our lives in a way that satisfies His soul. Our growth, our obedience, and our love for Him are the fruits of His labor.

🔥🔥🔥HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "PRAYER EVENING 3 WITH AP. GRACE LUBEGA 6/02/2026",
    scripture: "Romans 8.26 NKJV",
    date: "2026-02-06",
    category: "Prayer Evening",
    content: `THE SPIRIT OF INTERCESSION

📖Anchor Scripture: Romans 8.26 NKJV💥
[26] Likewise the Spirit also helps in our weaknesses. For we do not know what we should pray for as we ought, but the Spirit Himself makes intercession for us with groanings which cannot be uttered.

🌹Prayer is not just a mental exercise; it is a spiritual engagement. The Holy Spirit is our helper in prayer, especially when we don't know how to pray.

📖 Scripture: Jude 1:20 NKJV- Building yourselves up on your most holy faith, praying in the Holy Spirit.

🎀Intercession is standing in the gap for others. It is a selfless act of love that moves the hand of God.

🌹The "groanings which cannot be uttered" are deep spiritual expressions that go beyond human language. They are the Spirit's way of communicating the perfect will of God.

📖 Scripture: Romans 8:27 NKJV- He who searches the hearts knows what the mind of the Spirit is, because He makes intercession for the saints according to the will of God.

🎀When we yield to the Spirit in prayer, we are aligned with the perfect will of God. This is where breakthroughs happen.

🌹Intercession is a responsibility for every believer. We are called to be a kingdom of priests (1 Peter 2:9).

📖 Scripture: Ezekiel 22:30 NKJV- "So I sought for a man among them who would make a wall, and stand in the gap before Me on behalf of the land..."

🎀God is looking for intercessors. He is looking for those who will take the needs of others to His throne.

🌹The power of intercession is seen in the life of Jesus. He is our great Intercessor.

📖 Scripture: Hebrews 7:25 NKJV- He is also able to save to the uttermost those who come to God through Him, since He always lives to make intercession for them.

🎀As we grow in the spirit of intercession, we become more like Jesus. We begin to see people and situations through His eyes.

🌹Prayer changes things, but intercession changes people. It softens hearts and opens doors that were previously shut.

🔥🔥🔥HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "AP. GRACE LUBEGA THURSDAY SERVICE (568) 5/2/2026",
    scripture: "Proverbs 13.22 AMP",
    date: "2026-02-05",
    category: "Thursday Service",
    content: `THE WEALTH OF THE SINNER

📖Anchor Scripture: Proverbs 13.22 AMP💥
[22] A good man leaves an inheritance [of moral stability and goodness] to his children's children, and the wealth of the sinner [finds its way eventually] into the hands of the righteous, for whom it was laid up.

🌹This is a divine law of wealth transfer. The wealth of the world is ultimately for the purposes of God's kingdom.

📖 Scripture: Isaiah 60:5 NKJV- The abundance of the sea shall be turned to you, the wealth of the Gentiles shall come to you.

🎀God wants His people to be well-resourced so that they can fulfill their divine assignments. Wealth is a tool for the gospel.

🌹The wealth of the sinner is "laid up" for the righteous. This means it is being preserved and accumulated until the right time for transfer.

📖 Scripture: Ecclesiastes 2:26 NKJV- To the sinner He gives the work of gathering and collecting, that he may give to him who is good before God.

🎀The transfer of wealth is not just about money; it's about influence and resources that can be used for God's glory.

🌹To receive this wealth, we must be "good before God." This means walking in righteousness and being faithful stewards.

📖 Scripture: Matthew 25:21 NKJV- "Well done, good and faithful servant; you were faithful over a few things, I will make you ruler over many things."

🎀Faithfulness is the key to multiplication. If we are faithful with the little we have, God will trust us with more.

🌹We must also have a kingdom perspective on wealth. It's not for selfish gain, but for the advancement of God's purposes.

📖 Scripture: Haggai 2:8 NKJV- "The silver is Mine, and the gold is Mine," says the LORD of hosts.

🎀When we align our hearts with God's heart, He can trust us with His resources. We become channels of His blessing to the world.

🌹Expect the wealth transfer in your life. Position yourself through righteousness, faithfulness, and a kingdom mindset.

🔥🔥🔥HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "AP. GRACE LUBEGA SUNDAY SERVICE (377) 1/2/2026",
    scripture: "Genesis 2.1-3 NKJV",
    date: "2026-02-01",
    category: "Sunday Service",
    content: `THE PRINCIPLE OF REST

📖Anchor Scripture: Genesis 2.1-3 NKJV💥
[1] Thus the heavens and the earth, and all the host of them, were finished. [2] And on the seventh day God ended His work which He had done, and He rested on the seventh day from all His work which He had done. [3] Then God blessed the seventh day and sanctified it, because in it He rested from all His work which God had created and made.

🌹Rest is not just the absence of activity; it is a spiritual state of completion and trust in God.

📖 Scripture: Hebrews 4:9-10 NKJV- There remains therefore a rest for the people of God. For he who has entered His rest has himself also ceased from his works as God did from His.

🎀Entering God's rest means trusting that the work is finished. In Christ, the work of our redemption and provision is complete.

🌹God blessed the seventh day and sanctified it. Rest is a blessed and holy state.

📖 Scripture: Exodus 33:14 NKJV- "My Presence will go with you, and I will give you rest."

🎀Rest is found in the presence of God. When we dwell in His presence, we find peace and assurance.

🌹The world is full of toil and struggle, but the believer is called to live from a place of rest.

📖 Scripture: Matthew 11:28 NKJV- "Come to Me, all you who labor and are heavy laden, and I will give you rest."

🎀Jesus is our rest. When we come to Him, He takes our burdens and gives us His peace.

🌹Resting in God allows Him to work on our behalf. When we stop striving in our own strength, His power is made perfect in our weakness.

📖 Scripture: Psalm 46:10 NKJV- "Be still, and know that I am God."

🎀In the stillness and rest, we gain the knowledge of God's sovereignty and power.

🌹Make rest a priority in your spiritual life. Cease from your own works and enter into the finished work of Christ.

🔥🔥🔥HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "AP. GRACE LUBEGA THURSDAY SERVICE (567) 29/1/2026",
    scripture: "Luke 22.31-34 NKJV",
    date: "2026-01-29",
    category: "Thursday Service",
    content: `THE SIFTING OF PETER

📖Anchor Scripture: Luke 22.31-34 NKJV💥
[31] And the Lord said, “Simon, Simon! Indeed, Satan has asked for you, that he may sift you as wheat. [32] But I have prayed for you, that your faith should not fail; and when you have returned to Me, strengthen your brethren.” [33] But he said to Him, “Lord, I am ready to go with You, both to prison and to death.” [34] Then He said, “I tell you, Peter, the rooster shall not crow this day before you will deny three times that you know Me.”

🌹Sifting is a process of separation. Satan wanted to sift Peter to destroy his faith and his destiny.

📖 Scripture: 1 Peter 5:8 NKJV- Be sober, be vigilant; because your adversary the devil walks about like a roaring lion, seeking whom he may devour.

🎀The enemy targets those with great callings. Peter was a key leader in the early church, and Satan wanted to stop him before he started.

🌹But Jesus prayed for Peter. The intercession of Jesus is what sustained Peter through his failure.

📖 Scripture: Hebrews 7:25 NKJV- He always lives to make intercession for them.

🎀Even when we fail, Jesus is interceding for us. His prayer is that our faith would not fail.

🌹Peter's failure was not the end of his story. Jesus told him, "when you have returned to Me, strengthen your brethren."

📖 Scripture: John 21:15-17 NKJV- Jesus restored Peter and reaffirmed his calling to feed His sheep.

🎀Our failures can become the foundation for our future ministry. Through failure, we learn humility and the depth of God's grace.

🌹Peter's overconfidence ("I am ready to go with You... to death") was part of what needed to be sifted. He needed to learn to depend on God's strength, not his own.

📖 Scripture: 2 Corinthians 12:9 NKJV- "My grace is sufficient for you, for My strength is made perfect in weakness."

🎀The sifting process, though painful, produces a stronger and more refined faith.

🌹If you are going through a season of sifting, remember that Jesus is praying for you. Your faith will not fail, and you will come out stronger to help others.

🔥🔥🔥HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "THE CHARACTER OF THE ANOINTED - PR. FRANCIS MAYINJA",
    scripture: "Psalm 139.14 KJV",
    date: "2026-02-15",
    category: "Inter School Conference",
    content: `🌟🌟THE INTER SCHOOL CONFERENCE 2026🌟🌟

THE CHARACTER OF THE ANOINTED 

🎙Ministering: Pastor Francis Mayinja

🎀We are fearfully and wonderfully made in the image of God; we are extraordinary because God does not make junk. We were all made for a purpose on the earth.

💥What to keep in mind as you grow💥
🌹You are Special; fearfully and wonderfully made

📖 Scripture: Psalm 139.14 KJV- Refuse to be defined by the opinions of men. 

🎀The greatest enemy you have is you. You are what God has made you to be not what you are told you are. The challenges you face as an individual mostly arise from your own being like emotions and feelings. 

📖 Scripture: 2 Timothy 1.7 NKJV- The Lord has given us the power to control what we have; our bodies. In Christ, we have self-control. 

🌹You must resist the things that take control of your body that are not in line with who you are. These entail among others; 
🔸️The ungodly desire of the opposite sex
🔸️Pornography 
🔸️Drug abuse
🔸️Masturbation 

🎀The Lord gave us the body but we can only gain control of it once we surrender our lives to the Lordship of Jesus. 

🌹It is by the Holy Spirit that we have the power to control our bodily desires. This implies that we have to first give our lives to Jesus as our personal Lord and Saviour. 

💥How then do we access the Spirit💥 
📖 Scripture: 1 Thessalonians 1.3 KJV- Paul emphasises the need for love, faith and hope. By hope, we can project our lives towards what we hope to become. Hope tames us to live lives that lead us to where we desire ourselves to be.

🔥OUR HOPE MUST LEAD US TO CHRIST

📖 Scripture: 1 Corinthians 10.31 NKJV- You have to bring everything you are back to God. This leads us to accountability. Find people who can guide you in the Lord and speak into your life. Accountability requires honesty.

🔥LEARN TO WRITE DOWN WHAT IS WORTHY

🎀Learn to memorise the scriptures that are in line with who you are in Christ. With these, you will gain an understanding of how to resist sin.

🌹Start to project that life you want for yourself and make wise decisions that can help you achieve that.

🎀Learnt to value fellowship with others; refuse to let social media replace interaction with others. 

🔥FLEE FROM TEMPTATIONS; IF YOU RESIST THE DEVIL, HE WILL FLEE

🔥🔥🔥 HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "THE ARCHITECT OF YOUR IDENTITY - MAMA NICOLETTE LUBEGA",
    scripture: "Psalms 139:13-16 NKJV",
    date: "2026-02-16",
    category: "Inter School Conference",
    content: `🌟🌟THE INTER SCHOOL CONFERENCE 2026🌟🌟

 THE ARCHITECT OF YOUR IDENTITY 

🎙Ministering: Mama Nicolette Lubega

📖 Anchor Scripture: Psalms 139:13-16 NKJV💥
[13] For You formed my inward parts; You covered me in my mother’s womb. [14] I will praise You, for I am fearfully and wonderfully made; Marvelous are Your works, And that my soul knows very well. [15] My frame was not hidden from You, When I was made in secret, And skillfully wrought in the lowest parts of the earth. [16] Your eyes saw my substance, being yet unformed. And in Your book they all were written, The days fashioned for me, When as yet there were none of them.

📖 Scripture: Psalms 139:13-16 MSG💥
[13-16] Oh yes, you shaped me first inside, then out; you formed me in my mother’s womb. I thank you, High God—you’re breathtaking! Body and soul, I am marvelously made! I worship in adoration—what a creation! You know me inside and out, you know every bone in my body; You know exactly how I was made, bit by bit, how I was sculpted from nothing into something. Like an open book, you watched me grow from conception to birth; all the stages of my life were spread out before you, The days of my life all prepared before I’d even lived one day.

🎀We live in a world with so much personal branding and social media filters. However, in the midst of all this, who are you?

🌹Most children feel like they are under a certain number of architects like social media. Beyond all these things the world is asking you to be, fix your focus away from the performances to the God design.

🎀These performances can be tiring because you are trying to live to please those around you. These also breed pride in you as you try to make it on your own. However, remember that you are not a self-made project but a handcrafted masterpiece. 

💥Pillars of divine design💥 
🎯The distinctiveness of design 
YOU ARE SPECIAL AND DISTINCT 

📖 Scripture: Psalm 139:13 ESV
[13] For you formed my inward parts; you knitted me together in my mother’s womb.

📝"Knit" here in Hebrew is "saw-kak" and it looks at a weaver making a piece, piece by piece. Those weaknesses in you are the specific threads God used to make you distinct. Even in our weaknesses, God's strength is made perfect (2 Corinthians 12:9).

🎯The purpose of the design 
🌹Many of us struggle to differentiate between what God has called us to be versus the structural graffiti the world has painted on us. 

📖 Scripture: Ephesians 2.10 AMP- We are God's handiwork (poiēma) meaning that we are like a poem written by a master poet. 

🎀The world will spray labels of anxiety and depression, but that graffiti doesn't change the structure of who you are; it just hides it. We have to seek the blueprint (purpose) of why we were created.

🎯Only God's opinion and word matter on that design 
📖 Scripture: Matthew 7.24-25 NKJV- Every building is as good as the ground it stands on. If your identity is built on the things of this world, you are building on sand which will eventually fall. If your identity is built on a rock and what Jesus says about you, you are unshakable. 

🌹The storm will come but then you will not be moved and shaken because your foundation is secure.

💥Golden Nuggets💥
🔸️You are distinct, you are special
🔸️You were made for a purpose
🔸️Only God's opinion about you matters.

🔥🔥🔥 HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "THE PRAYER OF EVERY WITNESS - AP. GRACE LUBEGA",
    scripture: "Acts 4:28-31 NKJV",
    date: "2026-02-17",
    category: "Inter School Conference",
    content: `🌟🌟THE INTER SCHOOL CONFERENCE 2026🌟🌟

THE PRAYER OF EVERY WITNESS

🎙Ministering: Apostle Grace Lubega. 

📖 Anchor Scripture: Acts 4:28-31 NKJV💥
[28] to do whatever Your hand and Your purpose determined before to be done. [29] Now, Lord, look on their threats, and grant to Your servants that with all boldness they may speak Your word, [30] by stretching out Your hand to heal, and that signs and wonders may be done through the name of Your holy Servant Jesus.” [31] And when they had prayed, the place where they were assembled together was shaken; and they were all filled with the Holy Spirit, and they spoke the word of God with boldness.

🎀From our Anchor Scripture, Jesus Christ had ascended to glory, and He left his disciples a mandate to preach the gospel to the ends of the earth, which they did as instructed. Later on, the world they were in was disturbed by their miracles and teachings.

🌹The Pharisees and fellow religious men took it upon themselves to stop this move. Many of those disciples were arrested, and some, like Stephen, were killed. 

🎀Acts 4 shows us an account of the disciples led by Peter and John locking themselves up in a room to pray because of the fear they had.

📖 Scripture: Acts 4.28-31 NKJV- They never prayed for revenge or justification against their enemies but they instead prayed for boldness to continue preaching the gospel.

🌹When we become Christians, we are called to be witnesses. This means that you are called to give testimony of this God that you have believed in. 

🎀We live in a world built around safety; everything is intended to keep us safe. We value safety above significance. 

🌹Many of us love comfortable Christianity. When you are safe enough, you become comfortable, yet the devil is not comfortable. Comfort is the graveyard of any man's calling.

🎀Many of us are believers in Jesus but not many of us make bold declarations to those who do not know God to win them over.

🌹We are in a generation where children are keeping up with so much, including drugs, homosexuality, sexual abuse, etc. The attacks now are way bigger than the generations before. 

🎀The challenge we have is that, although many of us are Christians, many of us have not taken the step to be witnesses. 

💭 Self-reflection: How many people have you won to Christ so far?

🌹This year of the power of salvation is the year that the world must know that you are a Christian. Salvation can not be made manifest when you are not a witness of Jesus Christ; God wants to use you to change this world. You must be a witness to the gospel.

🎀You must take it upon yourself to win souls to Christ. There is a level of wisdom that must sit on a man or woman for them to win souls.

📖 Scripture: Proverbs 11.30 NKJV- He who wins souls is wise. If you want to please God, win souls.

🌹Winning souls does not mean that they might not accept when you speak; however, even when they do, they have not rejected you but Christ. 

📖 Scripture: Luke 10.2 NKJV- The harvest is plentiful but the labourers are few; heaven is counting on you. Men who are not born again are a harvest not seeds. Never doubt that the Holy Spirit is inside you, and he has the power to convict men of Himself. 

🎀We live in a generation of consumerism where people only approach God to get things. However, it is also important to know the things God wants from us. 

🔥GOD CHOSE YOU AND HE HAS A PLAN FOR YOUR LIFE

📖 Scripture: Jeremiah 1.5 NKJV- Who are you in the kingdom? Choose significance in the kingdom.

📖 Scripture: 2 Corinthians 6.3 NKJV- There are things you should not do so that the ministry should not be blamed. 

🌹Everywhere you go, either revive or offend, but never leave the place neutral. Be bold and talk about Jesus. We should live lives for Christ. 

🔥BE SOMETHING FOR JESUS

🔥IN HIS NAME, FOR HIS GLORY 

🌹Revival is coming on the earth and in the midst of all this, God wants to use you. Beyond the decision of Jesus Christ, we have believed for an army of soul winners; people who are ready to win souls at every cost.

🎀However, this requires us to use wisdom too. You can win souls and peacefully coexist with others in authority. When you choose to win souls you are going to come out of comfort.

📖 Scripture: Revelation 3.15 NKJV- The Laodecian church was lukewarm and liked comfort. Come out of comfort! God is bored with polite prayers. 

🌹A secret that will guarantee your success; whenever you pray always ask for things that align with the mission of God. Always ask for things that expand God's influence on your life not material possessions. Every time you pray such a prayer, you reveal the state of your heart (Jeremiah 17.10). 

🎀No man or woman has more than what their heart is yielded to be used. God can never use more than what you have yielded to him. The first thing God wants you to give him is yourself; surrendering your will and purposes. 

🌹Spend time in prayer availing yourself to God for Him to work in you. Everything you ask for should be a contributing factor to his mission. When you learn that, there is nothing that God will withhold from you. 

💥Three Great prayers that you must make always💥
🎯God search my heart
🎀Deal with everything in me that does not exalt you. Break every carnality in me (Psalms 139.23). Always ask God to help you keep the right judgment between the permissible and perfect will.

📖 Scripture: Ephesians 4.17-18 NKJV- Refuse to walk like the Gentiles who do wrong even when they know that it is wrong. 

📖 Scripture: Matthew 15.8 KJV- As a witness, your business is only you and God. Be peaceable and gentle. 

📖 Scripture: Jeremiah 17.10 KJV- God will never deal with you beyond your heart. The heart can only be as consecrated as it is yielded to God. Searching your heart means dealing with carnality in you. Your carnality can overwhelm your spirit man, and you end up yielding more to the flesh, hence the need for sucha prayer.

🎯Bend me
🌹Bending means to be made vulnerable enough to be used by God. God can instruct and commission you, but your heart is hardened. 

🎀In life always never look for positions, look for function and purpose in every place. 

📖 Scripture: Matthew 23.11 NKJV- The greatest among you must be the servant. Always be flexible to touch even the worst for Jesus. If you can not be the least, you can never be the greatest.

🎯 Use me
🌹Tell God what you are available and that He should use you.

📖 Scripture: Isaiah 6.8 KJV- There is a place for available men or women. 

🎀Your heart should always be in the right place with God, be flexible and available to do and be anything for Jesus. This is what makes up a faithful witness. Being committed and available is being faithful. 

🌹Become a soul winner by default; heaven counts on you to win souls to glory. 

🔥HEAVEN IS COUNTING ON YOU

📖 Scripture: Daniel 12.3 NKJV- You will shine as a soul winner. 

🔥REFUSE TO LIVE A NORMAL LIFE

📖 Scripture: Acts 4.30-33 NKJV- Great Grace will be upon you as it was with them.

🔥🔥🔥 HALLELUJAH 🔥🔥🔥`
  },
  {
    title: "2026- THE YEAR OF THE POWER OF SALVATION - AP. GRACE LUBEGA",
    scripture: "Acts 9.36-42 NKJV",
    date: "2025-12-31",
    category: "Night of Prayer",
    content: `🎉🎉NIGHT OF PRAYER 2025🎉🎉

2026- THE YEAR OF THE POWER OF SALVATION 

📖Anchor Scripture: Acts 9.36-42 NKJV💥
[36] At Joppa there was a certain disciple named Tabitha, which is translated Dorcas. This woman was full of good works and charitable deeds which she did. [37] But it happened in those days that she became sick and died. When they had washed her, they laid her in an upper room. [38] And since Lydda was near Joppa, and the disciples had heard that Peter was there, they sent two men to him, imploring him not to delay in coming to them. [39] Then Peter arose and went with them. When he had come, they brought him to the upper room. And all the widows stood by him weeping, showing the tunics and garments which Dorcas had made while she was with them. [40] But Peter put them all out, and knelt down and prayed. And turning to the body he said, “Tabitha, arise.” And she opened her eyes, and when she saw Peter she sat up. [41] Then he gave her his hand and lifted her up; and when he had called the saints and widows, he presented her alive. [42] And it became known throughout all Joppa, and many believed on the Lord.

🌟This is the year of the Power of Salvation.

🎀In biblical Hebrew numerology, the number 26 is two letters; כ (Kaf) and ו (Vav). These two letters represent an open hand with a nail. This is a picture of Jesus' hand, nailed to the cross, hence the significance of the power of salvation. 

🌹Salvation in Hebrew is "Yeshua", meaning Christ, and "Sōtēría" in Greek means deliverance, victory, prosperity, health, preservation, welfare, rescue and safety. 

🎀This is the year of the Power of Yeshua on display, and it will display itself in a victory only God can give. 

🌹There are people who are tired of trying to prove a God that can not be seen. They have been mocked, dishonoured, disregarded, and some things have refused to move in your life. This year God is going to prove to you and your realm that Jesus died for a reason. 

🎀God is opening a season where He is going to amaze people through you. 

🔥DO YOU BELIEVE?

🌹God is going to prove to the world that when He saved you, He saved you to the uttermost. This is the year of seeing what no one has seen, like in John 9:32.

💥Pastors: the scrolls of revelation that have been opened to men are like never before. 

🎀The spirit of revelation is resting on men like never before. Daniel 11.32 speaks of those who know their God who shall be strong and do mighty exploits.

📖 Scripture: 2 Kings 19.14 NKJV- Hezekiah receives a letter and places it before God. He evokes the name of God, Yahweh. God, by an angel, rises and kills all the Assyrians who had set themselves to mock the God of Israel.

🌹God is going to prove to the hearts of men that He still works in the sons of men. God is going to fight for you without you raising a sword. The Glory of the latter church is going to be greater than that of the former.

📖 Scripture: Joshua 10.8-12 NKJV-  One nation fights a coalition of five kings through Joshua whose name means Yeshua. Joshua stopped the sun to fulfil that which God had promised him; there is no limit to what God can do. 

🔥GOD MUST PROVE HIMSELF STRONG

📖 Scripture: Acts 9.40 is the 26th time where Peter's name is mentioned in the New Testament. 

💥The Major Instruction💥
🔥DEMONSTRATE YOUR EXPECTATION

🎀Do something tangible that can prove that your expectation is real. 

📖 Scripture: Acts 9.37-38 NKJV- In ancient Jewish culture, immediately a person died, they were washed and took the body for burial but in Tabitha's case, they took her to the upper room. That is demonstrated expectation.

🔥SOMETHING CAN BE DONE ABOUT YOUR SITUATION 

📖 Scripture: Acts 9.38 NKJV- They laid Tabitha in the upper room even before they heard of Peter being in Lydda. They knew that there would be a way. 

🔥OUR GOD DOESN'T STOP AT DEATH, THERE IS A POWER BEYOND DEATH

📖 Scripture: Acts 9.39 -40 NKJV- Peter never raised Dorcus because she used to make clothes but because Yeshua is the resurrection and the life. He took everything out to prove to them that this was never of works but because Yeshua is life (Ephesians 2.9). 

📖 Scripture: Acts 9.40 KJV- Peter never prayed for Tabitha; he prayed to the Lord and edified himself, and then he turned to the body. 

🌹What many of us miss in the ministry of healing is turning to the sick to pray. The prayer of faith is not a begging prayer but a commanding prayer. 

📖 Scripture: Matthew 10.8 KJV- Jesus never told us to pray for the sick but to command them to health. You have to turn to the Lord first.

📖 Scripture: 2 Corinthians 3.16 NKJV- When we turn to the Lord, the veil is taken away. This veil is the realm of impossibility. 

📖 Scripture: Mark 5.30 NKJV- By the character of one's unction, everyone has unique signs of knowing when virtue is out of them and Peter too got to that point when he turned to the Lord. After there he turns and commands Dorcus to rise. 

🎀Every minister who has been mightily used by God has learned how to make their voice loud in the spirit. You can speak and not be heard, or be heard but not understood, or both. 

🌹It is possible to be listened to but not be heard. This is not related to eloquence like for Paul in 2 Corinthians 10.10/2.4. He did not have enticing words but he had a language by the spirit that made men understand him.

📖 Scripture: Acts 7.22 NKJV- Moses was a statterer, but he was mighty in words. 

📖 Scripture: Psalms 19.3 NKJV- God is going to make your voice loud. 

🎀This is the year where your voice is going to be amplified. People will respond to what is in your life (Zephaniah 3.17 NKJV).

🌹God has already done it, this year is the manifestation. Yeshua is the manifestation of the finished work. 

🔥🔥🔥 HALLELUJAH 🔥🔥🔥`
  }
];

// Pre-populate database
let insertedCount = 0;
console.log(`Checking pre-population for ${INITIAL_SERMONS.length} sermons...`);
for (const sermon of INITIAL_SERMONS) {
  try {
    const exists = db.prepare("SELECT id FROM notes WHERE title = ?").get(sermon.title);
    if (!exists) {
      db.prepare(
        "INSERT INTO notes (title, scripture, content, date, category) VALUES (?, ?, ?, ?, ?)"
      ).run(sermon.title, sermon.scripture, sermon.content, sermon.date, (sermon as any).category || 'General');
      insertedCount++;
    }
  } catch (err: any) {
    console.error(`Error inserting sermon "${sermon.title}":`, err.message);
  }
}
const totalNotes = db.prepare("SELECT COUNT(*) as count FROM notes").get() as any;
console.log(`Database initialized. Total sermons: ${totalNotes.count}. Newly inserted: ${insertedCount}.`);

async function startServer() {
      const fs = await import('fs');
  const uploadsDir = path.join(dataDir, 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      app.use('/uploads', express.static(uploadsDir));

      const multer = (await import('multer')).default;
      const upload = multer({ dest: uploadsDir });

      app.post('/api/media/upload', upload.array('media', 20), (req: any, res) => {
        try {
          const noteId = req.body.note_id ?? req.body.noteId;
          const files = req.files || [];
          if (!noteId || String(noteId).trim() === '') {
            return res.status(400).json({ error: 'Save the note first to attach media.' });
          }
          if (files.length === 0) {
            return res.status(400).json({ error: 'No files received. Use field name "media".' });
          }
          const media: { url: string; type: string; filename: string }[] = [];
          const insert = db.prepare('INSERT INTO media (note_id, type, url) VALUES (?, ?, ?)');
          for (const f of files) {
            const url = `/uploads/${f.filename}`;
            const type = f.mimetype || 'application/octet-stream';
            insert.run(noteId, type, url);
            media.push({ url, type, filename: f.originalname || f.filename });
          }
          res.json({ success: true, media });
        } catch (err: any) {
          console.error('[Media upload error]', err);
          res.status(500).json({ error: err.message || 'Upload failed' });
        }
      });
    // AI Sermon Capture endpoint
    app.post("/api/sermon-capture", express.json(), async (req, res) => {
      const { url } = req.body;
      // TODO: Integrate YouTube transcript extraction and AI summary
      // Placeholder logic for now
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid YouTube URL.' });
      }
      // Simulate transcript and summary
      const transcript = 'Sample transcript from YouTube sermon...';
      const summary = 'Sample AI summary: Key Message, Key Points, Scriptures...';
      res.json({ transcript, summary });
    });
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.set('trust proxy', true);
  app.use(session({
    secret: process.env.SESSION_SECRET || "sermon-companion-secret-v3",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    rolling: isProduction,
    name: 'sermon_companion_sid',
    cookie: { 
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  app.use((req: any, res, next) => {
    if (!isProduction) {
      console.log(`[Session Debug] ${req.method} ${req.url} - Session ID: ${req.sessionID} - User: ${req.session.user?.name || 'None'} - Cookie Header: ${req.headers.cookie || 'None'}`);
    }
    next();
  });

  // Auth Middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session.user) {
      next();
    } else {
      console.log("Auth failed: No session user found");
      res.status(401).json({ error: "Authentication required." });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.session.isAdmin) {
      next();
    } else {
      res.status(403).json({ error: "Access denied. Admin rights required." });
    }
  };

  // API Routes
  app.get("/api/auth/status", (req: any, res) => {
    res.json({ 
      isAdmin: !!req.session.isAdmin,
      user: req.session.user || null
    });
  });

  app.post("/api/auth/login", (req: any, res) => {
    const { passcode } = req.body;
    const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
    const viewPasscode = process.env.VIEW_PASSCODE || "5678";
    
    if (passcode === adminPasscode) {
      req.session.isAdmin = true;
      req.session.user = { name: "Admin" };
      req.session.save(() => {
        res.json({ success: true, isAdmin: true });
      });
    } else if (passcode === viewPasscode) {
      req.session.isAdmin = false;
      req.session.user = { name: "Friend" };
      req.session.save(() => {
        res.json({ success: true, isAdmin: false });
      });
    } else {
      res.json({ success: false, error: "Invalid passcode" });
    }
  });

  app.post("/api/auth/google", async (req: any, res) => {
    const { credential } = req.body;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (payload) {
        const ownerEmail = process.env.OWNER_EMAIL;
        const allowlist = process.env.ALLOWED_EMAILS ? process.env.ALLOWED_EMAILS.split(",") : [];
        
        // If owner is defined, check it. If not, the first person on allowlist is NOT automatically admin.
        // You must define OWNER_EMAIL to get admin rights via Google.
        const isOwner = ownerEmail && payload.email === ownerEmail;
        const isAllowed = isOwner || allowlist.includes(payload.email || "");

        if (isAllowed) {
          req.session.isAdmin = !!isOwner;
          req.session.user = { 
            name: payload.name, 
            email: payload.email,
            picture: payload.picture 
          };
          req.session.save(() => {
            res.json({ success: true, user: req.session.user, isAdmin: req.session.isAdmin });
          });
        } else {
          res.status(403).json({ error: "Access denied. Your email is not on the authorized list." });
        }
      } else {
        res.status(400).json({ error: "Invalid token" });
      }
    } catch (err) {
      console.error("Google auth error", err);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie('sermon_companion_sid', {
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        httpOnly: true,
      });
      res.json({ success: true });
    });
  });

  app.get("/api/notes", (req, res) => {
    try {
      console.log("Fetching notes for public view");
      let notes = db.prepare("SELECT * FROM notes ORDER BY date DESC").all();
      
      // Auto-seed if empty
      if (notes.length === 0 && INITIAL_SERMONS.length > 0) {
        console.log(`Library empty. Seeding ${INITIAL_SERMONS.length} sermons...`);
        const insert = db.prepare(
          "INSERT INTO notes (title, scripture, content, date, category) VALUES (?, ?, ?, ?, ?)"
        );
        
        const transaction = db.transaction((sermons) => {
          for (const sermon of sermons) {
            insert.run(sermon.title, sermon.scripture, sermon.content, sermon.date, sermon.category || 'General');
          }
        });
        
        transaction(INITIAL_SERMONS);
        notes = db.prepare("SELECT * FROM notes ORDER BY date DESC").all();
      }
      
      res.json(notes);
    } catch (err: any) {
      console.error("Error fetching/seeding notes:", err.message);
      res.status(500).json({ error: "Internal server error: " + err.message });
    }
  });

  app.post("/api/notes", isAdmin, (req, res) => {
    const { title, scripture, content, date, category } = req.body;
    const info = db.prepare(
      "INSERT INTO notes (title, scripture, content, date, category) VALUES (?, ?, ?, ?, ?)"
    ).run(title, scripture, content, date, category || 'General');
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/notes/random", (req, res) => {
    const note = db.prepare("SELECT * FROM notes ORDER BY RANDOM() LIMIT 1").get();
    res.json(note || null);
  });

  app.put("/api/notes/:id", isAdmin, (req, res) => {
    const { title, scripture, content, date, category } = req.body;
    db.prepare(
      "UPDATE notes SET title = ?, scripture = ?, content = ?, date = ?, category = ? WHERE id = ?"
    ).run(title, scripture, content, date, category || 'General', req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/notes/:id", isAdmin, (req, res) => {
    db.prepare("DELETE FROM notes WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Revelation Routes
  app.get("/api/revelations", (req, res) => {
    const revelations = db.prepare("SELECT * FROM revelations ORDER BY created_at DESC").all();
    res.json(revelations);
  });

  app.post("/api/revelations", isAdmin, (req, res) => {
    const { text } = req.body;
    const info = db.prepare("INSERT INTO revelations (text) VALUES (?)").run(text);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/revelations/:id", isAdmin, (req, res) => {
    db.prepare("DELETE FROM revelations WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/magic-fill", isAdmin, async (req, res) => {
    const { url, text } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured." });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Extract sermon details from the following content:
      URL: ${url || 'None'}
      Text: ${text || 'None'}
      
      Return a JSON object with:
      - title: The title of the sermon
      - speaker: The speaker's name
      - scripture: The main scripture reference
      - content: A summary or the full notes if provided
      - date: The date in YYYY-MM-DD format (use today if not found)
      
      Only return the JSON object, nothing else.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const jsonStr = response.text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(jsonStr);
      res.json(result);
    } catch (err: any) {
      console.error("Magic fill error:", err);
      res.status(500).json({ error: "Failed to extract sermon details." });
    }
  });

  // Debug Route
  app.get("/api/debug/db", (req, res) => {
    const notesCount = db.prepare("SELECT COUNT(*) as count FROM notes").get() as any;
    const revelationsCount = db.prepare("SELECT COUNT(*) as count FROM revelations").get() as any;
    const notes = db.prepare("SELECT id, title FROM notes LIMIT 10").all();
    res.json({ 
      notesCount: notesCount.count, 
      revelationsCount: revelationsCount.count,
      sampleNotes: notes
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.get('/favicon.ico', (_req, res) => {
      res.redirect(302, '/favicon.svg');
    });
  } else {
    const distDir = path.resolve(__dirname, "dist");
    const publicDir = path.resolve(__dirname, "public");

    // Serve built assets and also public PWA files explicitly in production.
    app.use(express.static(distDir));
    app.use(express.static(publicDir));

    app.get('/favicon.ico', (_req, res) => {
      res.redirect(302, '/favicon.svg');
    });
    app.get("*", (req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[Global Error Handler]", err);
    res.status(500).json({ 
      error: "Internal server error", 
      message: process.env.NODE_ENV === 'production' ? "Something went wrong" : err.message 
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
