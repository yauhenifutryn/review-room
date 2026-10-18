export const HTML = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Review Room</title>
    <style>
/* One mobile-first system. Desktop adds columns; phone controls never shrink to fit a desktop row. */
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171717;background:#fff;font-synthesis:none;--ink:#171717;--muted:#616161;--line:#e4e4e4;--surface:#f6f6f6;--meta:.75rem;--ui:.875rem;--input:1rem;--title:1.25rem;--radius:4px}
*{box-sizing:border-box}html{scroll-padding-top:16px;-webkit-text-size-adjust:100%}body{margin:0;font-size:var(--ui);line-height:1.5}button,input,select,textarea{font:inherit;color:inherit}button,a,summary{cursor:pointer}button:disabled{opacity:.45;cursor:default}[hidden]{display:none!important}button:focus-visible,a:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--ink);outline-offset:3px}::selection{background:#dedede}a{color:inherit;text-underline-offset:3px}p{margin:0 0 12px}h1,h2,h3,h4{font-size:var(--title);line-height:1.3;font-weight:600;margin:0 0 8px;letter-spacing:-.02em}strong,b{font-weight:600}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.masthead{max-width:1120px;margin:auto;padding:12px 16px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px}.masthead-left{display:grid;grid-template-columns:40px minmax(0,1fr);gap:0 10px;align-items:center;min-width:0}.brand-logo{grid-row:1/3;width:40px;height:30px;object-fit:contain;filter:invert(1)}.brand-mark{grid-row:1/3;display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--ink);border-radius:var(--radius);font-weight:600}.masthead-kicker{font-size:var(--ui);font-weight:600;line-height:1.4}.header-progress{font-size:var(--meta);line-height:1.4;color:var(--muted);grid-column:2}.status-dot,.identity-email,#roomStatusText{display:none}.header-nav{display:flex;gap:12px;flex-wrap:wrap;justify-content:flex-end;align-items:center;max-width:180px}.nav-button,.close-toggle,.switch-button,.back-to-read,.context-refresh{border:0;background:none;padding:8px 0;min-height:44px;font-size:var(--meta);line-height:1.4}.nav-button{color:var(--muted)}.nav-button.active{color:var(--ink);text-decoration:underline;text-underline-offset:6px}.close-toggle{color:var(--ink)}body[data-view="review"] #closeReviewButton{display:none!important}
.page-wrap{max-width:1000px;margin:auto;padding:0 16px max(24px,env(safe-area-inset-bottom))}.candidate-switcher{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:12px}.candidate-select{width:100%;min-width:0;border:0;border-radius:0;background:#fff;min-height:44px;padding:8px 0;font-size:var(--ui);text-overflow:ellipsis}.switch-button{white-space:nowrap}.queue-search{display:none}.workspace{max-width:680px;margin:0 auto}.card{min-width:0}.candidate-ordinal,.candidate-city,.candidate-footnote,.candidate-evidence,.section-head,.score-prompt,.review-step,.draft-label,.spinner{display:none}.candidate-name{font-size:var(--title);overflow-wrap:anywhere;margin:16px 0 10px}.candidate-chip-row{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:var(--meta);color:var(--muted);margin:0 0 6px}.chip strong{font-weight:400}.department-strip{font-size:var(--meta);color:var(--muted);margin-bottom:12px}.department-strip strong{color:var(--ink);font-weight:500}.team-activity{font-size:var(--meta);line-height:1.5;color:var(--muted);padding:10px 0;margin-bottom:20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.rubric-note{max-width:680px;margin:0 auto 12px;color:var(--muted);font-size:var(--meta)}.rubric-note summary{min-height:36px;padding:8px 0}.rubric-note p{margin:4px 0 12px;line-height:1.6}.csv-note{font-size:var(--meta);color:var(--muted);line-height:1.5;margin:16px 0}.ai-brief{border:1px solid var(--line);border-radius:var(--radius);padding:16px;margin-bottom:20px}.ai-brief-head{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px 12px;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px}.ai-brief-title{font-size:var(--ui);font-weight:600}.preliminary-tag,.ai-total{font-size:var(--meta);color:var(--muted)}.ai-recommendation{font-size:var(--ui);font-weight:600}.ai-total{display:block;margin-top:4px}.department-recommendation{background:var(--surface);padding:12px;border-radius:var(--radius);margin:12px 0}.recommendation-heading{font-size:var(--ui);font-weight:600}.department-recommendation p{margin:6px 0;font-size:var(--ui)}.department-recommendation>span{font-size:var(--meta);color:var(--muted);display:block}.ai-reason{font-size:var(--ui);line-height:1.6;white-space:pre-wrap;margin:16px 0;overflow-wrap:anywhere}.ai-reason:before,.ai-question:before{display:block;font-size:var(--meta);font-weight:600;color:var(--muted);margin-bottom:6px}.ai-reason:before{content:"Application signal"}.ai-question:before{content:"Interview check"}.ai-question{font-size:var(--ui);line-height:1.6;border-top:1px solid var(--line);padding-top:12px;margin-bottom:12px}.public-evidence-lead{font-size:var(--ui);line-height:1.6;color:var(--muted)}.ai-score-disclosure,.public-evidence{border-top:1px solid var(--line);font-size:var(--meta);margin-top:8px}.ai-score-disclosure summary,.public-evidence>summary{padding:12px 0;min-height:44px}.ai-scores{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.ai-score-label,.source-status,.criterion-reason{display:block;font-size:var(--meta);color:var(--muted)}.ai-score-value{display:block;font-size:var(--input);font-weight:600;margin-top:4px}.ai-score-value.unknown{font-size:var(--ui)}.criterion-reason{margin-top:6px}.source-check{border-bottom:1px solid var(--line);padding:12px 0;overflow-wrap:anywhere}.source-check p{font-size:var(--ui);line-height:1.6;margin:6px 0}.source-status{margin-top:6px}
.answer-disclosure,.shared-context{border-top:1px solid var(--line);margin:16px 0}.answer-disclosure>summary,.shared-context>summary{font-size:var(--ui);padding:12px 0;min-height:44px}.tab-list{display:flex;gap:16px;overflow-x:auto;overscroll-behavior-inline:contain;margin:0 0 12px}.tab-button{flex:none;border:0;border-bottom:2px solid transparent;background:none;color:var(--muted);font-size:var(--meta);padding:10px 0;min-height:44px}.tab-button[aria-selected="true"]{border-color:var(--ink);color:var(--ink)}.answer-panel h4{display:none}.answer-question{font-size:var(--ui);color:var(--muted);margin:0 0 12px}.answer-copy{font-size:var(--input);line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 20px;max-width:70ch}.shared-context p{font-size:var(--ui);color:var(--muted);line-height:1.6}.context-form{display:grid;gap:12px;margin:16px 0}.context-list{margin:12px 0}.context-item{padding:12px 0;border-bottom:1px solid var(--line)}.context-author{font-size:var(--meta);color:var(--muted);overflow-wrap:anywhere}.context-text{font-size:var(--ui);white-space:pre-wrap;overflow-wrap:anywhere;margin-top:6px}.context-actions{display:flex;align-items:center;justify-content:space-between;gap:12px}.context-refresh{font-size:var(--meta);text-decoration:underline;text-underline-offset:3px}.context-error{font-size:var(--ui)}
.primary-button,.submit-button,.start-scoring,.quiet-button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--ink);background:var(--ink);color:#fff;border-radius:var(--radius);font-size:var(--ui);font-weight:500;line-height:1.4;min-height:44px;padding:10px 16px}.quiet-button{background:#fff;color:var(--ink);border-color:#aaa}.reading-action{display:flex;justify-content:flex-end;margin:20px 0}.back-to-read{color:var(--muted)}.workspace:not(.is-scoring) .review-card,.workspace:not(.is-scoring) .back-to-read{display:none}.workspace.is-scoring .reading-action,.workspace.is-scoring .ai-brief,.workspace.is-scoring .answer-disclosure,.workspace.is-scoring .shared-context,.workspace.is-scoring .candidate-chip-row,.workspace.is-scoring .department-strip,.workspace.is-scoring .team-activity{display:none}.workspace.is-scoring .candidate-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border-bottom:1px solid var(--line);margin-top:8px;padding-bottom:8px}.workspace.is-scoring .candidate-name{margin:0}.back-to-read{grid-column:2;grid-row:1;white-space:nowrap}.review-head{margin:20px 0 4px}.review-head h2{font-size:var(--input);font-weight:600;letter-spacing:0;margin:0 0 4px}.review-head p{font-size:var(--meta);color:var(--muted);margin:0}.score-list{display:grid}.score-block{display:grid;grid-template-columns:minmax(0,1fr);gap:2px;border:0;padding:8px 0;margin:0;min-width:0}.score-topline{display:flex;align-items:baseline;justify-content:space-between;gap:12px;min-width:0}.score-legend{font-size:var(--ui);font-weight:500;line-height:1.45}.score-weight{flex:none;font-size:var(--meta);color:var(--muted);font-variant-numeric:tabular-nums}.score-choices{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));position:relative;isolation:isolate;padding:0;gap:0}.score-choices:before{content:"";position:absolute;inset:7px 0;background:var(--surface);border-radius:var(--radius);z-index:-1}.score-choice{position:relative;isolation:isolate;border:0;border-radius:2px;background:transparent;font-size:var(--ui);font-weight:500;line-height:1;min-width:0;min-height:44px;padding:0;touch-action:manipulation;font-variant-numeric:tabular-nums}.score-choice:before{content:"";position:absolute;inset:7px 3px;border-radius:2px;z-index:-1}.score-choice[aria-pressed="true"]{color:#fff}.score-choice[aria-pressed="true"]:before{background:var(--ink)}.score-choice:focus-visible{outline-offset:-2px}.score-help{font-size:var(--meta);line-height:1.5;color:var(--muted);margin:0;grid-column:1/-1;max-width:70ch}.score-help:empty{display:none}.review-fields{display:grid;gap:16px;margin-top:20px}.field-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.field-row:has(>div[hidden]){grid-template-columns:1fr}.field-label{display:block;font-size:var(--meta);font-weight:500;line-height:1.5;margin:0 0 6px}.select-control,.text-control,.results-toolbar input,.results-toolbar select{display:block;width:100%;min-width:0;min-height:44px;border:1px solid #aaa;border-radius:var(--radius);padding:9px 10px;background:#fff;font-size:var(--input);line-height:1.5}.select-control{font-size:var(--ui);padding:8px 24px 8px 0;border:0;border-bottom:1px solid #aaa;border-radius:0}.text-control{resize:vertical;min-height:80px;max-height:320px}.text-control::placeholder,.results-toolbar input::placeholder{font-size:var(--ui);color:var(--muted);opacity:1}.char-hint{font-size:var(--meta);line-height:1.5;color:var(--muted);margin-top:6px}.muted-copy{font-size:var(--meta);line-height:1.5;color:var(--muted)}.review-foot{display:flex;flex-direction:column;align-items:stretch;gap:12px;margin-top:20px}.review-foot .muted-copy{order:2}.form-error,.notice,.coordinator-error,.closed-form-note{font-size:var(--ui);padding:12px 0;overflow-wrap:anywhere}.form-error,.notice-error{border-bottom:1px solid var(--ink)}.loading-panel,.error-panel,.closed-panel,.finished-panel{max-width:680px;margin:32px auto}.loading-panel,.error-panel p,.closed-panel p,.finished-panel p{font-size:var(--ui);color:var(--muted)}.submit-success{max-width:680px;margin:16px auto;font-size:var(--ui)}.receipt-score{font-size:var(--title);font-variant-numeric:tabular-nums}.receipt-meta,.receipt-note,.receipt-dimensions{font-size:var(--ui)}.receipt-dimensions{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}
.coordinator-head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:16px;margin:20px 0}.coordinator-head h1{font-size:var(--title)}.coordinator-head p{font-size:var(--ui);color:var(--muted);max-width:60ch;margin:6px 0}.coordinator-actions{display:flex;gap:8px;flex-wrap:wrap}.coordinator-actions .primary-button,.coordinator-actions .quiet-button{background:#fff;color:var(--ink);border-color:#aaa}.kpi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 20px;margin:20px 0 8px}.kpi{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:8px;min-width:0;border-bottom:1px solid var(--line);padding:8px 0}.kpi-label,.kpi-foot{font-size:var(--meta);line-height:1.5;color:var(--muted)}.kpi-value{font-size:var(--title);line-height:1.4;font-weight:600;font-variant-numeric:tabular-nums}.kpi-foot{display:none}.results-guide{font-size:var(--meta);color:var(--muted);margin:0 0 16px}.results-guide summary{padding:10px 0;min-height:44px}.results-guide p{margin:4px 0 12px;line-height:1.6}.coordinator-head .reviewer-completion{font-size:var(--meta)}.results-toolbar{display:grid;gap:12px;align-items:center;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:16px 0}.results-toolbar-left{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 12px;align-items:center;min-width:0}.results-toolbar-left label{grid-row:1;font-size:var(--meta);color:var(--muted)}.results-toolbar-left select{grid-row:2;font-size:var(--ui)}.results-summary{font-size:var(--meta);color:var(--muted)}.department-group{margin:28px 0}.department-group-head{display:flex;justify-content:space-between;align-items:baseline;gap:20px;margin-bottom:12px}.department-group-head h2{font-size:var(--input);letter-spacing:0;margin:0}.department-group-head p{font-size:var(--meta);color:var(--muted);margin:6px 0}.group-average{display:none;font-size:var(--meta);color:var(--muted);min-width:160px}.bar-track{height:3px;background:var(--line);margin-top:8px}.bar-fill{height:100%;background:var(--ink)}.result-table-head{display:none}.result-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 16px;padding:16px 0;border-bottom:1px solid var(--line);align-items:start}.result-candidate{min-width:0;overflow-wrap:anywhere}.result-candidate strong{display:block;font-size:var(--ui)}.result-candidate>span,.result-status,.result-activity{font-size:var(--meta);color:var(--muted)}.result-candidate>span{display:block;margin-top:4px}.result-status{grid-column:2;grid-row:1;max-width:110px}.result-activity{margin-top:4px}.heatmap{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px}.heat-cell{background:transparent!important;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:4px 8px;min-width:0}.heat-cell b{grid-row:1;grid-column:2;font-size:var(--ui);line-height:1.5;font-weight:600;font-variant-numeric:tabular-nums}.heat-cell span{grid-column:1;grid-row:1;font-size:var(--meta);line-height:1.5;color:var(--muted);overflow-wrap:anywhere}.heat-cell .heat-label-full{display:none}.heat-cell small{grid-column:1/-1;font-size:var(--meta);color:var(--muted)}.heat-cell small:empty{display:none}.heat-cell:last-child{grid-column:1/-1;padding-top:8px;border-top:1px solid var(--line)}.result-detail{grid-column:1/-1;min-width:0}.result-detail summary{font-size:var(--meta);color:var(--muted);min-height:44px;padding:12px 0}.individual-reviews{display:grid;gap:12px}.individual-review{border-top:1px solid var(--line);padding:12px 0;overflow-wrap:anywhere}.individual-review-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 12px;font-size:var(--meta)}.individual-review-scores{font-size:var(--meta);line-height:1.6;color:var(--muted);margin-top:8px}.individual-review p{font-size:var(--ui);white-space:pre-wrap;margin:8px 0}.empty-results,.no-results{font-size:var(--ui);padding:16px 0;color:var(--muted)}
@media(pointer:coarse){.score-choice{min-height:44px}}
@media(min-width:640px){.masthead{padding:20px 32px}.masthead-left{grid-template-columns:64px auto auto;gap:16px}.brand-logo{width:64px;height:36px;grid-row:auto}.brand-mark{grid-row:auto}.header-progress{grid-column:auto}.header-nav{max-width:none;gap:20px}.page-wrap{padding:0 32px 40px}.candidate-switcher{margin-bottom:16px}.candidate-name{font-size:var(--title);margin-top:20px}.score-block{grid-template-columns:minmax(0,1fr) 280px;align-items:center;column-gap:24px;padding:16px 0}.score-choice{min-height:44px}.review-foot{align-items:flex-start}.kpi-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px 16px;margin:24px 0}.kpi{grid-template-columns:1fr;grid-template-rows:36px 36px auto;gap:0;border:0;padding:0;align-items:start}.kpi-value{font-size:var(--title)}.kpi-foot{display:block}.heatmap{grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.heat-cell{display:grid;grid-template-columns:1fr;grid-template-rows:24px 54px auto;gap:4px;text-align:center}.heat-cell b,.heat-cell span{grid-column:1}.heat-cell span{grid-row:2}.heat-cell .heat-label-short{display:none}.heat-cell .heat-label-full{display:block}.heat-cell b{font-size:var(--input)}.heat-cell:last-child{grid-column:auto;border:0;padding:0}.heat-cell small{grid-column:1;grid-row:3}.ai-total{display:inline-block;margin:0 0 0 12px}.ai-scores{grid-template-columns:repeat(4,minmax(0,1fr))}.group-average{display:block}}
@media(min-width:960px){.kpi-grid{grid-template-columns:repeat(7,minmax(0,1fr));gap:16px}.kpi{grid-template-rows:40px 36px auto}.results-toolbar{grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:12px 20px}.results-toolbar-left{grid-template-columns:auto minmax(0,1fr) auto minmax(0,1fr)}.results-toolbar-left label,.results-toolbar-left select{grid-row:auto}.results-summary{grid-column:1/-1}.result-table-head,.result-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr) 112px;gap:16px}.result-table-head{font-size:var(--meta);color:var(--muted);padding:12px 0;border-bottom:1px solid var(--line)}.heatmap{grid-column:2;grid-row:1}.result-status{grid-column:3;grid-row:1}.result-detail{grid-column:1/-1}}
@media(max-width:359px){.review-fields .field-row{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation:none!important;transition:none!important}}

    </style>
  </head>
  <body data-view="review">
    <div class="app-shell">
      <header class="masthead"><div class="masthead-left"><span class="status-dot" id="roomStatusDot" aria-hidden="true"></span><span class="brand-mark" aria-hidden="true">R</span><span class="masthead-kicker">Recruitment</span><span class="header-progress" id="roomStatusText">Reviewing open</span><span class="header-progress" id="queueCount" aria-live="polite">Loading progress…</span></div><div class="masthead-actions"><span class="identity-email" id="identityEmail">Checking identity…</span><nav class="header-nav" aria-label="Review navigation"><button class="nav-button active" id="reviewNav" type="button" aria-current="page">Reviews</button><button class="nav-button" id="coordinatorNav" type="button" hidden>Results</button><button class="close-toggle" id="closeReviewButton" type="button" hidden>Close reviewing</button></nav></div></header>
      <main class="page-wrap" id="mainContent">
        <section class="candidate-switcher" id="candidateSwitcher" aria-label="Candidate navigation" hidden><button class="switch-button" id="previousCandidate" type="button" aria-label="Previous candidate">← Previous</button><label class="sr-only" for="candidateSelect">Choose candidate</label><select class="candidate-select" id="candidateSelect" aria-label="Choose candidate"></select><label class="sr-only" for="queueSearch">Search candidates</label><input class="queue-search" id="queueSearch" type="search" placeholder="Search candidates" autocomplete="off"><button class="switch-button" id="nextCandidate" type="button" aria-label="Next candidate">Next →</button></section>
        <details class="rubric-note"><summary>Scoring guide · four criteria</summary><p>Ownership 30% · Growth 20% · Community Service 30% · Motivation 20%. Earlier reviews are preserved separately in Results and do not count toward current scores. AI briefs marked “previous rubric” have not been rescored.</p></details><div class="notice" id="globalNotice" role="status" hidden><span id="globalNoticeText"></span></div><details id="datasetImport" class="answer-disclosure" hidden><summary>Import applications</summary><p class="review-head">Coordinator only. Upload the JSON produced by the importer. Records stay in private runtime storage. Import creates a new dataset and cannot replace existing records.</p><form id="datasetForm"><label for="datasetFile">Applications JSON</label> <input id="datasetFile" type="file" accept=".json,application/json" required><button class="primary-button" id="datasetSubmit" type="submit">Import</button><p id="datasetStatus" role="status"></p></form></details><section class="loading-panel" id="loadingState" role="status"><span class="spinner" aria-hidden="true"></span><span>Loading reviews…</span></section>
        <section class="error-panel" id="errorState" role="alert" hidden><h2 id="errorTitle">Could not load the review room.</h2><p id="errorText">Try again in a moment.</p><button class="primary-button" id="retryButton" type="button">Try again</button><p id="signInAction" hidden><a href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT</a></p></section>
        <section class="closed-panel" id="closedState" hidden><h2>Reviewing is closed</h2><p>The your community selection team has paused candidate reviews. Your sign-in is confirmed; there is no action to take right now.</p></section>
        <section class="finished-panel" id="finishedState" hidden><h2>Your reviews are complete</h2><p id="finishedCopy">Your submitted reviews are saved. Select an application above to revisit your own rating.</p></section>
        <section id="reviewerView" hidden><div class="submit-success" id="successNotice" role="status" aria-live="polite" hidden></div><div class="workspace" id="reviewWorkspace">
          <article class="card candidate-card" aria-labelledby="candidateName"><div><div class="candidate-ordinal" id="candidateOrdinal">Candidate</div><h1 class="candidate-name" id="candidateName">Candidate</h1><div class="candidate-city" id="candidateCity"></div></div><div class="candidate-chip-row" id="candidateChips"></div><div class="department-strip" id="departmentStrip"></div>
            <div class="team-activity" id="teamActivity" role="status">Team review activity is loading…</div><section class="ai-brief" aria-label="Preliminary AI assessment" id="aiBrief"><div class="ai-brief-head"><span class="ai-brief-title" id="aiBriefTitle">AI reading aid</span><span class="preliminary-tag">Claims unverified</span></div><div><span class="ai-recommendation" id="aiRecommendation">AI view unavailable</span><span class="ai-total" id="aiTotal" hidden></span></div><div class="department-recommendation" id="departmentRecommendation" hidden><div class="recommendation-heading" id="departmentRecommendationHeading"></div><p id="departmentRecommendationReason"></p><span id="departmentRecommendationMatch"></span></div><p class="ai-reason" id="aiReason"></p><p class="ai-question" id="aiQuestion" hidden></p><p class="public-evidence-lead" id="publicEvidenceLead" hidden></p><details class="public-evidence" id="publicEvidence" hidden><summary id="publicEvidenceTitle">Public evidence checked</summary><div id="publicEvidenceList"></div></details><details class="ai-score-disclosure"><summary>AI score breakdown</summary><div class="ai-scores" id="aiScores"></div></details></section>
            <details class="answer-disclosure" id="answersDisclosure"><summary>Read full application answers</summary><section class="answer-section" aria-labelledby="answersTitle"><div class="section-head"><h3 id="answersTitle">Original answers</h3><p>Use the applicant’s own words as evidence.</p></div><div class="tab-list" id="answerTabs" role="tablist" aria-label="Application answers"></div><div class="answer-panel" id="answerPanel" role="tabpanel" tabindex="0" aria-labelledby="answerTab-achievement"><h4 id="answerTitle"></h4><p class="answer-question" id="answerQuestion" hidden></p><p class="answer-copy" id="answerCopy"></p></div><details class="candidate-evidence" id="candidateEvidence" hidden><summary>Additional application context</summary><div class="evidence-body" id="candidateEvidenceText"></div></details><div class="candidate-footnote">The AI brief is a reading aid. Make your own assessment from the application evidence.</div></section></details>
            <details class="shared-context" id="sharedContext"><summary>Shared context &amp; referrals <span id="contextCount"></span></summary><p>Know this person? Add how you know them. Everyone reviewing can see this. Ratings and evidence notes are also visible in Results.</p><button class="context-refresh" id="refreshComments" type="button">Refresh comments</button><div id="contextList" class="context-list" aria-live="polite"></div><form class="context-form" id="contextForm"><label class="sr-only" for="contextText">Shared context comment</label><textarea class="text-control" id="contextText" maxlength="2000" placeholder="I worked with this person on…" required></textarea><div class="context-actions"><span class="muted-copy">Visible to all reviewers, with your account.</span><button class="quiet-button" id="postComment" type="submit">Add comment</button></div><div id="contextError" class="context-error" role="status"></div></form></details>
            <div class="reading-action"><button class="start-scoring" id="startScoring" type="button">Rate this candidate</button></div><button class="back-to-read" id="backToRead" type="button">Application</button>
          </article>
          <form class="card review-card review-form" id="reviewForm" novalidate><div class="review-head"><div><h2>Your rating</h2><p>Rate 1–5. Use ? when there is not enough evidence.</p></div><span class="draft-label" id="draftLabel" hidden>Draft in memory</span></div><div class="closed-form-note" id="closedFormNote" hidden>Reviewing is closed. This application is read-only until the coordinator reopens submissions.</div><div id="reviewInputs"><div class="score-list" id="scoreList"></div>
            <div class="review-fields"><div class="field-row"><div><label class="field-label" for="departmentSelect">Recommended department</label><select class="select-control" id="departmentSelect" required><option value="">Choose a department</option></select></div><div><label class="field-label" for="fitSelect">Department fit</label><select class="select-control" id="fitSelect" required><option value="">Choose a verdict</option><option>Strong fit</option><option>Good fit</option><option>Discuss</option><option>Poor fit</option></select></div></div>
              <div class="field-row"><div hidden><label class="field-label" for="founderPotential">Founder potential</label><select class="select-control" id="founderPotential"><option value="Definitely yes">Definitely yes</option><option value="Probably yes">Probably yes</option><option value="Unsure" selected>Unsure</option><option value="Probably not">Probably not</option><option value="Definitely not">Definitely not</option></select></div><div><label class="field-label" for="notes">Evidence note <span class="muted-copy">· 15 characters minimum</span></label><textarea class="text-control" id="notes" maxlength="2000" minlength="15" required aria-describedby="notesCount" placeholder="Why these scores?"></textarea><div class="char-hint" id="notesCount" aria-live="polite">0 / 15 minimum</div></div></div></div>
            <div class="form-error" id="formError" role="alert" hidden></div><div class="review-foot"><span class="muted-copy">Your review locks after submission. Signed-in reviewers can see ratings and notes in Results.</span><button class="submit-button" id="submitReview" type="submit">Submit &amp; next</button></div></div><section class="receipt" id="reviewReceipt" hidden aria-label="Your submitted review"></section></form>
        </div></section>
        <section id="coordinatorView" hidden><div class="coordinator-head"><div><h1>Results</h1><p class="reviewer-completion" id="reviewerCompletion">Team activity is loading…</p><p>Shared with all signed-in reviewers. Two complete scores support discussion; a difference of 20+ points is flagged.</p></div><div class="coordinator-actions"><button class="quiet-button" id="refreshResults" type="button">Refresh</button><button class="primary-button" id="exportCsv" type="button">Export results</button></div></div><div id="coordinatorError" class="coordinator-error" role="alert" hidden></div><div id="coordinatorContent"><details id="legacyResults" class="answer-disclosure" hidden><summary id="legacySummary">Previous-rubric reviews</summary><p>Historical ratings only. Community &amp; Collaboration and Problem Solving &amp; Resourcefulness used the old criteria. These do not contribute to current totals.</p><div id="legacyList"></div></details><div class="kpi-grid" id="kpiGrid"></div><details class="results-guide"><summary>How to read these results</summary><p>Complete scores include numeric ratings for all four criteria. Incomplete reviews include at least one unknown criterion; unknown criteria are counted across all reviews. Two complete scores are needed for discussion, and a spread of 20 points or more is flagged. Started reviewers have submitted a review or were active recently; activity expires after 15 minutes.</p></details><div class="results-toolbar"><div class="results-toolbar-left"><label for="departmentFilter">Department</label><select id="departmentFilter"><option value="">All departments</option></select><label for="resultFilter">Show</label><select id="resultFilter"><option value="all">All candidates</option><option value="needs">Needs more reviews</option><option value="discuss">Discussion flagged</option><option value="ready">Ready for discussion</option></select></div><label class="sr-only" for="coordinatorSearch">Search candidates</label><input id="coordinatorSearch" type="search" autocomplete="off" placeholder="Search candidates"><span class="results-summary" id="resultsSummary"></span></div><div id="departmentGroups"></div><div class="csv-note">Export matches results by application ID and includes names for reference. It excludes contact details and reviewer identities. Department groups follow applicants’ first choices.</div></div></section>
      </main>
    </div>
    <script>
      (() => {
        "use strict";
        const ANSWERS = [
          { key: "achievement", label: "Achievement", title: "A meaningful achievement", question: "What’s the most impressive thing you’ve ever done?" },
          { key: "vision", label: "Vision", title: "A future they want to shape", question: "What change do you want to drive in the world, and how do you imagine using your strengths, ideas, and energy to make that vision a reality?" },
          { key: "initiative", label: "Initiative", title: "A moment they took initiative", question: "With a small team, four weeks and a limited budget, what would you deliver for your community?" },
          { key: "ownership", label: "Ownership", title: "How they take responsibility", question: "What would you like to take ownership of in this department during your first semester?" },
          { key: "motivation", label: "Motivation", title: "Why your community", question: "Why do you want to join your community?" },
          { key: "additional", label: "Additional", title: "Anything else to add", question: "Is there anything else you want to share with us?" }
        ];
        const SCALE_LABELS = ["Poor", "Below expectations", "Good", "Very good", "Exceptional"];
        const DEPARTMENTS = ["Partnerships", "Event Management", "People", "Marketing", "Finance"];
        const RUBRIC = [
          { key: "ownership", label: "Ownership & Execution", weight: 30, prompt: "Can this person turn ideas into action?", anchors: ["Shows no initiative and waits for instructions", "Mainly participates in activities organized by others", "Completes tasks independently and takes responsibility", "Has independently initiated projects and delivered concrete results", "Has repeatedly built from scratch, overcome obstacles and shown exceptional ability to make things happen"] },
          { key: "growth", label: "Drive & Growth", weight: 20, prompt: "Does this person actively pursue growth?", anchors: ["Shows no clear motivation to develop", "Expresses ambition without supporting examples", "Regularly develops skills and sets goals", "Takes on demanding challenges and learns from mistakes", "Shows exceptional curiosity, self-directed learning and documented progress"] },
          { key: "communityService", label: "Community Service & Contribution", weight: 30, prompt: "Has this candidate demonstrated selfless commitment to developing communities and helping others?", anchors: ["Shows no interest in supporting others or the community", "Expresses interest without concrete examples", "Has concrete experience helping others or contributing to organizational activities", "Regularly gives their time to others, including beyond their responsibilities", "Shows sustained, exceptional commitment and a real positive impact on others"] },
          { key: "motivation", label: "Motivation & Commitment", weight: 20, prompt: "Does this candidate genuinely want to be part of START Warsaw?", anchors: ["Does not understand START or does not intend to engage", "Is motivated almost entirely by CV building and networking", "Understands the organization and expresses realistic commitment", "Has concrete ideas for their contribution and understands expectations", "Understands START’s mission very well and has a credible plan for active involvement"] }
        ];
        const state = {
          me: null, candidates: [], ownReviews: new Map(), drafts: new Map(), activeId: null,
          queueFilter: "todo", queueSearch: "", view: "review", results: null, resultError: "",
          coordinatorFilter: "", resultStatus: "all", coordinatorSearch: "", resultAttempt: 0,
          submitting: false, settingsBusy: false, activeAnswer: "achievement", successMessage: ""
        };
        const $ = (selector, root) => (root || document).querySelector(selector);
        const el = (tag, className, text) => {
          const node = document.createElement(tag);
          if (className) node.className = className;
          if (text !== undefined && text !== null) node.textContent = String(text);
          return node;
        };
        const textValue = value => {
          if (value === null || value === undefined) return "";
          if (typeof value === "string") return value;
          if (typeof value === "number" || typeof value === "boolean") return String(value);
          if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("\n");
          if (typeof value === "object") return Object.entries(value).map(entry => entry[0] + ": " + textValue(entry[1])).join("\n");
          return "";
        };
        const displayOr = (value, fallback) => {
          const text = textValue(value).trim();
          return text || fallback;
        };
        const finite = value => Number.isFinite(Number(value)) && value !== null && value !== "" ? Number(value) : null;
        const safeId = value => value === null || value === undefined ? "" : String(value);
        const candidateById = id => state.candidates.find(candidate => safeId(candidate.id) === safeId(id));
        const ownReviewFor = id => state.ownReviews.get(safeId(id)) || null;
        const isClosed = () => Boolean(state.me && state.me.reviewingClosed);
        const isCoordinator = () => Boolean(state.me && state.me.isCoordinator);
        const setHidden = (node, hidden) => { const target = typeof node === "string" ? $(node) : node; if (target) target.hidden = Boolean(hidden); };
        const setText = (selector, value) => { const node = $(selector); if (node) node.textContent = value == null ? "" : String(value); };
        const fmtNumber = (value, digits) => {
          const n = finite(value);
          return n === null ? "—" : n.toFixed(digits == null ? 1 : digits);
        };
        const safeDate = value => {
          const date = value ? new Date(value) : null;
          return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date) : "Date unavailable";
        };
        class ApiError extends Error {
          constructor(status, code, userMessage) { super(code || "request_failed"); this.status = status; this.code = code || "request_failed"; this.userMessage = typeof userMessage === "string" ? userMessage : ""; }
        }
        async function api(path, options) {
          const opts = options || {};
          const headers = Object.assign({ "Accept": "application/json" }, opts.headers || {});
          if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
          let response;
          try {
            response = await fetch(path, Object.assign({}, opts, { headers, cache: "no-store", credentials: "same-origin" }));
          } catch (error) {
            throw new ApiError(0, "network_error");
          }
          let body = null;
          try { body = await response.json(); } catch (error) { body = null; }
          if (!response.ok) throw new ApiError(response.status, body && body.error, body && body.message);
          return body || {};
        }
        function showGlobalNotice(message, kind) {
          const notice = $("#globalNotice");
          notice.classList.toggle("notice-error", kind === "error");
          setText("#globalNoticeText", message);
          setHidden(notice, !message);
        }
        function showError(title, message, signIn) {
          setHidden("#loadingState", true);
          setHidden("#reviewerView", true);
          setHidden("#coordinatorView", true);
          setHidden("#closedState", true);
          setHidden("#finishedState", true);
          setHidden("#errorState", false);
          setText("#errorTitle", title);
          setText("#errorText", message);
          setHidden("#signInAction", !signIn);
        }
        function setRoomStatus() {
          const closed = isClosed();
          $("#roomStatusDot").classList.toggle("closed", closed);
          setText("#roomStatusText", closed ? "Reviewing closed" : "Reviewing open");
          setHidden("#closeReviewButton", !isCoordinator());
          if (isCoordinator()) {
            $("#closeReviewButton").textContent = closed ? "Reopen reviewing" : "Close reviewing";
            $("#closeReviewButton").disabled = state.settingsBusy;
            $("#closeReviewButton").setAttribute("aria-label", closed ? "Reopen candidate reviewing for everyone" : "Close candidate reviewing for everyone");
          }
          setHidden("#coordinatorNav", !state.me || (closed && !isCoordinator()));
        }
        function getCurrentCandidate() { return candidateById(state.activeId); }
        function reviewWeight(scores) {
          if (!scores) return null;
          const values = RUBRIC.map(item => finite(scores[item.key]));
          if (values.some(value => value === null)) return null;
          return RUBRIC.reduce((sum, item) => sum + Number(scores[item.key]) * item.weight, 0) / 5;
        }
        function reviewOverall(review) {
          const supplied = finite(review && review.weightedScore);
          return supplied === null ? reviewWeight(review && review.scores) : supplied;
        }
        function getDraft(candidate) {
          const id = safeId(candidate.id);
          if (!state.drafts.has(id)) state.drafts.set(id, { scores: {}, department: "", departmentFit: "", notes: "", founderPotential: "" });
          return state.drafts.get(id);
        }
        function renderScoreRubric() {
          const container = $("#scoreList");
          container.replaceChildren();
          for (const item of RUBRIC) {
            const fieldset = el("fieldset", "score-block");
            fieldset.append(el("legend", "sr-only", item.label + ", weight " + item.weight + " percent"));
            const top = el("div", "score-topline");
            const label = el("label", "score-legend", item.label);
            label.htmlFor = "score-" + item.key;
            top.append(label, el("span", "score-weight", item.weight + "%"));
            fieldset.append(top, el("p", "score-prompt", item.prompt));
            const select = el("select", "select-control score-select");
            select.id = "score-" + item.key;
            select.dataset.scoreKey = item.key;
            select.setAttribute("aria-label", item.label + " score");
            select.setAttribute("aria-describedby", "score-help-" + item.key);
            select.append(new Option("Choose a score", ""));
            item.anchors.forEach((anchor, index) => {
              const score = index + 1;
              select.append(new Option(score + " · " + SCALE_LABELS[index], String(score)));
            });
            select.append(new Option("Not enough evidence", "unknown"));
            const help = el("p", "score-help", ""); help.id = "score-help-" + item.key;
            select.hidden = true;
            const choices = el("div", "score-choices");
            choices.setAttribute("role", "group");
            choices.setAttribute("aria-label", item.label + " rating");
            choices.setAttribute("aria-describedby", "score-help-" + item.key);
            ["1", "2", "3", "4", "5", "unknown"].forEach(value => {
              const button = el("button", "score-choice", value === "unknown" ? "?" : value);
              button.type = "button";
              button.dataset.scoreChoice = item.key;
              button.dataset.value = value;
              const description = value === "unknown" ? "Not enough evidence" : value + " · " + SCALE_LABELS[Number(value) - 1];
              button.setAttribute("aria-label", item.label + ": " + description);
              button.setAttribute("aria-pressed", "false");
              button.setAttribute("aria-describedby", "score-help-" + item.key);
              button.title = description;
              choices.append(button);
            });
            fieldset.append(select, choices, help);
            $("#scoreList").append(fieldset);
          }
        }
        function renderIdentity() {
          const user = state.me && state.me.user;
          const email = user && textValue(user.email).trim();
          setText("#identityEmail", email || "Signed in");
        }
        function candidateDepartmentChoices(candidate) {
          const choices = [];
          [candidate.firstDepartment, candidate.secondDepartment].forEach(value => {
            const department = textValue(value).trim();
            if (DEPARTMENTS.includes(department) && !choices.includes(department)) choices.push(department);
          });
          DEPARTMENTS.forEach(department => { if (!choices.includes(department)) choices.push(department); });
          return choices;
        }
        function renderDepartmentStrip(candidate) {
          const first = textValue(candidate.firstDepartment).trim();
          const second = textValue(candidate.secondDepartment).trim();
          const node = $("#departmentStrip");
          node.replaceChildren();
          node.append(document.createTextNode("Department preferences · "));
          const strong = el("strong", "", first || "Not provided");
          node.append(strong);
          if (second) {
            node.append(document.createTextNode("  /  Also considering "));
            node.append(el("strong", "", second));
          }
        }
        function renderCandidateBasics(candidate) {
          const index = state.candidates.findIndex(item => safeId(item.id) === safeId(candidate.id));
          setText("#candidateOrdinal", "APPLICATION " + String(index + 1).padStart(2, "0") + " / " + String(state.candidates.length).padStart(2, "0"));
          setText("#candidateName", displayOr(candidate.name, "Name not provided"));
          setText("#candidateCity", displayOr(candidate.city, "Location not provided"));
          const chips = $("#candidateChips");
          chips.replaceChildren();
          [
            ["Time available", candidate.hours],
            ["Commitment", candidate.commitment]
          ].forEach(pair => {
            const value = textValue(pair[1]).trim();
            if (value) {
              const chip = el("span", "chip");
              chip.append(el("strong", "", pair[0] + " · "));
              chip.append(document.createTextNode(value));
              chips.append(chip);
            }
          });
          renderDepartmentStrip(candidate);
          renderTeamActivity();
          const evidence = textValue(candidate.evidence).trim();
          setHidden("#candidateEvidence", !evidence);
          setText("#candidateEvidenceText", evidence);
          renderAiBrief(candidate.ai, candidate);
        }
        function aiRecommendation(value) {
          const text = textValue(value).trim().toLowerCase();
          if (!text) return "AI view unavailable";
          if (text === "good fit" || text === "strong fit" || text === "poor fit") return text.charAt(0).toUpperCase() + text.slice(1);
          if (text.includes("interview")) return "Interview priority";
          if (text.includes("limited") || text.includes("poor") || text.includes("low")) return "Limited evidence";
          if (text.includes("clarif") || text.includes("discuss") || text.includes("moderate") || text.includes("uncertain")) return "Clarify";
          return text.charAt(0).toUpperCase() + text.slice(1);
        }
        function renderAiBrief(ai, candidate) {
          const data = ai && typeof ai === "object" ? ai : null;
          const historical = Boolean(data && data.historical);
          setText("#aiBriefTitle", historical ? "AI brief · previous rubric" : "AI reading aid");
          $("#aiScores").closest("details").hidden = historical;
          const recommendation = data && data.departmentRecommendation;
          setHidden("#departmentRecommendation", !recommendation);
          setText("#departmentRecommendationHeading", recommendation ? "Recommended: " + recommendation.department : "");
          setText("#departmentRecommendationReason", recommendation ? recommendation.reason : "");
          const match = !recommendation ? "" : recommendation.department === candidate.firstDepartment ? "Matches first choice" : recommendation.department === candidate.secondDepartment ? "Matches second choice" : "Outside selected departments · confirm interest";
          setText("#departmentRecommendationMatch", match ? match + " · Existing shortlist recommendation; not a new score" : "");
          setText("#aiRecommendation", data ? (historical ? "Previous-rubric fit: " : "First-choice fit: ") + aiRecommendation(data.fit) : "AI view unavailable");
          const reason = data ? textValue(data.reason).trim() : "";
          setText("#aiReason", reason || (data ? "No AI rationale was included for this application." : "No per-candidate AI assessment is available. Assess the application from the original answers."));
          const hasQuestion = data && Object.prototype.hasOwnProperty.call(data, "question");
          const question = hasQuestion ? textValue(data.question).trim() : "";
          setHidden("#aiQuestion", !hasQuestion);
          setText("#aiQuestion", hasQuestion ? (question || "No specific uncertainty question was returned.") : "");
          setHidden("#publicEvidenceLead", !data || !data.publicEvidenceSummary);
          setText("#publicEvidenceLead", data && data.publicEvidenceSummary || "");
          const sources = data && Array.isArray(data.externalEvidence) ? data.externalEvidence : [];
          setHidden("#publicEvidence", sources.length === 0);
          setText("#publicEvidenceTitle", "Public evidence · " + sources.length + " checks");
          const sourceList = $("#publicEvidenceList"); sourceList.replaceChildren();
          const statuses = {"artifact-visible":"Public artifact", "self-reported-profile":"Self-reported profile", "independently-corroborated":"Organizer record", "inaccessible":"Source unavailable", "identity-unconfirmed":"Identity not matched", "no-public-evidence":"Not corroborated in this pass"};
          for (const source of sources) {
            const row = el("div", "source-check");
            if (source.url && /^https?:\/\//i.test(source.url)) {
              const link = el("a", "", source.title || "View source"); link.href=source.url; link.target="_blank"; link.rel="noopener noreferrer"; row.append(link);
            } else row.append(el("span", "", source.title || "Public check"));
            row.append(el("div", "source-status", (statuses[source.status] || "Public source") + " · checked " + (data.checkedDate || "18 October 2026")));
            row.append(el("p", "", source.summary));
            if(source.limits) row.append(el("p", "", "Limit: " + source.limits));
            sourceList.append(row);
          }
          const scores = $("#aiScores"); scores.replaceChildren();
          for (const item of RUBRIC) {
            const raw = data && data.scores && Object.prototype.hasOwnProperty.call(data.scores, item.key) ? data.scores[item.key] : null;
            const value = finite(raw); const card = el("div", "ai-score");
            card.append(el("span", "ai-score-label", item.label));
            card.append(el("span", "ai-score-value" + (value === null ? " unknown" : ""), value === null ? "Unknown" : fmtNumber(value, 1) + " / 5"));
            if (data && data.criterionReasons && data.criterionReasons[item.key]) card.append(el("p", "criterion-reason", data.criterionReasons[item.key]));
            scores.append(card);
          }
          const hasWeighted = data && !historical && Object.prototype.hasOwnProperty.call(data, "weightedScore");
          const weighted = hasWeighted ? finite(data.weightedScore) : null;
          setHidden("#aiTotal", !hasWeighted); $("#aiTotal").classList.toggle("incomplete", hasWeighted && weighted === null);
          setText("#aiTotal", !hasWeighted ? "" : weighted === null ? "Preliminary weighted score · Unknown · incomplete evidence, interview needed" : "Preliminary weighted score · " + fmtNumber(weighted, 1) + " / 100");
        }
        function answerQuestion(candidate, key) {
          const item = ANSWERS.find(answer => answer.key === key);
          return item ? item.question : "";
        }
        function renderAnswerTabs(candidate) {
          const tabs = $("#answerTabs");
          tabs.replaceChildren();
          if (!ANSWERS.some(item => item.key === state.activeAnswer)) state.activeAnswer = ANSWERS[0].key;
          for (const item of ANSWERS) {
            const button = el("button", "tab-button", item.label);
            button.type = "button";
            button.id = "answerTab-" + item.key;
            button.setAttribute("role", "tab");
            button.setAttribute("aria-selected", String(item.key === state.activeAnswer));
            button.setAttribute("aria-controls", "answerPanel");
            button.tabIndex = item.key === state.activeAnswer ? 0 : -1;
            button.dataset.answerKey = item.key;
            tabs.append(button);
          }
          renderActiveAnswer(candidate);
        }
        function renderActiveAnswer(candidate) {
          const item = ANSWERS.find(answer => answer.key === state.activeAnswer) || ANSWERS[0];
          const answer = candidate.answers ? textValue(candidate.answers[item.key]).trim() : "";
          const question = answerQuestion(candidate, item.key);
          setText("#answerTitle", item.title);
          setHidden("#answerQuestion", !question);
          setText("#answerQuestion", question);
          const copy = $("#answerCopy");
          copy.textContent = "";
          copy.classList.toggle("answer-empty", !answer);
          copy.textContent = answer || "No response provided for this section.";
          $("#answerPanel").setAttribute("aria-labelledby", "answerTab-" + item.key);
        }
        function selectedDepartment(candidate, draft) {
          const choice = draft.department || "";
          const options = candidateDepartmentChoices(candidate);
          return options.includes(choice) ? choice : "";
        }
        function populateDepartmentSelect(candidate, draft) {
          const select = $("#departmentSelect");
          select.replaceChildren();
          select.append(new Option("Choose a department", ""));
          const options = candidateDepartmentChoices(candidate);
          options.forEach(value => select.append(new Option(value, value)));
          const saved = selectedDepartment(candidate, draft);
          select.value = saved || candidate.firstDepartment || "";
        }
        function updateNotesHint() {
          const count = $("#notes").value.trim().length;
          const node = $("#notesCount");
          node.textContent = count + " / 15 minimum";
          node.classList.toggle("invalid", count > 0 && count < 15);
        }
        function updateScoreHelp(key, value) {
          const item = RUBRIC.find(row => row.key === key); const node = $("#score-help-" + key);
          if (!item || !node) return;
          document.querySelectorAll('[data-score-choice="' + key + '"]').forEach(button => {
            button.setAttribute("aria-pressed", String(button.dataset.value === value));
          });
          if (value === "unknown") { node.textContent = "Not enough evidence · interview needed for this criterion."; return; }
          const index = Number(value) - 1;
          node.textContent = index >= 0 && index < 5 ? item.anchors[index] : "";
        }
        function fillForm(candidate, draft) {
          RUBRIC.forEach(item => {
            const hasValue = Object.prototype.hasOwnProperty.call(draft.scores, item.key);
            const value = !hasValue ? "" : draft.scores[item.key] === null ? "unknown" : String(draft.scores[item.key]);
            $("#score-" + item.key).value = value; updateScoreHelp(item.key, value);
          });
          populateDepartmentSelect(candidate, draft);
          $("#fitSelect").value = draft.departmentFit || "";
          $("#notes").value = draft.notes || "";
          $("#founderPotential").value = draft.founderPotential || "Unsure";
          setHidden("#draftLabel", !hasDraftContent(draft));
          updateNotesHint();
        }
        function hasDraftContent(draft) {
          return Boolean(Object.keys(draft.scores || {}).length || draft.department || draft.departmentFit || draft.notes || draft.founderPotential);
        }
        function renderReceipt(review) {
          const receipt = $("#reviewReceipt");
          receipt.replaceChildren();
          const score = reviewOverall(review);
          receipt.append(el("h4", "", "Your review is submitted"));
          receipt.append(el("div", "receipt-score", score === null ? "Incomplete evidence · interview needed" : fmtNumber(score, 1) + " / 100"));
          const meta = el("div", "receipt-meta");
          meta.textContent = "Department · " + displayOr(review.department, "Not recorded") + "  /  Fit · " + displayOr(review.departmentFit, "Not recorded") + "  /  Submitted " + safeDate(review.submittedAt);
          receipt.append(meta);
          const dimensions = el("div", "receipt-dimensions");
          RUBRIC.forEach(item => {
            const hasScore = review.scores && Object.prototype.hasOwnProperty.call(review.scores, item.key);
            const value = hasScore ? review.scores[item.key] : undefined;
            dimensions.append(el("span", "", item.label + " · " + (value === null ? "Not enough evidence" : value === undefined ? "Not recorded" : value + " / 5")));
          });
          receipt.append(dimensions);
          if (review.founderPotential) receipt.append(el("div", "receipt-meta", "Founder potential · " + textValue(review.founderPotential)));
          if (review.notes) receipt.append(el("p", "receipt-note", review.notes));
          setHidden(receipt, false);
        }
        function setReviewLocked(locked) {
          const controls = $("#reviewInputs");
          controls.querySelectorAll("input,select,textarea,button").forEach(node => { node.disabled = locked; });
          $("#reviewForm").setAttribute("aria-busy", String(state.submitting));
          setHidden("#closedFormNote", !isClosed() || ownReviewFor(state.activeId));
        }
        function renderActiveCandidate() {
          if (isClosed() && !isCoordinator()) { showFinished(); return; }
          const candidate = getCurrentCandidate();
          if (!candidate) {
            setHidden("#reviewerView", true);
            setHidden("#finishedState", true);
            return;
          }
          setHidden("#reviewerView", false);
          setHidden("#finishedState", true);
          setHidden("#successNotice", !state.successMessage);
          setText("#successNotice", state.successMessage);
          setReviewStage(false);
          renderCandidateBasics(candidate);
          $("#contextText").value = commentDrafts.get(candidate.id) || "";
          loadComments(candidate.id);
          renderAnswerTabs(candidate);
          const own = ownReviewFor(candidate.id);
          if (own) {
            setHidden("#reviewInputs", true);
            renderReceipt(own);
            setHidden("#closedFormNote", true);
            setHidden("#draftLabel", true);
          } else {
            setHidden("#reviewInputs", false);
            setHidden("#reviewReceipt", true);
            const draft = getDraft(candidate);
            fillForm(candidate, draft);
            setReviewLocked(isClosed() || state.submitting);
          }
          renderQueue();
        }
        function queueStatus(candidate) {
          if (ownReviewFor(candidate.id)) return "done";
          if (hasDraftContent(getDraft(candidate))) return "draft";
          return "todo";
        }
        function renderQueue() {
          const select = $("#candidateSelect"); if (!select) return;
          const search = state.queueSearch.trim().toLowerCase();
          const matches = state.candidates.filter(candidate => (textValue(candidate.name) + " " + textValue(candidate.city) + " " + textValue(candidate.firstDepartment) + " " + textValue(candidate.secondDepartment)).toLowerCase().includes(search));
          const active = candidateById(state.activeId), visible = matches.slice();
          if (active && !visible.some(candidate => safeId(candidate.id) === safeId(active.id))) visible.unshift(active);
          select.replaceChildren();
          visible.forEach(candidate => {
            const index = state.candidates.findIndex(item => safeId(item.id) === safeId(candidate.id));
            const status = ownReviewFor(candidate.id) ? "Reviewed" : hasDraftContent(getDraft(candidate)) ? "Draft" : "To review";
            select.append(new Option(String(index + 1).padStart(2, "0") + " · " + displayOr(candidate.name, "Name not provided") + " · " + status, safeId(candidate.id)));
          });
          if (!visible.length) select.append(new Option("No candidates match", ""));
          select.value = state.activeId && visible.some(candidate => safeId(candidate.id) === safeId(state.activeId)) ? safeId(state.activeId) : "";
          const index = state.candidates.findIndex(candidate => safeId(candidate.id) === safeId(state.activeId));
          $("#previousCandidate").disabled = index <= 0; $("#nextCandidate").disabled = index < 0 || index >= state.candidates.length - 1;
          setText("#queueCount", state.ownReviews.size + " / " + state.candidates.length + " reviewed");
          setHidden("#candidateSwitcher", state.view === "coordinator" || !state.candidates.length || (isClosed() && !isCoordinator()));
        }
        function firstUnreviewed(startIndex) {
          const length = state.candidates.length;
          if (!length) return null;
          for (let offset = 1; offset <= length; offset += 1) {
            const index = (startIndex + offset) % length;
            if (!ownReviewFor(state.candidates[index].id)) return state.candidates[index];
          }
          return null;
        }
        function goToCandidate(id) {
          if (!candidateById(id)) return;
          stopActivity();
          state.activeId = safeId(id);
          state.activeAnswer = "achievement";
          state.successMessage = "";
          setHidden("#finishedState", true);
          renderActiveCandidate();
        }
        function scoreDraftFromForm(candidate) {
          const draft = getDraft(candidate);
          RUBRIC.forEach(item => { const value = $("#score-" + item.key).value; if (value === "unknown") draft.scores[item.key] = null; else if (value === "") delete draft.scores[item.key]; else draft.scores[item.key] = Number(value); });
          draft.department = $("#departmentSelect").value; draft.departmentFit = $("#fitSelect").value; draft.notes = $("#notes").value; draft.founderPotential = $("#founderPotential").value;
          setHidden("#draftLabel", !hasDraftContent(draft)); renderQueue(); return draft;
        }
        function validateReview(candidate, draft) {
          for (const item of RUBRIC) {
            if (!Object.prototype.hasOwnProperty.call(draft.scores, item.key)) return "Choose a score or mark not enough evidence for " + item.label.toLowerCase() + ".";
            const value = draft.scores[item.key];
            if (value !== null && (!Number.isInteger(value) || value < 1 || value > 5)) return "Choose a valid score for " + item.label.toLowerCase() + ".";
          }
          if (!draft.department || !draft.department.trim()) return "Choose the department you recommend.";
          if (!draft.departmentFit) return "Choose a department fit verdict.";
          if (draft.notes.trim().length < 15) return "Add an evidence note of at least 15 characters.";
          if (!["Definitely yes", "Probably yes", "Unsure", "Probably not", "Definitely not"].includes(draft.founderPotential || "Unsure")) return "Choose a valid founder-potential response.";
          return "";
        }
        function founderValue(value) {
          return ["Definitely yes", "Probably yes", "Unsure", "Probably not", "Definitely not"].includes(value) ? value : "Unsure";
        }
        function normalizeOwnReview(raw, fallback) {
          const review = Object.assign({}, fallback || {}, raw || {});
          if ((review.candidateId === undefined || review.candidateId === null) && fallback) review.candidateId = fallback.candidateId;
          if (!review.submittedAt && fallback) review.submittedAt = fallback.submittedAt;
          return review;
        }
        function acceptOwnReview(review) {
          if (!review || review.candidateId === undefined || review.candidateId === null) return;
          state.ownReviews.set(safeId(review.candidateId), review);
          state.drafts.delete(safeId(review.candidateId));
        }
        async function reloadOwnCandidates() {
          const payload = await api("/api/candidates");
          state.candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
          state.ownReviews = new Map();
          (Array.isArray(payload.reviews) ? payload.reviews : []).forEach(review => acceptOwnReview(review));
        }
        async function recoverExistingReview(candidateId) {
          await reloadOwnCandidates();
          return ownReviewFor(candidateId);
        }
        async function submitReview(event) {
          event.preventDefault();
          if (state.submitting) return;
          const candidate = getCurrentCandidate();
          if (!candidate || ownReviewFor(candidate.id) || isClosed()) return;
          const draft = scoreDraftFromForm(candidate);
          const error = validateReview(candidate, draft);
          if (error) {
            setText("#formError", error);
            setHidden("#formError", false);
            const missingScore = RUBRIC.find(item => !Object.prototype.hasOwnProperty.call(draft.scores, item.key));
            if (missingScore) document.querySelector('[data-score-choice="' + missingScore.key + '"]').focus();
            else if (!draft.department) $("#departmentSelect").focus();
            else if (!draft.departmentFit) $("#fitSelect").focus();
            else if (draft.notes.trim().length < 15) $("#notes").focus();
            return;
          }
          setHidden("#formError", true);
          state.submitting = true;
          setReviewLocked(true);
          $("#submitReview").textContent = "Submitting…";
          const payload = {
            candidateId: candidate.id,
            scores: {
              ownership: draft.scores.ownership,
              growth: draft.scores.growth,
              communityService: draft.scores.communityService,
              motivation: draft.scores.motivation,
            },
            departmentFit: draft.departmentFit,
            department: draft.department.trim(),
            notes: draft.notes.trim()
          };
          const founder = founderValue(draft.founderPotential);
          payload.founderPotential = founder;
          try {
            const response = await api("/api/reviews", { method: "POST", body: JSON.stringify(payload) });
            const own = normalizeOwnReview(response.review, {
              candidateId: candidate.id, scores: payload.scores, departmentFit: payload.departmentFit,
              department: payload.department, notes: payload.notes, founderPotential: founder,
              weightedScore: reviewWeight(payload.scores), submittedAt: new Date().toISOString(),
              reviewerEmail: state.me && state.me.user ? state.me.user.email : undefined
            });
            acceptOwnReview(own);
            stopActivity();
            loadActivity();
            state.submitting = false;
            $("#submitReview").textContent = "Submit & next";
            const currentIndex = state.candidates.findIndex(item => safeId(item.id) === safeId(candidate.id));
            const next = firstUnreviewed(currentIndex);
            const overall = reviewOverall(own);
            state.successMessage = overall === null
              ? "Review submitted for " + displayOr(candidate.name, "this candidate") + ". Incomplete evidence · interview needed."
              : "Review submitted for " + displayOr(candidate.name, "this candidate") + ". Your weighted score is " + fmtNumber(overall, 1) + " / 100.";
            if (next) {
              state.activeId = safeId(next.id);
              state.activeAnswer = "achievement";
              renderActiveCandidate();
              requestAnimationFrame(() => $("#candidateName").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
            } else {
              state.activeId = safeId(candidate.id);
              setHidden("#reviewerView", true);
              setHidden("#finishedState", false);
              setText("#finishedCopy", "Your " + state.ownReviews.size + " submitted review" + (state.ownReviews.size === 1 ? " is" : "s are") + " saved. You can revisit your own ratings from the queue.");
              renderQueue();
            }
          } catch (error) {
            if (error.status === 409) {
              try {
                const saved = await recoverExistingReview(candidate.id);
                if (saved) {
                  state.submitting = false;
                  $("#submitReview").textContent = "Submit & next";
                  state.successMessage = "This review was already submitted and is now locked.";
                  const currentIndex = state.candidates.findIndex(item => safeId(item.id) === safeId(candidate.id));
                  const next = firstUnreviewed(currentIndex);
                  if (next) { state.activeId = safeId(next.id); renderActiveCandidate(); }
                  else { state.activeId = null; setHidden("#reviewerView", true); setHidden("#finishedState", false); renderQueue(); }
                  return;
                }
              } catch (reloadError) {
                setText("#formError", "The server reports this review may already be submitted, but your saved review could not be refreshed. Try refreshing before submitting again.");
              }
            } else if (error.status === 403 && (isClosed() || error.code === "reviewing_closed")) {
              state.me.reviewingClosed = true;
              setRoomStatus();
              setText("#formError", error.userMessage || "Reviewing has closed. Your draft is still held in this page.");
            } else if (error.status === 401) {
              setText("#formError", error.userMessage || "Your sign-in has expired. Sign in again before submitting. Your draft remains in this page.");
            } else {
              setText("#formError", error.userMessage || "The review was not confirmed. Your draft is still in memory; retry when the connection is available.");
            }
            setHidden("#formError", false);
            state.submitting = false;
            $("#submitReview").textContent = "Retry submission";
            setReviewLocked(isClosed());
          }
        }
        function setActiveView(view) {
          if (isClosed() && !isCoordinator()) { showFinished(); return; }
          if (view === "coordinator" && (!state.me || (isClosed() && !isCoordinator()))) return;
          state.view = view;
          document.body.dataset.view = view;
          const coordinator = view === "coordinator";
          if (coordinator) stopActivity();
          loadActivity();
          setHidden("#reviewerView", coordinator || !state.candidates.length || !state.activeId);
          setHidden("#coordinatorView", !coordinator);
          setHidden("#candidateSwitcher", coordinator || !state.candidates.length || (isClosed() && !isCoordinator()));
          $("#reviewNav").classList.toggle("active", !coordinator);
          $("#coordinatorNav").classList.toggle("active", coordinator);
          $("#reviewNav").setAttribute("aria-current", coordinator ? "false" : "page");
          $("#coordinatorNav").setAttribute("aria-current", coordinator ? "page" : "false");
          setHidden("#finishedState", coordinator || Boolean(state.activeId) || state.candidates.length === 0 || state.ownReviews.size < state.candidates.length);
          if (coordinator) loadResults(false);
          else if (state.activeId) renderActiveCandidate();
        }
        function showFinished() {
          state.activeId = null;
          setHidden("#reviewerView", true);
          setHidden("#coordinatorView", true);
          setHidden("#finishedState", true);
          setHidden("#closedState", false);
          setHidden("#candidateSwitcher", true);
          setText("#queueCount", state.ownReviews.size + " / " + state.candidates.length + " reviewed");
        }
        async function toggleReviewing() {
          if (!isCoordinator() || state.settingsBusy) return;
          state.settingsBusy = true;
          setRoomStatus();
          const next = !isClosed();
          try {
            const result = await api("/api/settings", { method: "POST", body: JSON.stringify({ reviewingClosed: next }) });
            state.me.reviewingClosed = Boolean(result.settings && result.settings.reviewingClosed);
            setRoomStatus();
            showGlobalNotice(state.me.reviewingClosed ? "Reviews are now closed. New submissions are disabled for everyone." : "Reviews are open again. Signed-in participants can continue their independent reviews.", "success");
            if (state.view === "review" && state.activeId) renderActiveCandidate();
            if (state.view === "coordinator") {
              state.results = null;
              loadResults(true);
            }
          } catch (error) {
            showGlobalNotice(error.userMessage || (error.status === 403 ? "The server could not authorize this settings change." : "The reviewing setting was not changed. Try again when the connection is available."), "error");
          } finally {
            state.settingsBusy = false;
            setRoomStatus();
          }
        }
        function calculateStats(candidate, reviews, aggregate) {
          const reviewList = reviews || [];
          const means = {};
          const unknownByCriterion = {};
          for (const item of RUBRIC) {
            const backendValue = aggregate && aggregate.averageScores ? finite(aggregate.averageScores[item.key]) : null;
            const values = reviewList.map(review => finite(review.scores && review.scores[item.key])).filter(value => value !== null);
            means[item.key] = backendValue !== null ? backendValue : values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
            const suppliedUnknown = aggregate && aggregate.unknownScoresByCriterion ? finite(aggregate.unknownScoresByCriterion[item.key]) : null;
            unknownByCriterion[item.key] = suppliedUnknown !== null ? suppliedUnknown : reviewList.filter(review => review.scores && Object.prototype.hasOwnProperty.call(review.scores, item.key) && review.scores[item.key] === null).length;
          }
          const overallBackend = aggregate && aggregate.averageScores ? finite(aggregate.averageScores.overall) : null;
          const totals = reviewList.map(reviewOverall).filter(value => value !== null);
          const overall = overallBackend !== null ? overallBackend : totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : null;
          const spread = totals.length >= 2 ? Math.max(...totals) - Math.min(...totals) : null;
          const count = aggregate && finite(aggregate.reviewCount) !== null ? finite(aggregate.reviewCount) : reviewList.length;
          const completeCount = aggregate && finite(aggregate.completeScoreCount) !== null ? finite(aggregate.completeScoreCount) : totals.length;
          const incompleteCount = aggregate && finite(aggregate.incompleteScoreCount) !== null ? finite(aggregate.incompleteScoreCount) : Math.max(0, count - completeCount);
          const unknownCriterionCount = aggregate && finite(aggregate.unknownCriterionCount) !== null
            ? finite(aggregate.unknownCriterionCount)
            : Object.values(unknownByCriterion).reduce((sum, value) => sum + value, 0);
          return { means, overall, spread, count, completeCount, incompleteCount, unknownByCriterion, unknownCriterionCount };
        }
        function candidateDepartment(candidate) {
          return textValue(candidate.firstDepartment).trim() || textValue(candidate.secondDepartment).trim() || "Department undecided";
        }
        function candidateStatus(stats) {
          if (stats.count === 0) return { key: "none", label: "No reviews" };
          if (stats.completeCount < 2 && stats.unknownCriterionCount > 0) return { key: "interview", label: "Incomplete evidence · interview needed" };
          if (stats.completeCount < 2) return { key: "wait", label: "Needs 2 complete scores" };
          if (stats.spread !== null && stats.spread >= 20) return { key: "discuss", label: "Discussion flagged" };
          return { key: "ready", label: "Ready for discussion" };
        }
        function tally(values) {
          const map = new Map();
          values.forEach(value => {
            const label = textValue(value).trim();
            if (label) map.set(label, (map.get(label) || 0) + 1);
          });
          return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        }
        function renderKpis(payload, allItems) {
          const container = $("#kpiGrid");
          container.replaceChildren();
          const aggregates = payload.aggregates || {};
          const totalReviews = finite(aggregates.reviewCount) !== null ? finite(aggregates.reviewCount) : state.results.reviews.length;
          setText("#queueCount", totalReviews + " reviews · " + allItems.length + " applications");
          const complete = finite(aggregates.completeScoreCount) !== null ? finite(aggregates.completeScoreCount) : allItems.reduce((sum, item) => sum + item.stats.completeCount, 0);
          const incomplete = finite(aggregates.incompleteScoreCount) !== null ? finite(aggregates.incompleteScoreCount) : allItems.reduce((sum, item) => sum + item.stats.incompleteCount, 0);
          const unknown = finite(aggregates.unknownCriterionCount) !== null ? finite(aggregates.unknownCriterionCount) : allItems.reduce((sum, item) => sum + item.stats.unknownCriterionCount, 0);
          const ready = allItems.filter(item => item.stats.completeCount >= 2 && !(item.stats.spread !== null && item.stats.spread >= 20)).length;
          const flagged = allItems.filter(item => item.stats.completeCount >= 2 && item.stats.spread !== null && item.stats.spread >= 20).length;
          [
            ["Applications", allItems.length, "Entire cohort retained"],
            ["Submitted reviews", totalReviews, "Independent ratings received"],
            ["Complete scores", complete, "All four criteria have numeric scores"],
            ["Incomplete reviews", incomplete, "At least one criterion marked unknown"],
            ["Unknown criteria", unknown, "Evidence gaps counted across reviews"],
            ["Ready for discussion", ready, "At least two complete scores"],
            ["Discussion flags", flagged, "Complete score spread of 20 points or more"]
          ].forEach(item => {
            const card = el("div", "kpi");
            card.append(el("div", "kpi-label", item[0]));
            card.append(el("div", "kpi-value", item[1]));
            card.append(el("div", "kpi-foot", item[2]));
            container.append(card);
          });
        }
        function heatColor(value) {
          if (value === null || value === undefined) return "#f1eee7";
          const intensity = Math.max(0, Math.min(1, (Number(value) - 1) / 4));
          return "rgba(241, 90, 54, " + (0.06 + intensity * 0.28).toFixed(3) + ")";
        }
        function formatDimensionName(key) {
          const item = RUBRIC.find(rubric => rubric.key === key);
          return item ? item.label : key;
        }
        function reviewDetailCard(review) {
          const card = el("article", "individual-review");
          const head = el("div", "individual-review-head");
          const identity = textValue(review.reviewer && review.reviewer.email).trim() || textValue(review.reviewerEmail).trim() || "Reviewer identity unavailable";
          head.append(el("strong", "", identity));
          head.append(el("span", "", safeDate(review.submittedAt)));
          card.append(head);
          const choices = el("div", "individual-review-scores");
          const scoreLabels = RUBRIC.map(item => {
            const hasScore = review.scores && Object.prototype.hasOwnProperty.call(review.scores, item.key);
            const value = hasScore ? review.scores[item.key] : undefined;
            return item.label + " " + (value === null ? "Not enough evidence" : value === undefined ? "Not recorded" : value + "/5");
          }).join(" · ");
          const overall = reviewOverall(review);
          choices.textContent = scoreLabels + "  |  " + (overall === null ? "Incomplete evidence · interview needed" : fmtNumber(overall, 1) + " / 100") + "  |  " + displayOr(review.departmentFit, "Fit not recorded") + "  |  " + displayOr(review.department, "Department not recorded");
          card.append(choices);
          if (review.founderPotential) card.append(el("div", "individual-review-scores", "Founder potential · " + textValue(review.founderPotential)));
          if (review.notes) card.append(el("p", "", review.notes));
          return card;
        }
        function buildCandidateResult(candidate, reviewMap, aggregateMap) {
          const id = safeId(candidate.id);
          const reviews = reviewMap.get(id) || [];
          const aggregate = aggregateMap.get(id) || null;
          return { candidate, reviews, aggregate, stats: calculateStats(candidate, reviews, aggregate), department: candidateDepartment(candidate) };
        }
        function resultRow(item) {
          const reviews = item.reviews;
          const row = el("div", "result-row");
          const candidateCell = el("div", "result-candidate");
          candidateCell.append(el("strong", "", displayOr(item.candidate.name, "Name not provided")));
          const sub = [textValue(item.candidate.city).trim(), textValue(item.candidate.secondDepartment).trim()].filter(Boolean).join(" · ");
          candidateCell.append(el("span", "", sub || "No additional profile details"));
          row.append(candidateCell);
          const heatmap = el("div", "heatmap");
          RUBRIC.forEach(rubric => {
            const value = item.stats.means[rubric.key];
            const unknown = item.stats.unknownByCriterion[rubric.key] || 0;
            const cell = el("div", "heat-cell");
            cell.style.backgroundColor = heatColor(value);
            cell.setAttribute("aria-label", formatDimensionName(rubric.key) + " average " + (value === null ? "not available" : fmtNumber(value, 1) + " out of 5") + ", " + unknown + " reviews marked not enough evidence");
            cell.append(el("b", "", value === null ? "—" : fmtNumber(value, 1)));
            cell.append(el("span", "heat-label-full", formatDimensionName(rubric.key)));
            const shortLabel = {ownership:"Ownership",growth:"Growth",communityService:"Community service",motivation:"Motivation"}[rubric.key];
            const compactLabel = el("span", "heat-label-short", shortLabel);
            cell.append(compactLabel);
            cell.append(el("small", "result-unknown", unknown ? unknown + " unknown" : ""));
            heatmap.append(cell);
          });
          const overall = el("div", "heat-cell");
          overall.style.backgroundColor = item.stats.overall === null ? "#f1eee7" : "rgba(241,90,54," + Math.max(.06, Math.min(.34, item.stats.overall / 300)).toFixed(3) + ")";
          overall.append(el("b", "", item.stats.overall === null ? "—" : fmtNumber(item.stats.overall, 1)));
          overall.append(el("span", "", "Mean / 100"));
          heatmap.append(overall);
          row.append(heatmap);
          const status = candidateStatus(item.stats);
          const statusNode = el("div", "result-status " + status.key);
          const statusText = status.key === "discuss" ? "Discuss · " + fmtNumber(item.stats.spread, 0) + "pt spread" :
            status.key === "ready" && item.stats.incompleteCount ? "Ready · " + item.stats.incompleteCount + " incomplete" : status.label;
          statusNode.append(el("div", "", statusText));
          const active = el("div", "result-activity"); active.dataset.activityCandidate = safeId(item.candidate.id);
          statusNode.append(active);
          row.append(statusNode);
          const detail = el("div", "result-detail");
          const details = el("details");
          const summary = el("summary", "", item.stats.count + " review" + (item.stats.count === 1 ? "" : "s") + " · Department choices and reviewer notes");
          details.append(summary);
          const list = el("div", "individual-reviews");
          if (reviews.length) reviews.forEach(review => list.append(reviewDetailCard(review)));
          else list.append(el("div", "muted-copy", "No reviews have been submitted for this candidate."));
          const departments = tally(reviews.map(review => review.department));
          if (departments.length) {
            const departmentLine = el("div", "individual-review-scores", "Review department choices · " + departments.map(pair => pair[0] + " (" + pair[1] + ")").join(" · "));
            list.prepend(departmentLine);
          }
          details.append(list);
          detail.append(details);
          row.append(detail);
          return row;
        }
        function renderCoordinatorResults() {
          const payload = state.results;
          if (!payload) return;
          const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
          const legacy = payload.legacyReviews || [];
          setHidden("#legacyResults", !legacy.length);
          setText("#legacySummary", "Previous-rubric reviews · " + legacy.length);
          const legacyList = $("#legacyList"); legacyList.replaceChildren();
          for (const review of legacy) {
            const candidate = candidates.find(item => item.id === review.candidateId);
            const row = el("div", "individual-review");
            row.append(el("strong", "", (candidate ? candidate.name : review.candidateId) + " · " + review.reviewer.email));
            row.append(el("p", "", "Ownership: " + review.scores.ownership + " · Growth: " + review.scores.growth + " · Collaboration: " + review.scores.community + " · Problem solving: " + review.scores.problemSolving));
            row.append(el("p", "", review.notes));
            legacyList.append(row);
          }
          const allReviews = Array.isArray(payload.reviews) ? payload.reviews : [];
          const reviewMap = new Map();
          allReviews.forEach(review => {
            const id = safeId(review.candidateId);
            if (!reviewMap.has(id)) reviewMap.set(id, []);
            reviewMap.get(id).push(review);
          });
          const aggregateMap = new Map();
          const backendByCandidate = payload.aggregates && Array.isArray(payload.aggregates.byCandidate) ? payload.aggregates.byCandidate : [];
          backendByCandidate.forEach(aggregate => aggregateMap.set(safeId(aggregate.candidateId), aggregate));
          const allItems = candidates.map(candidate => buildCandidateResult(candidate, reviewMap, aggregateMap));
          renderKpis(payload, allItems);
          const depts = Array.from(new Set(allItems.map(item => item.department))).sort((a, b) => a.localeCompare(b));
          const deptSelect = $("#departmentFilter");
          const priorDept = state.coordinatorFilter;
          deptSelect.replaceChildren(new Option("All departments", ""));
          depts.forEach(department => deptSelect.append(new Option(department, department)));
          if (depts.includes(priorDept)) deptSelect.value = priorDept;
          else { deptSelect.value = ""; state.coordinatorFilter = ""; }
          const search = state.coordinatorSearch.trim().toLowerCase();
          const filtered = allItems.filter(item => {
            const status = candidateStatus(item.stats).key;
            const statusMatch = state.resultStatus === "all" ||
              (state.resultStatus === "needs" && item.stats.completeCount < 2) ||
              (state.resultStatus === "discuss" && status === "discuss") ||
              (state.resultStatus === "ready" && status === "ready");
            const departmentMatch = !state.coordinatorFilter || item.department === state.coordinatorFilter;
            const searchText = (textValue(item.candidate.name) + " " + item.department + " " + textValue(item.candidate.city)).toLowerCase();
            return statusMatch && departmentMatch && (!search || searchText.includes(search));
          });
          setText("#resultsSummary", filtered.length + " of " + allItems.length + " applications shown");
          const groups = $("#departmentGroups");
          groups.replaceChildren();
          if (!filtered.length) {
            groups.append(el("div", "no-results", "No applications match these filters."));
            return;
          }
          const grouped = new Map();
          filtered.forEach(item => {
            if (!grouped.has(item.department)) grouped.set(item.department, []);
            grouped.get(item.department).push(item);
          });
          Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(entry => {
            const department = entry[0];
            const items = entry[1];
            const group = el("section", "department-group");
            const head = el("header", "department-group-head");
            const heading = el("div");
            heading.append(el("h2", "", department));
            heading.append(el("p", "", items.length + " applicant" + (items.length === 1 ? "" : "s") + " · grouped by first department preference"));
            head.append(heading);
            const scores = items.map(item => item.stats.overall).filter(value => value !== null);
            const groupMean = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
            const average = el("div", "group-average");
            average.append(el("span", "", groupMean === null ? "No submitted ratings" : "Mean candidate score · " + fmtNumber(groupMean, 1) + " / 100"));
            const track = el("div", "bar-track");
            const fill = el("div", "bar-fill");
            fill.style.width = Math.max(0, Math.min(100, groupMean || 0)) + "%";
            track.append(fill);
            average.append(track);
            head.append(average);
            group.append(head);
            const tableHead = el("div", "result-table-head");
            ["Candidate", "Mean score by criterion · 1–5", "Reviews / status", ""].forEach(label => tableHead.append(el("div", "", label)));
            group.append(tableHead);
            items.forEach(item => group.append(resultRow(item)));
            groups.append(group);
          });
          state._allResultItems = allItems;
          renderTeamActivity();
        }
        async function loadResults(force) {
          if (!state.me || (isClosed() && !isCoordinator())) return;
          if (state.results && !force) { renderCoordinatorResults(); return; }
          if (state.resultAttempt) return;
          state.resultAttempt = 1;
          setHidden("#coordinatorError", true);
          $("#coordinatorContent").setAttribute("aria-busy", "true");
          try {
            const payload = await api("/api/results");
            if (isClosed() && !isCoordinator()) throw new ApiError(403, "reviewing_closed", "Reviewing is closed.");
            state.results = {
              candidates: Array.isArray(payload.candidates) ? payload.candidates : [],
              reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
              legacyReviews: Array.isArray(payload.legacyReviews) ? payload.legacyReviews : [],
              aggregates: payload.aggregates || {}
            };
            state.resultError = "";
            setHidden("#coordinatorContent", false);
            renderCoordinatorResults();
          } catch (error) {
            if (error.code === "reviewing_closed" && !isCoordinator()) clearClosedRoom();
            const message = error.userMessage || (error.status === 403 ? "Results are unavailable. Reviewing may have closed; refresh the page." :
              error.status === 401 ? "Your sign-in has expired. Refresh the page and sign in again." :
              "Results could not be loaded. Retry when the connection is available.");
            setText("#coordinatorError", message);
            setHidden("#coordinatorError", false);
            state.resultError = message;
          } finally {
            state.resultAttempt = 0;
            $("#coordinatorContent").removeAttribute("aria-busy");
          }
        }
        function safeCsvCell(value) {
          let text = value === null || value === undefined ? "" : String(value);
          if (/^[\u0000-\u0020\u007f\uFEFF]*[=+\-@]/.test(text)) text = "'" + text;
          return '"' + text.replace(/"/g, '""') + '"';
        }
        function exportCsv() {
          if (!state.me || (isClosed() && !isCoordinator()) || !state.results) return;
          const payload = state.results;
          const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
          const reviews = Array.isArray(payload.reviews) ? payload.reviews : [];
          const reviewMap = new Map();
          reviews.forEach(review => {
            const id = safeId(review.candidateId);
            if (!reviewMap.has(id)) reviewMap.set(id, []);
            reviewMap.get(id).push(review);
          });
          const aggregates = new Map();
          const byCandidate = payload.aggregates && Array.isArray(payload.aggregates.byCandidate) ? payload.aggregates.byCandidate : [];
          byCandidate.forEach(item => aggregates.set(safeId(item.candidateId), item));
          const columns = ["candidate_id","name","first_department","second_department","review_count","complete_score_count","incomplete_score_count","unknown_criterion_count","unknown_ownership","unknown_growth","unknown_community_service","unknown_motivation","mean_weighted_score_100","weighted_score_spread","status","ownership_mean","growth_mean","community_service_mean","motivation_mean","department_fit_counts","review_department_choices","founder_potential_counts"];
          const lines = [columns.map(safeCsvCell).join(",")];
          candidates.forEach(candidate => {
            const candidateReviews = reviewMap.get(safeId(candidate.id)) || [];
            const aggregate = aggregates.get(safeId(candidate.id)) || null;
            const stats = calculateStats(candidate, candidateReviews, aggregate);
            const status = candidateStatus(stats).label;
            const fitCounts = {};
            candidateReviews.forEach(review => { const key = textValue(review.departmentFit).trim(); if (key) fitCounts[key] = (fitCounts[key] || 0) + 1; });
            const founderCounts = {};
            candidateReviews.forEach(review => { const key = textValue(review.founderPotential).trim(); if (key) founderCounts[key] = (founderCounts[key] || 0) + 1; });
            const departmentChoices = tally(candidateReviews.map(review => review.department)).map(pair => pair[0] + ":" + pair[1]).join(" | ");
            const row = [
              candidate.id, candidate.name, candidate.firstDepartment, candidate.secondDepartment,
              stats.count, stats.completeCount, stats.incompleteCount, stats.unknownCriterionCount,
              stats.unknownByCriterion.ownership, stats.unknownByCriterion.growth, stats.unknownByCriterion.communityService, stats.unknownByCriterion.motivation,
              stats.overall, stats.spread, status,
              stats.means.ownership, stats.means.growth, stats.means.communityService, stats.means.motivation,
              JSON.stringify(fitCounts), departmentChoices, JSON.stringify(founderCounts)
            ];
            lines.push(row.map(safeCsvCell).join(","));
          });
          const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const anchor = el("a");
          anchor.href = url;
          anchor.download = "review-results.csv";
          document.body.append(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(url);
        }
        async function loadApplication() {
          setHidden("#loadingState", false);
          setHidden("#errorState", true);
          setHidden("#closedState", true);
          setHidden("#finishedState", true);
          setHidden("#reviewerView", true);
          setHidden("#coordinatorView", true);
          setHidden("#candidateSwitcher", true);
          try {
            const me = await api("/api/me");
            const user = me.user && typeof me.user === "object" ? me.user : null;
            if (!user || !user.id) {
              showError("Sign in to review applications.", "This room uses ChatGPT sign-in so each person can submit one independent review.", true);
              return;
            }
            state.me = { user, isCoordinator: Boolean(me.isCoordinator), configured: Boolean(me.configured), reviewingClosed: Boolean(me.reviewingClosed) };
            renderIdentity();
            setRoomStatus();
            if (!state.me.configured) {
              showError("The selection room is not configured yet.", "Your team needs to finish setting up the review store before applications can be opened.", false);
              return;
            }
            if (isClosed() && !isCoordinator()) {
              setHidden("#loadingState", true);
              showFinished();
              return;
            }
            await reloadOwnCandidates();
            setHidden("#datasetImport", !isCoordinator() || state.candidates.length > 0);
            loadActivity();
            setHidden("#loadingState", true);
            if (!state.candidates.length) {
              setHidden("#reviewerView", false);
              setText("#queueCount", "0 / 0 reviewed");
              setText("#candidateOrdinal", "NO APPLICATIONS");
              setText("#candidateName", "The queue is empty.");
              setText("#candidateCity", "There are no candidate records available to review.");
              setHidden("#sharedContext", true);
              setHidden("#startScoring", true);
              setHidden("#aiBrief", true);
              setHidden("#answersDisclosure", true);
              setHidden("#reviewInputs", true);
              setHidden("#reviewReceipt", true);
              return;
            }
            setHidden("#sharedContext", false);
            setHidden("#startScoring", false);
            setHidden("#aiBrief", false);
            setHidden("#answersDisclosure", false);
            setHidden("#reviewInputs", false);
            const next = state.candidates.find(candidate => !ownReviewFor(candidate.id));
            state.activeId = next ? safeId(next.id) : safeId(state.candidates[0].id);
            state.queueFilter = next ? "todo" : "done";
            renderQueue();
            if (next) {
              setHidden("#reviewerView", false);
              renderActiveCandidate();
            } else {
              state.activeId = safeId(state.candidates[0].id);
              setHidden("#finishedState", false);
              setText("#finishedCopy", "You have completed " + state.ownReviews.size + " of " + state.candidates.length + " applications. Select any application above to revisit your own rating.");
              renderQueue();
            }
            $("#coordinatorNav").hidden = false;
          } catch (error) {
            const signIn = error.status === 401;
            showError(signIn ? "Sign in to review applications." : "The selection room could not be opened.", signIn ? (error.userMessage || "Use ChatGPT sign-in to continue. Your identity is supplied by the signed-in session.") : (error.userMessage || "Check your connection and try again. No draft data is stored in browser storage."), signIn);
          }
        }

        function setReviewStage(scoring) {
          $("#reviewWorkspace").classList.toggle("is-scoring", scoring);
          if (scoring && state.activeId && !ownReviewFor(state.activeId)) markActivity(state.activeId);
          else if (!scoring) stopActivity();
          if (scoring) $("#reviewWorkspace").scrollIntoView({block:"start",behavior:"auto"});
        }
        // PRESENCE CEILING: one active candidate per account, best-effort idle and a server TTL.
        // Presence is activity, not a reservation; multi-tab ownership would need session-scoped records.
        let teamActivity = null;
        let activityLoading = false;
        let activityStale = false;
        let activityCandidate = null;
        let activityLastSent = 0;
        let activityWrites = Promise.resolve();
        function renderTeamActivity() {
          const item = teamActivity && teamActivity.candidates.find(row => safeId(row.candidateId) === safeId(state.activeId));
          const text = item ? "Team reviews · " + item.submittedCount + " submitted · " + item.completeCount + " complete scores · " + item.incompleteCount + " with evidence gaps · " + item.activeCount + " in progress" : "Team review activity unavailable";
          setText("#teamActivity", text + (activityStale ? " · refresh pending" : ""));
          $("#teamActivity").title = "In progress means active in the last 15 minutes. Draft answers and ratings are not shared until submitted.";
          const summary = teamActivity && teamActivity.reviewerSummary;
          setText("#reviewerCompletion", summary ? summary.startedCount + " reviewers started · " + summary.finishedAllCount + " finished all · " + summary.activeCount + " active" + (activityStale ? " · refresh pending" : "") : "Team activity unavailable");
          document.querySelectorAll("[data-activity-candidate]").forEach(node => {
            const row = teamActivity && teamActivity.candidates.find(item => safeId(item.candidateId) === node.dataset.activityCandidate);
            node.textContent = row ? row.activeCount + " in progress" : "Activity unavailable";
            node.title = "Active in the last 15 minutes; not a reservation.";
          });
        }
        function clearClosedRoom() {
          if (!state.me || isCoordinator()) return;
          state.me.reviewingClosed = true;
          state.results = null;
          state._allResultItems = [];
          teamActivity = null;
          activityCandidate = null;
          $("#legacyList").replaceChildren();
          setHidden("#legacyResults", true);
          $("#departmentGroups").replaceChildren();
          $("#kpiGrid").replaceChildren();
          setHidden("#coordinatorContent", true);
          setRoomStatus();
          showFinished();
        }
        async function loadActivity() {
          if (activityLoading || !state.me || (isClosed() && !isCoordinator())) return;
          activityLoading = true;
          try {
            const result = await api("/api/activity");
            if (isClosed() && !isCoordinator()) { clearClosedRoom(); return; }
            teamActivity = {candidates:Array.isArray(result.candidates) ? result.candidates : [], reviewerSummary:result.reviewerSummary};
            activityStale = false;
          } catch (error) {
            activityStale = true;
            if (error.code === "reviewing_closed") clearClosedRoom();
          } finally { activityLoading = false; renderTeamActivity(); }
        }
        function queueActivity(candidateId, status) {
          activityWrites = activityWrites.catch(() => {}).then(async () => {
            try { await api("/api/activity", {method:"POST",body:JSON.stringify({candidateId,status})}); }
            catch { activityStale = true; }
            await loadActivity();
          });
        }
        function markActivity(candidateId) {
          if (!state.me || isClosed() || !candidateId || ownReviewFor(candidateId) || document.hidden) return;
          if (activityCandidate === candidateId && Date.now() - activityLastSent < 60000) return;
          activityCandidate = candidateId; activityLastSent = Date.now();
          queueActivity(candidateId, "in_progress");
        }
        function stopActivity() {
          const candidateId = activityCandidate;
          activityCandidate = null; activityLastSent = 0;
          if (candidateId && state.me && !isClosed()) queueActivity(candidateId, "idle");
        }
        const commentDrafts = new Map();
        let commentsAttempt = 0;
        async function loadComments(candidateId) {
          const attempt = ++commentsAttempt;
          if ($("#contextList").dataset.candidateId !== candidateId) { $("#contextList").textContent = "Loading comments…"; $("#contextList").dataset.candidateId = candidateId; }
          $("#contextCount").textContent = "";
          $("#contextError").textContent = "";
          try {
            const result = await api("/api/comments?candidateId=" + encodeURIComponent(candidateId));
            if (attempt !== commentsAttempt || safeId(state.activeId) !== safeId(candidateId)) return;
            const comments = Array.isArray(result.comments) ? result.comments : [];
            $("#contextCount").textContent = comments.length ? "(" + comments.length + ")" : "";
            const list = $("#contextList"); list.replaceChildren();
            if (!comments.length) list.append(el("p", "", "No shared context yet."));
            for (const comment of comments) {
              const item = el("article", "context-item");
              item.append(el("div", "context-author", (comment.author && comment.author.email || "Reviewer") + " · " + safeDate(comment.createdAt)));
              item.append(el("div", "context-text", comment.text)); list.append(item);
            }
            $("#contextForm").hidden = isClosed();
          } catch (error) {
            if (attempt !== commentsAttempt || safeId(state.activeId) !== safeId(candidateId)) return;
            $("#contextList").textContent = error.userMessage || "Comments could not load. Try Refresh comments.";
          }
        }
        async function postSharedComment(event) {
          event.preventDefault();
          const candidateId = state.activeId; const text = $("#contextText").value.trim();
          if (text.length < 5) { $("#contextError").textContent = "Add at least five characters of context."; return; }
          $("#postComment").disabled = true;
          $("#contextText").disabled = true;
          try {
            await api("/api/comments", {method:"POST",body:JSON.stringify({candidateId,text})});
            commentDrafts.delete(candidateId);
            if (safeId(state.activeId) === safeId(candidateId)) { $("#contextText").value = ""; await loadComments(candidateId); }
          } catch (error) { if (safeId(state.activeId) === safeId(candidateId)) $("#contextError").textContent = error.userMessage || "Comment was not saved. Try again."; }
          finally { $("#postComment").disabled = false; $("#contextText").disabled = false; }
        }

        function bindEvents() {
          $("#scoreList").addEventListener("click", event => {
            const button = event.target.closest("[data-score-choice]");
            if (!button || button.disabled) return;
            const select = $("#score-" + button.dataset.scoreChoice);
            select.value = button.dataset.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
          });
          $("#startScoring").addEventListener("click", () => setReviewStage(true));
          $("#backToRead").addEventListener("click", () => setReviewStage(false));
          $("#contextForm").addEventListener("submit", postSharedComment);
          $("#contextText").addEventListener("input", () => { if (state.activeId) commentDrafts.set(state.activeId, $("#contextText").value); });
          $("#refreshComments").addEventListener("click", () => { if(state.activeId) loadComments(state.activeId); });
          $("#sharedContext").addEventListener("toggle", () => { if($("#sharedContext").open && state.activeId) loadComments(state.activeId); });
          $("#datasetForm").addEventListener("submit", async event => {
            event.preventDefault();
            const button = $("#datasetSubmit");
            if (!isCoordinator() || button.disabled) return;
            button.disabled = true;
            setText("#datasetStatus", "Importing…");
            try {
              const file = $("#datasetFile").files[0];
              if (!file || file.size > 5 * 1024 * 1024 - 1024) throw new Error("Choose a JSON file smaller than 5 MB.");
              const candidates = JSON.parse(await file.text());
              if (!Array.isArray(candidates)) throw new Error("Expected an array of applications. Run the importer first.");
              await api("/api/dataset", {method:"POST", body:JSON.stringify({candidates})});
              await loadApplication();
              showGlobalNotice("Applications imported into private storage.");
            } catch (error) {
              setText("#datasetStatus", error.userMessage || error.message || "Import failed. Try again.");
            } finally { button.disabled = false; }
          });
          $("#retryButton").addEventListener("click", loadApplication);
          $("#reviewNav").addEventListener("click", () => setActiveView("review"));
          $("#coordinatorNav").addEventListener("click", () => setActiveView("coordinator"));
          $("#closeReviewButton").addEventListener("click", toggleReviewing);
          $("#reviewForm").addEventListener("submit", submitReview);
          $("#queueSearch").addEventListener("input", event => { state.queueSearch = event.target.value; renderQueue(); });
          $("#candidateSelect").addEventListener("change", event => { if (event.target.value) goToCandidate(event.target.value); });
          $("#previousCandidate").addEventListener("click", () => { const index = state.candidates.findIndex(candidate => safeId(candidate.id) === safeId(state.activeId)); if (index > 0) goToCandidate(state.candidates[index - 1].id); });
          $("#nextCandidate").addEventListener("click", () => { const index = state.candidates.findIndex(candidate => safeId(candidate.id) === safeId(state.activeId)); if (index >= 0 && index < state.candidates.length - 1) goToCandidate(state.candidates[index + 1].id); });
          $("#answerTabs").addEventListener("click", event => {
            const button = event.target.closest("[data-answer-key]");
            if (!button) return;
            state.activeAnswer = button.dataset.answerKey;
            renderAnswerTabs(getCurrentCandidate());
            $("#answerPanel").focus();
          });
          $("#answerTabs").addEventListener("keydown", event => {
            if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
            const tabs = Array.from($("#answerTabs").querySelectorAll('[role="tab"]'));
            const current = tabs.indexOf(document.activeElement);
            if (current < 0) return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
            state.activeAnswer = tabs[next].dataset.answerKey;
            renderAnswerTabs(getCurrentCandidate());
            const target = $("#answerTab-" + state.activeAnswer);
            target.focus();
          });
          $("#reviewForm").addEventListener("change", event => {
            const candidate = getCurrentCandidate();
            if (!candidate || ownReviewFor(candidate.id)) return;
            markActivity(candidate.id);
            if (event.target.dataset.scoreKey) updateScoreHelp(event.target.dataset.scoreKey, event.target.value);
            if (event.target.id === "departmentSelect") {
              const draft = getDraft(candidate);
              draft.department = event.target.value;
            }
            const draft = scoreDraftFromForm(candidate);
            setHidden("#formError", true);
            setHidden("#draftLabel", !hasDraftContent(draft));
          });
          $("#reviewForm").addEventListener("input", event => {
            const candidate = getCurrentCandidate();
            if (!candidate || ownReviewFor(candidate.id)) return;
            markActivity(candidate.id);
            if (event.target.id === "notes") updateNotesHint();
            const draft = scoreDraftFromForm(candidate);
            setHidden("#draftLabel", !hasDraftContent(draft));
          });
          $("#refreshResults").addEventListener("click", () => { state.results = null; loadResults(true); });
          $("#exportCsv").addEventListener("click", exportCsv);
          $("#departmentFilter").addEventListener("change", event => { state.coordinatorFilter = event.target.value; renderCoordinatorResults(); });
          $("#resultFilter").addEventListener("change", event => { state.resultStatus = event.target.value; renderCoordinatorResults(); });
          $("#coordinatorSearch").addEventListener("input", event => { state.coordinatorSearch = event.target.value; renderCoordinatorResults(); });
        }
        setInterval(() => { if (!document.hidden && state.activeId && $("#sharedContext").open) loadComments(state.activeId); }, 30000);
        setInterval(() => {
          if (document.hidden || !state.me || isClosed()) return;
          // Reading an idle page does not keep activity alive; only opening the form or editing does.
          loadActivity();
        }, 30000);
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) stopActivity();
          else { loadActivity(); if (state.view === "review" && $("#reviewWorkspace").classList.contains("is-scoring")) markActivity(state.activeId); }
        });
        renderScoreRubric();
        bindEvents();
        loadApplication();
      })();
    </script>
  </body>
</html>`;
