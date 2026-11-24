# Manual E2E QA — Round 138 (2026-11-24)

Iteration 70/100. Area: round 133's new "Show all" Related button and the
reader's āyah actions in the Arabic interface at phone width.

## Findings

None this round.

## Investigated, no bug found

On 33:21 in Arabic: actions read "شغّل من الآية ٢١ · تشغيل · حفظ · التفسير ·
ذات صلة · المزيد"; the panel heading "٣٤ حديثًا تقتبس هذه الآية"; the new button
"عرض الأحاديث كلها (٣٤)" — Arabic-Indic digits through `tf`, as elsewhere.
Locale reset to English afterwards.

## Verification

No code changes.

## Verdict

Clean.
