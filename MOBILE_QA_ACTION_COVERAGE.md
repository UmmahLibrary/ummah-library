# Mobile app action coverage

Live Android emulator: `emulator-5554`, package `org.ummahlibrary.app`.
This ledger separates verified actions from actions still needing execution.

## Verified in current and prior live QA

| Area | Verified actions | Result |
| --- | --- | --- |
| Bottom navigation | Home, Read, Tools, Memorize, More; nested-stack restoration and Back | Pass |
| Home | Continue reading, Read and Listen routes; prayer shortcut; verse-of-day save toggled on/off | Partial; Qibla depends on location |
| Read / Surah list | Surah list, list search and category tabs; open Al-Faatiha | Partial; all tabs and every row not exercised |
| Surah reader | Open Mushaf; move page 1→2; view modes, scale, transliteration, tap-to-hear, loop, playback rate, audio range, recite controls; ayah save toggle on/off and share chooser dismissed | Partial; actual playback, Hifz creation and collection-sheet changes remain |
| Mushaf | Page 1 and Next Page 2; return to reader | Pass for page navigation |
| Search | Query `mercy` (60 results), Quran filter, genuine zero results, clear query; load failure surfaced and retry added | Pass for tested query paths |
| Prayer tracker | Cycle Fajr On time→Late→Not yet→On time; Fajr qaḍāʾ 10→9→10; totals updated and original state restored | Partial; history, ḥayḍ and fasting controls remain |
| Prayer times | Location denial state and retry/recovery | Partial; calculations/settings/reminders require granted location or configuration |
| Qibla | Location denial state and retry/recovery | Partial; bearing/compass requires location |
| Nearby mosques | Location denial state, recovery and attribution | Partial; radius/results/directions require location |
| Settings | Font scale 100%→110%→100%; theme and locale (Urdu→English), script (IndoPak→Uthmani), Tafsir setting restored; export/share, import picker, clear-cache and erase-all dialogs exercised | Partial; reciter, merge strategy and sync controls remain |
| Reading goals | Existing progress/streak displayed; Mushaf resume route | Partial; goal/khatma mutations remain |
| 99 Names | Existing 2/99 progress displayed; third Name toggled on/off | Pass for tested actions |
| Hadith | Bukhari Book 1 Arabic/English, Next to Book 2, Previous to Book 1; Muslim Book 1 Arabic and English translation visually verified after scrolling, then Bukhari Book 1 restored | Partial; broader pagination and later-book content remain |
| Profile | Journey summary, stats and achievements render | Partial; no achievements were available to open |
| Duas | Duʿā of the day and category content render | Pass for read-only content |
| Tasbih | Phrase, count, target and reset exercised; returned to SubḥānAllāh, 0/33 | Pass for tested actions |
| Adhkar | Occasion change, item counter, Reset, return to Morning | Partial; reminder switch and all occasions remain |
| Ramadan | Day and worship toggles switched on/off; 0/30 and 0/4 restored | Pass for tested actions; location times unavailable |
| Hijri Calendar | Previous/next month and −1/0 adjustment; returned to original month and 0-day offset | Pass for tested actions; reminder scheduling not exercised |
| Zakat | Calculator render; gold 75 and silver 0.85 entered, Gold/Silver niṣāb switched and calculated, then inputs cleared and Silver restored | Partial; currency validation, all asset entry fields and reset remain |
| Downloads | 7/7 Al-Faatiha entry; delete confirmation canceled; same download restored after initial unsafe delete | Pass after fix |
| Hifz | Empty-state dashboard renders; no review queue exists | Blocked by no saved Hifz verses; add/review/rating not changed in user data |
| Reading plans | Temporary plan start, pause/resume, extend, re-pace, abandon confirmation; cleared and verified no active plan. Custom pace/duration switch and cancel tested. | Partial; day completion/read-target and custom-plan creation remain |
| Tafsir | Content loaded; edition selector exercised across available editions | Partial; all editions/surahs and network failures remain |
| Collections | Existing Favorites preserved; temporary empty collection created and confirmed-deleted; delete cancel verified | Partial; rename, verse add/remove, and reader-sheet round trips remain |
| Settings | Theme, locale (Urdu→English), script (IndoPak→Uthmani), font; translation manager opened/closed; export/share chooser and import picker opened/dismissed; clear-cache and erase-all dialogs canceled | Partial; reciter, merge strategy and sync controls remain |
| Juz reader | Juz 1 rendered Arabic and translation; playback, loop, range and recite controls displayed | Partial; audio/memorize controls remain |
| Not Found | Invalid deep link opened Not Found; Go to Today returned to Home | Pass for recovery route |

## Not yet verified action groups

| Screens / shared flows | Actions still requiring execution |
| --- | --- |
| Profile, Privacy | Profile actions; external contact links (OS handoff) |
| Adhkar | Reminder switch and remaining occasions |
| Hijri Calendar | Reminder scheduling and event toggles |
| Zakat | Currency validation, all asset fields and reset. Numeric price entry and both niṣāb choices were tested and restored. |
| Hifz dashboard/review | Add verse to Hifz, reveal, each rating and resulting schedule; no saved review item was present |
| Reading plans/detail | Day completion/check-in, read target, custom-plan creation; temporary plan was cleared |
| Collections / bookmarks | Rename, verse add/remove, ayah bookmark and save-to-collection sheet |
| Tafsir | All surahs, editions and network error/retry states |
| Reader shared controls | Actual audio playback, some per-ayah actions, collection-sheet round trip, and Juz audio/memorize actions; view modes, scale, transliteration, range/rate/loop/repeat, recite controls, translation manager, save toggle and share chooser were exercised |
| Settings backup/sync | Export/share and import cancel exercised; merge strategy and sync setup/recovery/off remain untested |
| Destructive confirmations | Cache clear, erase all data, delete collection/download, abandon plan; destructive confirm not run against user data |
| Onboarding | Fresh-install onboarding remains untested |

"Pass" means only the listed interactions were exercised on this emulator. It does not imply exhaustive coverage of the screen. Location permission was temporarily granted for a synthetic coordinate but Expo did not return a fix; permission and test providers were then removed. Hifz review had no saved item. Existing-data destructive confirmations were canceled; only the QA-created empty collection and temporary plan were deleted. Zakat test inputs were cleared and the original Silver basis restored. The app was returned to Hadith Book 1.
