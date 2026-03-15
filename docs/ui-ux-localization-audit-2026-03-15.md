UI bugs

ID: UI-001  
Severity: High  
Language: French, Arabic  
Viewport: Mobile, Desktop  
Screen/route: `/history/[id]`  
Repro steps:
1. In detailed flow, add a salary category with a future hawl due date and save to history.
2. Open the saved item from History.
3. Inspect the line-item metadata block.
Expected: Each metadata row appears once (due status, hawl due date, mode, nisab).  
Actual: Due-status and hawl-date rows are duplicated in the same line-item card.  
Screenshot path: `screenshots/ui-l10n-2026-03-15/fr/mobile/history-detail-duplicate-meta-rows-tall.png`

ID: UI-002  
Severity: Low  
Language: Arabic  
Viewport: Desktop  
Screen/route: `/history/[id]`  
Repro steps:
1. Open any detailed history item in Arabic.
2. Observe the top-left header area (back affordance + title).
Expected: Clear visual separation between back label and page title.  
Actual: Header text appears crowded/concatenated (back label + page title) and reduces clarity.  
Screenshot path: `screenshots/ui-l10n-2026-03-15/ar/desktop/history-detail-mixed-french-lines.png`


UX confusion points

ID: UX-001  
Severity: Medium  
Language: English, French, Arabic  
Viewport: Mobile, Desktop  
Screen/route: `/calculate/detailed/setup`  
Repro steps:
1. Open detailed setup.
2. Select the yearly-zakat-date option.
3. Check the date field behavior on web.
Expected: A date-picker or clear input guidance beyond placeholder-only format.  
Actual: Date entry is free-text (`YYYY-MM-DD`) with no picker and minimal guidance, which is error-prone.  
Screenshot path: `screenshots/ui-l10n-2026-03-15/en/mobile/detailed-setup-date-input-textonly.png`

ID: UX-002  
Severity: Medium  
Language: French (also affects other web locales)  
Viewport: Mobile  
Screen/route: `/history/[id]`  
Repro steps:
1. Turn reminder ON in Settings.
2. Save a detailed entry with a future hawl due date.
3. Open the saved history detail.
Expected: Clear explanation that reminders are unsupported on web.  
Actual: Status shows generic not-scheduled wording without explicit web limitation context.  
Screenshot path: `screenshots/ui-l10n-2026-03-15/fr/mobile/history-detail-reminder-on-not-scheduled.png`


localization issues

ID: L10N-001  
Severity: High  
Language: French  
Viewport: Mobile, Desktop  
Screen/route: `/history`  
Repro steps:
1. Set app language to French.
2. Open History list.
3. Inspect total/amount suffix text.
Expected: Label should be fully French.  
Actual: Label remains English (`Zakat due`).  
Screenshot path: `screenshots/ui-l10n-2026-03-15/fr/mobile/history-list-english-zakat-due-date-format.png`

ID: L10N-002  
Severity: High  
Language: Arabic (after prior save in French)  
Viewport: Mobile, Desktop  
Screen/route: `/history/[id]`  
Repro steps:
1. Save a detailed entry while app language is French.
2. Switch language to Arabic.
3. Open the same saved history item.
Expected: All detail lines re-render in Arabic.  
Actual: Several persisted detail lines remain French/English (for example `Mode: Annuel`, `Statut d'exigibilite...`).  
Screenshot path: `screenshots/ui-l10n-2026-03-15/ar/mobile/history-detail-mixed-french-lines.png`

ID: L10N-003  
Severity: Medium  
Language: French, Arabic  
Viewport: Mobile, Desktop  
Screen/route: `/history`, `/history/[id]`  
Repro steps:
1. Open History list/details in French or Arabic.
2. Inspect saved timestamp formatting.
Expected: Locale-aware date formatting per current language.  
Actual: Fixed English-like month abbreviation (`15 Mar 2026, 09:15`) appears in French and Arabic.  
Screenshot path: `screenshots/ui-l10n-2026-03-15/fr/desktop/history-list-english-zakat-due-date-format.png`

ID: L10N-004  
Severity: Medium  
Language: Arabic (switching from/to LTR languages)  
Viewport: Mobile, Desktop  
Screen/route: `/settings` (language switcher)  
Repro steps:
1. Switch language between Arabic and English/French in Settings.
2. Check browser console and subsequent screens.
Expected: Clean language switch with stable directional state.  
Actual: Console warns `RTL change detected but the app could not reload automatically`, increasing risk of mixed directional state during session.  
Screenshot path: `screenshots/ui-l10n-2026-03-15/ar/mobile/settings-after-language-switch.png`
