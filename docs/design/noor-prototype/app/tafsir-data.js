/* Ummah Library — curated Tafsīr dataset + accessor. Concise, classical-grounded
   commentary (drawn from the sense of Ibn Kathīr, as-Saʿdī, al-Qurṭubī) for the
   surahs whose full text is bundled. getTafsir() returns a curated entry or a
   graceful, surah-aware fallback so every verse has something meaningful. */
window.TAFSIR = {
  source: "Synthesised from classical tafsīr (Ibn Kathīr · as-Saʿdī)",
  "1:1": { theme: "Beginning with Allah’s name", text: "Every good matter begins with the name of Allah, seeking blessing and help. Ar-Raḥmān and Ar-Raḥīm are two names from the root of mercy: the first denotes a mercy that embraces all creation, the second a mercy reserved especially for the believers." },
  "1:2": { theme: "All praise belongs to Allah", text: "Al-ḥamd is praise joined with love and reverence. Allah is Rabb al-ʿālamīn — the Creator, Owner and Nurturer of every world: of humankind, the jinn, the angels and all that exists. He sustains them moment to moment." },
  "1:3": { theme: "Mercy that frames the path", text: "After mentioning His lordship, Allah reminds the servant of His mercy — so that hope balances awe. Naming mercy twice draws the heart between fear of His justice and longing for His grace." },
  "1:4": { theme: "Master of the Day of Judgement", text: "He alone owns the Day when every soul is recompensed. Mentioning lordship, mercy, then judgement moves the heart through awe, hope, and accountability — the three states of a worshipper." },
  "1:5": { theme: "Worship and reliance, together", text: "The verse turns from speaking about Allah to speaking to Him. ‘You alone we worship’ is the essence of the religion; ‘You alone we ask for help’ is the essence of reliance. Worship without His help is impossible, and help is sought only through worship." },
  "1:6": { theme: "The plea for guidance", text: "The greatest need of the human being: to be guided to and kept firm upon the straight path — the clear way that leads to Allah with no crookedness. We ask it in every rakʿah because guidance must be renewed continually." },
  "1:7": { theme: "Two roads contrasted", text: "The path of those favoured — the prophets, the truthful, the martyrs and the righteous — not the path of those who knew the truth yet abandoned it, nor of those who strayed from it in ignorance. The surah ends by asking to walk among the guided." },
  "2:255": { theme: "Āyat al-Kursī — the greatest verse", sabab: "The Prophet ﷺ said this is the greatest āyah in the Book of Allah; whoever recites it after each obligatory prayer, nothing stands between him and Paradise but death.", text: "A complete declaration of Allah’s oneness, life, and absolute sovereignty. He is al-Ḥayy (Ever-Living) and al-Qayyūm (Sustainer of all). Neither drowsiness nor sleep touch Him. His Kursī encompasses the heavens and the earth, and guarding them does not weary Him. None can intercede except by His leave, and His knowledge surrounds all things." },
  "103:1": { theme: "An oath by time", text: "Allah swears by al-ʿaṣr — time itself, or the age of humankind — for in the passage of time lie the proofs of loss and gain. Imam ash-Shāfiʿī said: had people reflected on this surah alone, it would have sufficed them." },
  "103:2": { theme: "Humanity is in loss", text: "Every human being is in deficit, their lifetime spent like capital draining away — except those described in the verse that follows. The default state is loss; salvation is the exception that must be earned." },
  "103:3": { theme: "The four who are saved", text: "Faith, righteous deeds, mutual counsel to truth, and mutual counsel to patience. The first two perfect the self; the latter two perfect others. A believer is not saved alone but as part of a community holding one another to truth and endurance." },
  "112:1": { theme: "Pure monotheism", sabab: "Revealed when the idolaters asked the Prophet ﷺ to describe his Lord. It is said to equal a third of the Quran in reward.", text: "‘Say: He is Allah, the One.’ Aḥad affirms an absolute oneness that admits no partner, no division, and no equal — the foundation of all faith." },
  "112:2": { theme: "The Eternal Refuge", text: "Aṣ-Ṣamad: the One to whom all creation turns in need while He needs nothing; perfect in His attributes, sought by all, depending on none." },
  "112:3": { theme: "Beyond lineage", text: "He neither begets nor is born. He is free of the needs of offspring and origin — unlike the false claims made of Him by various nations." },
  "112:4": { theme: "Nothing is like Him", text: "There is none comparable to Him in His essence, names, or attributes. The surah is a complete refutation of every form of association with Allah." },
  "113:1": { theme: "Seeking refuge in the Lord of daybreak", sabab: "Al-Falaq and An-Nās were revealed together as the muʿawwidhatān — the two surahs of seeking refuge, recited for protection morning and evening and when seeking cure.", text: "Refuge is sought in the Lord of the falaq — the daybreak that splits the darkness — a fitting image for relief breaking through every distress." },
  "113:2": { theme: "From the evil of creation", text: "A comprehensive refuge from the harm of all that He has created, wherever harm may come from." },
  "114:1": { theme: "The Lord of mankind", text: "The final surah seeks refuge in Allah by three of His attributes — Lord, King, and God of mankind — against the most dangerous enemy: the whisperer in the heart." },
  "114:4": { theme: "Against the whisperer", text: "The waswās is the whisperer who casts doubt and temptation, then withdraws when Allah is remembered. Protection lies in turning back to Allah and His remembrance." },
};

// Returns a tafsīr entry, falling back to a surah-aware reflection.
window.getTafsir = function (surah, ayah) {
  const key = surah + ":" + ayah;
  const T = window.TAFSIR;
  if (T[key]) return T[key];
  const meta = (window.QURAN.surahs || [])[surah - 1] || {};
  const info = (window.QURAN.surahInfo || {})[surah];
  return {
    theme: meta.tr ? `Within ${meta.tr}` : "Reflection",
    text: (info && info.text ? info.text + " " : "") +
      `This āyah sits within ${meta.tr || "the surah"} (${meta.en || ""}), revealed in ${meta.rev || "—"}. A focused classical commentary for this verse will appear here as the tafsīr library syncs; reflect on its words, their context, and how they call you to act.`,
    fallback: true,
  };
};
