const $ = (s) => document.querySelector(s),
  RATE = 180,
  FEE = 0.1,
  wait = (ms) => new Promise((r) => setTimeout(r, ms));
const inr = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(n),
  now = () => new Date().toLocaleString("en-IN");
const ROLES = {
  student: "Student / Learner",
  researcher: "Researcher",
  alumni: "Alumni",
  university: "University Admin",
  employer: "Employer / AI Lab",
  pm: "Project Manager",
  qa: "Evaluator / QA Lead",
  admin: "Platform Admin",
};
const NAV = {
  student: [
    ["overview", "Overview"],
    ["verify", "Verification"],
    ["assess", "Assessments"],
    ["discover", "Discover Work"],
    ["workbench", "Workbench"],
    ["earnings", "Earnings"],
    ["passport", "Work Passport"],
  ],
  qa: [
    ["overview", "Overview"],
    ["review", "Review Queue"],
  ],
  employer: [
    ["overview", "Overview"],
    ["projects", "Projects"],
  ],
  pm: [
    ["overview", "Overview"],
    ["projects", "Cohort & QA"],
  ],
  admin: [
    ["overview", "Overview"],
    ["audit", "Audit Log"],
  ],
  researcher: [["overview", "Overview"]],
  alumni: [["overview", "Overview"]],
  university: [["overview", "Overview"]],
};
const init = {
  role: "student",
  dark: true,
  verified: "none",
  assess: null,
  applied: "none",
  subs: [],
  credited: [],
  payout: "none",
  notes: [],
  audit: [],
  draft: "",
};
let S = { ...init, ...JSON.parse(localStorage.ihin || "{}") },
  busy = false,
  qi = 0,
  qa = [],
  choice = "",
  bell = false;
const save = () => (localStorage.ihin = JSON.stringify(S));
const log = (m, n) => {
  S.audit.unshift(now() + " — " + m);
  if (n) {
    S.notes.unshift(n + " (" + now() + ")");
    toast(n);
  }
  save();
};
const toast = (t) => {
  const e = $("#toast");
  e.textContent = "✓ " + t;
  e.classList.add("show");
  setTimeout(() => e.classList.remove("show"), 2500);
};
const B = (k, t) => `<span class="badge ${k}">${t}</span>`;
const earn = () => {
  const g = S.credited.length * RATE;
  return { g, f: g * FEE, n: g * (1 - FEE) };
};
const A = {
  async run(f) {
    busy = true;
    draw();
    await f();
    busy = false;
    save();
    draw();
  },
  verify() {
    A.run(async () => {
      S.verified = "pending";
      draw();
      await wait(1200);
      S.verified = "verified";
      log("Affiliation verified (simulated)", "Affiliation verified (demo)");
    });
  },
  ans(k) {
    qa.push(k === QS[qi].a ? 1 : 0);
    qi++;
    draw();
  },
  submitAssess() {
    A.run(async () => {
      await wait(600);
      const sc = Math.round((qa.filter(Boolean).length / 3) * 100);
      S.assess = { sc, ok: sc >= 67 };
      log(
        "Assessment " + sc + "% by local rule v0.1",
        sc >= 67
          ? "Hindi LLM Evaluation capability recorded"
          : "Sent to human review",
      );
    });
  },
  apply() {
    A.run(async () => {
      S.applied = "applied";
      draw();
      await wait(900);
      S.applied = "cohort";
      log("Joined Hindi LLM cohort", "You joined the Hindi LLM cohort");
    });
  },
  pick(c) {
    choice = c;
    draw();
  },
  submitTask() {
    const r = $("#just").value;
    A.run(async () => {
      await wait(500);
      S.subs.push({
        id: "sub-" + (S.subs.length + 1),
        task: "t1",
        choice,
        reason: r,
        status: "pending",
      });
      S.draft = "";
      choice = "";
      log("Task submitted, awaiting QA", "Task submitted for review");
    });
  },
  review(id, d) {
    const r = $("#rsn").value.trim();
    if (d !== "accepted" && !r) return toast("A reason is required");
    const s = S.subs.find((x) => x.id === id);
    s.status = d;
    s.comment = r;
    if (d === "accepted" && !S.credited.includes(s.task))
      S.credited.push(s.task);
    log(
      "QA " + d + " " + id + (r ? ": " + r : ""),
      d === "accepted"
        ? "Task accepted, earning credited"
        : "Task " + d + ": " + r,
    );
    draw();
  },
  payout() {
    if (!confirm("Simulate a payout? No real money moves.")) return;
    A.run(async () => {
      S.payout = "processing";
      draw();
      await wait(1500);
      S.payout = "paid";
      log("Simulated payout marked paid", "Demo payout completed");
    });
  },
  reset() {
    if (confirm("Reset all demo data?")) {
      localStorage.removeItem("ihin");
      S = { ...init };
      qi = 0;
      qa = [];
      draw();
    }
  },
};
const QS = [
  {
    q: "Which reply follows “answer in one line”?",
    o: ["A 3-paragraph reply", "A single-line reply", "An English reply"],
    a: 1,
  },
  {
    q: "In pairwise ranking, equally good responses → choose…",
    o: ["Response A", "Tie", "Neither"],
    a: 1,
  },
  {
    q: "A claim with no supporting source is marked…",
    o: ["Supported", "Unverifiable", "Refuted"],
    a: 1,
  },
];
const page = () => location.hash.split("/")[2] || "overview";
function journey() {
  const acc = S.subs.some((x) => x.status === "accepted");
  const st = [
    ["University verified", S.verified === "verified"],
    ["Baseline passed", S.assess && S.assess.ok],
    ["Joined cohort", S.applied === "cohort"],
    ["Task submitted", S.subs.length],
    ["QA accepted", acc],
    ["Earning credited", S.credited.length],
    ["Payout paid (simulated)", S.payout === "paid"],
    ["In Work Passport", acc],
  ];
  return `<div class="card"><h3>Demo journey (shared by all roles)</h3><div class="grid2">${st.map(([l, o]) => `<div>${o ? B("ok", "Done") : B("wait", "Pending")} ${l}</div>`).join("")}</div></div>`;
}
function project() {
  const c = (k) => S.subs.filter((x) => x.status === k).length,
    a = c("accepted"),
    r = c("rework"),
    p = c("pending"),
    m = Math.max(1, a, r, p);
  return `<div class="card"><b>Hindi LLM Response Evaluation (Batch 1)</b> ${B("info", S.applied === "cohort" ? "Production" : "Candidate pool")}<p>Accepted-work spend: ${inr(earn().g)} (demo)</p>
 <div class="bars">${[
   ["Accepted", a],
   ["Rework", r],
   ["Pending", p],
 ]
   .map(
     ([l, v]) =>
       `<div><span style="height:${(v / m) * 90}px"></span>${l}: ${v}</div>`,
   )
   .join(
     "",
   )}</div><p style="font-size:12px">Summary: ${a} accepted, ${r} in rework, ${p} pending of ${S.subs.length} submitted.</p></div>`;
}
const preview = (t) =>
  `<div class="card"><h2>${t}</h2><p>Later-phase preview: not built in this core prototype. Try Student, QA, Employer, PM or Admin for the full journey.</p></div>`;
function view(p) {
  const e = earn(),
    last = S.subs[S.subs.length - 1],
    pend = S.subs.filter((x) => x.status === "pending");
  if (p === "overview")
    return `<h1>${ROLES[S.role]} overview</h1>${journey()}${S.role === "student" ? `<div class="grid2"><div class="card">Affiliation<br><b>${S.verified}</b></div><div class="card">Net earnings<br><b>${inr(e.n)}</b></div><div class="card">Pending review<br><b>${pend.length}</b></div></div>` : ""}${["employer", "pm"].includes(S.role) ? project() : ""}${["researcher", "alumni", "university"].includes(S.role) ? preview("Dashboard preview") : ""}`;
  if (p === "verify")
    return `<div class="card"><h2>University affiliation verification</h2><p>Simulated against a mock domain registry (iitd.ac.in → IIT Delhi demo). Separate from optional academic-record verification and payout KYC (not collected).</p><p>Status: ${B(S.verified === "verified" ? "ok" : S.verified === "pending" ? "wait" : "info", S.verified)}</p><button class="btn" ${S.verified !== "none" || busy ? "disabled" : ""} onclick="A.verify()">Verify ananya@iitd.ac.in (simulated)</button></div>`;
  if (p === "assess") {
    if (S.verified !== "verified")
      return `<div class="card">${B("bad", "Permission denied")} Complete affiliation verification first.</div>`;
    if (S.assess)
      return `<div class="card"><h2>Baseline result</h2><p>Capability score <b>${S.assess.sc}%</b> · Confidence (separate): <b>${S.assess.ok ? "Medium (3 items)" : "Low"}</b> · Rubric v0.1 · local rule, not live AI</p>${S.assess.ok ? B("ok", "Eligible for Hindi LLM Evaluation") : B("wait", "Pending human review")}</div>`;
    return `<div class="card"><h2>Baseline assessment</h2><progress max="3" value="${qi}"></progress>${qi < 3 ? `<p>Q${qi + 1}/3: ${QS[qi].q}</p>${QS[qi].o.map((o, k) => `<button class="btn2" style="display:block;width:100%;margin:6px 0;text-align:left" onclick="A.ans(${k})">${o}</button>`).join("")}` : `<button class="btn" ${busy ? "disabled" : ""} onclick="A.submitAssess()">Submit assessment</button>`}</div>`;
  }
  if (p === "discover") {
    const el = S.assess && S.assess.ok && S.verified === "verified";
    return `<div class="card"><b>Hindi LLM Response Evaluation (Batch 1)</b> ${el ? B("ok", "Eligible") : S.verified !== "verified" ? B("bad", "Missing requirement: affiliation") : B("wait", "Assessment required")}<p>Demo AI Lab · Pairwise ranking · Hindi · ${inr(RATE)}/accepted task · ~6 hrs/week. Requires verified affiliation and baseline ≥ 67%. Paid only for accepted work.</p><button class="btn" ${!el || S.applied !== "none" || busy ? "disabled" : ""} onclick="A.apply()">${S.applied === "none" ? "Apply" : S.applied === "applied" ? "Reviewing…" : "Joined cohort"}</button></div>`;
  }
  if (p === "workbench") {
    if (S.applied !== "cohort")
      return `<div class="card">${B("bad", "Permission denied")} Join the Hindi LLM cohort first.</div>`;
    const lock = last && last.status !== "rework";
    return `<div class="wb"><div class="card"><b>Instructions</b><p style="font-size:14px">Choose the better answer. Rubric: factuality, instruction following, fluency. Keys: 1=A 2=B 3=Tie 4=Neither.</p></div>
  <div class="card"><b>Prompt: भारत की राजधानी क्या है?</b><div class="ans">A: “भारत की राजधानी नई दिल्ली है।”</div><div class="ans">B: “राजधानी शायद मुंबई है।”</div>
  ${[
    ["A", "Response A"],
    ["B", "Response B"],
    ["tie", "Tie"],
    ["neither", "Neither"],
  ]
    .map(
      ([v, l]) =>
        `<button class="btn${choice === v ? " sel" : "2"}" onclick="A.pick('${v}')">${l}</button> `,
    )
    .join("")}
  <p><label>Justification<textarea id="just" rows="3" oninput="S.draft=this.value;save();$('#sv').textContent='Draft saved'">${S.draft}</textarea></label></p><button class="btn" ${!choice || lock || busy ? "disabled" : ""} onclick="A.submitTask()">Submit task</button></div>
  <div class="card" style="font-size:14px"><span id="sv">Draft idle</span><br><b>Status</b><br>${last ? B(last.status === "accepted" ? "ok" : last.status === "rework" ? "bad" : "wait", last.status) : "Not submitted"}${last && last.comment ? `<p>Reviewer: ${last.comment}</p>` : ""}${last && last.status === "rework" ? "<p>Revise and resubmit.</p>" : ""}<hr>${S.subs.map((x) => `<div>${x.id}: ${x.status}</div>`).join("")}</div></div>`;
  }
  if (p === "earnings")
    return `<h1>Earnings (demo ledger)</h1><div class="card"><p>Gross accepted: ${inr(e.g)}<br>Platform fee (10%): −${inr(e.f)}<br><b>Net: ${inr(e.n)}</b></p><p>Payout: ${B(S.payout === "paid" ? "ok" : S.payout === "processing" ? "wait" : "info", S.payout === "none" ? "Not requested" : S.payout)}</p><p style="font-size:12px">Method: bank ••••4321 (placeholder). No real bank or KYC data collected. Each task credits once.</p><button class="btn" ${e.n === 0 || S.payout !== "none" || busy ? "disabled" : ""} onclick="A.payout()">Request simulated payout</button></div><div class="card"><table><tr><th>Task</th><th>Status</th><th>Amount</th></tr>${S.credited.map((t) => `<tr><td>${t}</td><td>${S.payout === "paid" ? "Paid" : S.payout === "processing" ? "Processing" : "Approved"}</td><td>${inr(RATE)}</td></tr>`).join("") || '<tr><td colspan="3">No accepted work yet.</td></tr>'}</table></div>`;
  if (p === "passport")
    return `<div style="display:flex;justify-content:space-between"><h1>Verified Work Passport</h1><button class="btn2 noprint" onclick="print()">Print / export</button></div><div class="card"><h3>Ananya Sharma · IIT Delhi (demo)</h3><p>Affiliation: ${S.verified === "verified" ? B("ok", "Verified · simulated") : B("wait", "Not verified")}</p><p><b>Assessed:</b> ${S.assess ? `Hindi LLM Evaluation ${S.assess.sc}% · baseline v0.1` : "None yet"}</p><p><b>Work-verified:</b> ${S.credited.length ? S.credited.length + " accepted pairwise task(s), QA-reviewed" : "No accepted work yet"}</p><p><b>Self-declared (unverified):</b> Hindi (native), Python</p></div>`;
  if (p === "review")
    return `<h1>Review queue</h1>${!pend.length ? '<div class="card">Queue empty. Submit a task as the student first.</div>' : pend.map((x) => `<div class="card"><b>${x.id}</b><p>Worker choice: <b>${x.choice}</b> — “${x.reason || "(none)"}”</p><p>Authorized reference answer: <b>A</b> (QA-only; hidden from workers)</p><label>Reason (required for rework/escalation)<br><input id="rsn" style="width:100%"></label><p><button class="btn" onclick="A.review('${x.id}','accepted')">Accept</button> <button class="btn2" onclick="A.review('${x.id}','rework')">Return for rework</button> <button class="btn2" onclick="A.review('${x.id}','escalated')">Escalate</button></p></div>`).join("")}`;
  if (p === "projects")
    return `<h1>Projects</h1>${project()}${S.role === "pm" ? `<div class="card">Cohort: ${S.applied === "cohort" ? "1 calibrated worker (Ananya S.)" : "No workers yet"} · Lifecycle: ${S.subs.length ? "Production → QA" : "Candidate Pool → Assessment"}</div>` : ""}`;
  if (p === "audit")
    return `<div class="card"><h2>Audit log</h2>${S.audit.map((a) => `<div>${a}</div>`).join("") || "No events yet."}</div>`;
  return preview("Module");
}
function draw() {
  const h = location.hash;
  document.body.className = S.dark ? "dark" : "";
  const app = $("#app");
  if (h.startsWith("#/app")) {
    app.innerHTML = `<div class="shell"><aside id="side"><b style="color:var(--indigo)"><a href="#/">IHIN</a></b><div style="font-size:12px">${ROLES[S.role]}</div><nav style="margin-top:20px">${NAV[S.role].map(([i, l]) => `<a href="#/app/${i}" class="${page() === i ? "on" : ""}">${l}</a>`).join("")}</nav><p style="font-size:12px">Other modules are later-phase previews.</p></aside>
 <div class="main"><header class="bar"><button class="btn2 menu" aria-label="Menu" onclick="$('#side').classList.toggle('open')">☰</button><span class="demo">Demo environment</span>
 <select class="sp" aria-label="Switch demo role" onchange="S.role=this.value;save();location.hash='#/app/overview';draw()">${Object.keys(
   ROLES,
 )
   .map(
     (r) =>
       `<option value="${r}" ${r === S.role ? "selected" : ""}>${ROLES[r]}</option>`,
   )
   .join("")}</select>
 <span id="bell"><button class="btn2" aria-label="Notifications" onclick="bell=!bell;draw()">🔔</button>${S.notes.length ? `<span class="dot">${S.notes.length}</span>` : ""}${
   bell
     ? `<div class="card pop">${
         S.notes
           .slice(0, 6)
           .map((n) => `<div style="font-size:13px">${n}</div>`)
           .join("") || "No notifications"
       }</div>`
     : ""
 }</span>
 <button class="btn2" aria-label="Toggle theme" onclick="S.dark=!S.dark;save();draw()">${S.dark ? "☀" : "☾"}</button><button class="btn2" onclick="A.reset()">Reset demo</button></header><main class="page">${view(page())}</main></div></div>`;
    return;
  }
  if (h === "#/demo") {
    app.innerHTML = `<div class="page"><h1>Demo Role Switcher</h1><p>Isolated demo accounts. Privileged roles would need approval or invitation in a real signup.</p><div class="grid2">${Object.keys(
      ROLES,
    )
      .map(
        (r) =>
          `<button class="card" style="text-align:left;cursor:pointer;color:inherit;font:inherit" onclick="S.role='${r}';save();location.hash='#/app/overview'"><b>${ROLES[r]}</b><br><small>${["student", "researcher", "alumni"].includes(r) ? "Open signup after affiliation check" : "Approval/invitation required (simulated)"}</small></button>`,
      )
      .join("")}</div></div>`;
    return;
  }
  const go = (r) => `S.role='${r}';save();location.hash='#/app/overview'`,
    steps = [
      "University verification",
      "Capability assessment",
      "Qualified project",
      "Task completion",
      "Quality review",
      "Payment",
      "Verified Work Passport",
    ];
  app.innerHTML = `<div class="land"><div class="wrap"><header class="top"><b>India Human Intelligence Network</b><nav>${["How It Works", "AI Work", "For Universities", "For Organizations", "Research"].map((x) => `<a href="#hiw">${x}</a>`).join("")}<a href="#/demo">Sign In</a></nav><a class="btn" href="#/demo">Get Started</a></header>
 <section class="hero"><div><h1 class="big">Your skills deserve <span>verified opportunity.</span></h1><p>Connect your academic identity, prove your capabilities, and access meaningful AI work, research, and career opportunities.</p><div class="ctas"><button class="btn" onclick="${go("student")}">Join as Talent</button><button class="btn2" onclick="${go("employer")}">Build Your Workforce</button><a class="btn2" href="#/demo">Explore Demo</a></div><p style="font-size:12px">Prototype: verification, payments and evaluation are simulated. Figures are demo data.</p></div>
 <div class="stage"><canvas id="net" aria-label="Capability network of universities, people, skills, assessments, projects, research and outcomes"></canvas><div class="float f1">🛡 Affiliation verified (demo)</div><div class="float f2">Hindi LLM Evaluation · assessed</div></div></section>
 <section id="hiw" class="rev"><h2>The journey of verified capability</h2><ol class="steps">${steps.map((s, i) => `<li><i>${i + 1}</i>${s}</li>`).join("")}</ol></section>
 <section class="rev"><h2>AI work categories</h2>${["LLM response evaluation", "Data annotation", "Pairwise ranking", "Multilingual evaluation", "Translation review", "Fact verification", "Research assistance"].map((x) => B("info", x) + " ").join("")}</section>
 <section class="rev" style="padding:50px 0"><div class="card pass" id="pass"><small>Verified Work Passport · sample</small><h3 style="color:#fff">Ananya Sharma</h3><p>Affiliation: verified (demo)<br>Hindi LLM Evaluation — assessed<br>Self-declared skills shown separately</p></div></section>
 <section class="rev"><h2>FAQ</h2><details class="card"><summary>Is verification real?</summary>No. Everything is simulated locally.</details><details class="card"><summary>Any customers or testimonials?</summary>None are invented; figures are demo data.</details></section>
 <footer><a class="btn" href="#/demo">Open the demo</a><p>Privacy and Terms: draft placeholders, not legal content.</p></footer></div></div>`;
  landFx();
}
function landFx() {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach(
        (e) =>
          (e.isTarget && 0) ||
          (e.isIntersecting && e.target.classList.add("in")),
      ),
    { threshold: 0.15 },
  );
  document.querySelectorAll(".rev").forEach((e) => io.observe(e));
  const p = $("#pass");
  if (p)
    p.onmousemove = (e) => {
      const r = p.getBoundingClientRect();
      p.style.transform = `perspective(600px) rotateY(${((e.clientX - r.left) / r.width) * 16 - 8}deg) rotateX(${-(((e.clientY - r.top) / r.height) * 12 - 6)}deg)`;
    };
  if (p) p.onmouseleave = () => (p.style.transform = "");
  const c = $("#net");
  if (!c) return;
  const x = c.getContext("2d"),
    N = 30,
    reduce = matchMedia("(prefers-reduced-motion:reduce)").matches,
    col = [
      "#6366F1",
      "#14B8A6",
      "#F8FAFC",
      "#F59E0B",
      "#6366F1",
      "#14B8A6",
      "#F8FAFC",
    ];
  const pts = [...Array(N)].map((_, i) => {
    const a = Math.acos(1 - (2 * (i + 0.5)) / N),
      t = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    return [
      Math.sin(a) * Math.cos(t),
      Math.sin(a) * Math.sin(t),
      Math.cos(a),
      col[i % 7],
    ];
  });
  let ang = 0,
    mx = 0,
    my = 0,
    on = true;
  new IntersectionObserver(([e]) => {
    on = e.isIntersecting;
  }).observe(c);
  c.onmousemove = (e) => {
    const r = c.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
  };
  function f(t) {
    if (!document.body.contains(c)) return;
    if (on || reduce) {
      const W = (c.width = c.clientWidth * devicePixelRatio),
        H = (c.height = c.clientHeight * devicePixelRatio),
        s = Math.min(W, H) * 0.34;
      x.clearRect(0, 0, W, H);
      ang += reduce ? 0 : 0.004;
      const ca = Math.cos(ang + mx),
        sa = Math.sin(ang + mx),
        tx = my * 0.6,
        ct = Math.cos(tx),
        st = Math.sin(tx);
      const P = pts.map(([a, b, d, k]) => {
        const X = a * ca + d * sa,
          Z = -a * sa + d * ca,
          Y = b * ct - Z * st,
          Z2 = b * st + Z * ct,
          q = 1 / (1.6 - Z2 * 0.4);
        return [W / 2 + X * s * q, H / 2 + Y * s * q, q, k];
      });
      P.forEach((a, i) => {
        [3, 7].forEach((o, j) => {
          const b = P[(i + o) % N];
          x.strokeStyle = "rgba(99,102,241," + (0.12 + 0.18 * a[2]) + ")";
          x.beginPath();
          x.moveTo(a[0], a[1]);
          x.lineTo(b[0], b[1]);
          x.stroke();
          if (!reduce && (i + j) % 9 == 0) {
            const u = (t / 2000 + i / N) % 1;
            x.fillStyle = "#14B8A6";
            x.beginPath();
            x.arc(
              a[0] + (b[0] - a[0]) * u,
              a[1] + (b[1] - a[1]) * u,
              2 * devicePixelRatio,
              0,
              7,
            );
            x.fill();
          }
        });
      });
      P.forEach((a) => {
        x.fillStyle = a[3];
        x.globalAlpha = 0.4 + a[2] * 0.4;
        x.beginPath();
        x.arc(a[0], a[1], (3 + a[2] * 3) * devicePixelRatio, 0, 7);
        x.fill();
      });
      x.globalAlpha = 1;
    }
    if (!reduce) requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
}
addEventListener("hashchange", () => {
  bell = false;
  draw();
  scrollTo(0, 0);
});
addEventListener("keydown", (e) => {
  if (
    page() === "workbench" &&
    !["TEXTAREA", "INPUT"].includes(e.target.tagName)
  ) {
    const m = { 1: "A", 2: "B", 3: "tie", 4: "neither" }[e.key];
    if (m) A.pick(m);
  }
});
addEventListener("beforeunload", (e) => {
  if (S.draft && page() === "workbench") {
    e.preventDefault();
  }
});
draw();
