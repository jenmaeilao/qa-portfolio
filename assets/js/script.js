/* ===== Data (sample content: replace with your real results) ===== */
const projects = [
  { id:'lakbaylokal', name:'LakbayLokal', type:['manual','automation'], status:'Completed',
    blurb:'Web-based travel and hotel booking system.',
    tags:['Booking workflows','Form validation','CRUD','Playwright'],
    overview:'A booking platform where travelers browse destinations, reserve hotels, and manage bookings. Testing covered the full journey from search to booking confirmation.',
    objectives:['Verify the booking workflow end to end','Confirm every form validates required, malformed, and boundary input','Check that create, read, update, and cancel operations keep data consistent'],
    scope:{in:'Registration and login, hotel search, booking form, booking CRUD.', out:'Payment gateway and performance testing.'},
    scenarios:['Valid and invalid booking dates','Required and malformed fields','Guest count limits','Edit and cancel an existing booking','Duplicate form submission'],
    summary:{pass:24, fail:2, block:1},
    bugs:['BUG-LKL-042','BUG-LKL-051'] },
  { id:'tagpo', name:'Tagpo', type:['manual'], status:'Completed',
    blurb:'Web-based event venue booking system.',
    tags:['Venue availability','Pricing computation','Database validation','Edge cases'],
    overview:'A platform for browsing event venues and booking dates, with a cart and booking summary. Testing focused on availability logic and price accuracy.',
    objectives:['Prevent double booking of a venue on the same date','Verify pricing totals including add-ons','Confirm saved database records match the booking summary'],
    scope:{in:'Availability calendar, cart, price computation, booking form, stored records.', out:'Admin analytics and load testing.'},
    scenarios:['Overlapping and same-day bookings','Price totals with and without add-ons','SQL checks of saved booking records','Guest capacity boundary values','Past-date selection'],
    summary:{pass:18, fail:2, block:0},
    bugs:['BUG-TGP-007','BUG-TGP-015'] }
];

const cases = [
  {id:'TC-LKL-001',proj:'LakbayLokal',mod:'Hotel Booking Form',scn:'Submit with all valid fields',steps:['Open a hotel page','Fill all fields with valid data','Click Book now'],exp:'Booking confirmed and record saved',act:'Booking confirmed and record saved',st:'PASS'},
  {id:'TC-LKL-002',proj:'LakbayLokal',mod:'Hotel Booking Form',scn:'Check-out earlier than check-in',steps:['Set check-in to 20 Dec','Set check-out to 18 Dec','Submit'],exp:'Validation error is shown',act:'Booking saved with negative nights (BUG-LKL-042)',st:'FAIL'},
  {id:'TC-LKL-003',proj:'LakbayLokal',mod:'Hotel Booking Form',scn:'Leave required fields empty',steps:['Open booking form','Click Book now with empty fields'],exp:'Required-field messages appear',act:'Required-field messages appear',st:'PASS'},
  {id:'TC-LKL-004',proj:'LakbayLokal',mod:'Login',scn:'Login with wrong password',steps:['Enter a valid email','Enter a wrong password','Click Login'],exp:'Generic error and no login',act:'Generic error and no login',st:'PASS'},
  {id:'TC-LKL-005',proj:'LakbayLokal',mod:'Booking CRUD',scn:'Cancel an existing booking',steps:['Open My bookings','Click Cancel on a booking','Confirm'],exp:'Status changes to Cancelled',act:'Not executed: depends on fix for BUG-LKL-042',st:'BLOCK'},
  {id:'TC-TGP-001',proj:'Tagpo',mod:'Availability',scn:'Book an already reserved date',steps:['Pick a venue','Select a date reserved by another booking','Add to cart and check out'],exp:'Date is unavailable and checkout is blocked',act:'Second booking accepted (BUG-TGP-007)',st:'FAIL'},
  {id:'TC-TGP-002',proj:'Tagpo',mod:'Pricing',scn:'Total with one add-on',steps:['Select a venue priced at 10,000','Add a sound system at 1,500','Open booking summary'],exp:'Total is 11,500',act:'Total is 10,000 (BUG-TGP-015)',st:'FAIL'},
  {id:'TC-TGP-003',proj:'Tagpo',mod:'Booking Form',scn:'Guest count equal to venue capacity',steps:['Select a venue with capacity 100','Enter 100 guests','Submit'],exp:'Booking accepted',act:'Booking accepted',st:'PASS'}
];

const bugs = [
  {id:'BUG-LKL-042',proj:'LakbayLokal',title:'Check-out date earlier than check-in is accepted',sev:'High',pri:'P2',st:'Open',env:'Chrome 126, Windows 11, XAMPP localhost',steps:['Open any hotel and click Book now','Set check-in to 20 Dec and check-out to 18 Dec','Submit the form'],exp:'A validation error blocks submission.',obs:'Booking is saved with a negative stay length.',log:'POST /bookings 200 OK\nnights: -2'},
  {id:'BUG-LKL-051',proj:'LakbayLokal',title:'Email field accepts text without an @ symbol',sev:'Medium',pri:'P3',st:'Fixed',env:'Chrome 126, Windows 11, XAMPP localhost',steps:['Open the booking form','Enter "guest.example.com" as the email','Submit'],exp:'Invalid email message is shown.',obs:'Form submits and the value is stored.',log:'INSERT INTO bookings (email) VALUES ("guest.example.com")'},
  {id:'BUG-TGP-007',proj:'Tagpo',title:'Same venue can be booked twice on one date',sev:'Critical',pri:'P1',st:'Open',env:'Firefox 128, Windows 11, MySQL 8',steps:['Book Venue A for 14 Feb','In a second session, book Venue A for 14 Feb','Complete checkout in both sessions'],exp:'The second booking is rejected.',obs:'Both bookings are saved for the same venue and date.',log:'SELECT COUNT(*) FROM bookings WHERE venue_id=1 AND date="2026-02-14";\n-> 2'},
  {id:'BUG-TGP-015',proj:'Tagpo',title:'Booking total excludes selected add-ons',sev:'High',pri:'P2',st:'In progress',env:'Chrome 126, Windows 11, MySQL 8',steps:['Select a venue priced at 10,000','Add a sound system priced at 1,500','Open the booking summary'],exp:'Total shows 11,500.',obs:'Total shows 10,000.',log:'summary.total = venue_price  // add-ons not summed'}
];

/* ===== Helpers ===== */
const $ = (s, r=document) => r.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const li = arr => arr.map(x => `<li>${esc(x)}</li>`).join('');
const stClass = s => s.toLowerCase();
const modal = new bootstrap.Modal('#mainModal');
function openModal(title, html){ $('#modalTitle').innerHTML = title; $('#modalBody').innerHTML = html; modal.show(); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }

/* ===== Projects: cards, filter, case study modal ===== */
function renderProjects(filter='all'){
  const cards = projects.filter(p => filter==='all' || p.type.includes(filter)).map(p => `
    <div class="col-lg-6"><article class="qcard">
      <div class="d-flex justify-content-between align-items-start mb-2"><h3 class="h4 mb-0">${esc(p.name)}</h3><span class="badge-s pass">${p.status}</span></div>
      <p class="text-secondary">${esc(p.blurb)}</p>
      <div class="mb-3">${p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      <button class="btn btn-ink btn-sm" data-case="${p.id}"><i class="bi bi-journal-richtext me-2"></i>View QA case study</button>
    </article></div>`).join('');
  const soon = (filter==='all') ? `
    <div class="col-12"><article class="qcard soon d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
      <div><h3 class="h5 mb-1">Capstone: </h3><p class="text-secondary mb-0">Test plan and case studies will be added as the project develops.</p></div>
      <span class="badge-s block align-self-start">Coming soon</span></article></div>` : '';
  $('#projectGrid').innerHTML = cards + soon;
}
function caseStudy(p){
  const s = p.summary, related = bugs.filter(b => p.bugs.includes(b.id));
  openModal(esc(p.name) + ' case study', `
    <dl class="facts">
      <dt>Overview</dt><dd>${esc(p.overview)}</dd>
      <dt>Objectives</dt><dd><ul class="ps-3 mb-0">${li(p.objectives)}</ul></dd>
      <dt>Scope</dt><dd><strong>In:</strong> ${esc(p.scope.in)}<br><strong>Out:</strong> ${esc(p.scope.out)}</dd>
      <dt>Test scenarios</dt><dd><ul class="ps-3 mb-0">${li(p.scenarios)}</ul></dd>
      <dt>Execution summary</dt><dd><span class="badge-s pass">${s.pass} pass</span> <span class="badge-s fail">${s.fail} fail</span> <span class="badge-s block">${s.block} blocked</span><div class="small mt-1">Sample figures.</div></dd>
      <dt>Defect findings</dt><dd>${related.map(b=>`<div class="mb-2"><button class="btn btn-soft btn-sm me-2" data-bug="${b.id}"><span class="mono">${b.id}</span></button><span class="badge-s sev-${b.sev.toLowerCase()}">${b.sev}</span> ${esc(b.title)}</div>`).join('')}</dd>
    </dl>`);
}
$('#projectGrid').addEventListener('click', e => { const b = e.target.closest('[data-case]'); if(b) caseStudy(projects.find(p=>p.id===b.dataset.case)); });
document.querySelectorAll('.filter .btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.filter .btn').forEach(x => x.classList.toggle('on', x===b));
  renderProjects(b.dataset.filter);
}));

/* ===== Artifacts: tables and detail modals ===== */
$('#caseBody').innerHTML = cases.map((c,i) => `<tr data-i="${i}" tabindex="0"><td class="ps-4 mono small">${c.id}</td><td>${c.proj}</td><td>${c.mod}</td><td>${c.scn}</td><td class="pe-4"><span class="badge-s ${stClass(c.st)}">${c.st}</span></td></tr>`).join('');
$('#bugBody').innerHTML = bugs.map((b,i) => `<tr data-i="${i}" tabindex="0"><td class="ps-4 mono small">${b.id}</td><td>${b.title}</td><td><span class="badge-s sev-${b.sev.toLowerCase()}">${b.sev}</span></td><td class="mono small">${b.pri}</td><td class="pe-4">${b.st}</td></tr>`).join('');
function caseDetail(c){
  openModal(`<span class="mono">${c.id}</span> <span class="badge-s ${stClass(c.st)} ms-2">${c.st}</span>`, `
    <p class="text-secondary">${esc(c.proj)} / ${esc(c.mod)}: ${esc(c.scn)}</p>
    <p class="fw-semibold mb-1">Steps</p><ol>${li(c.steps)}</ol>
    <div class="row g-3"><div class="col-md-6"><div class="panel" style="background:var(--lav-soft)"><strong class="small">Expected</strong><div class="small">${esc(c.exp)}</div></div></div>
    <div class="col-md-6"><div class="panel" style="background:var(--rose-soft)"><strong class="small">Actual</strong><div class="small">${esc(c.act)}</div></div></div></div>`);
}
function bugDetail(b){
  openModal(`<span class="mono">${b.id}</span> <span class="badge-s sev-${b.sev.toLowerCase()} ms-2">${b.sev}</span>`, `
    <h3 class="h6">${esc(b.title)}</h3>
    <p class="small text-secondary">Priority ${b.pri} | Status: ${b.st} | Environment: ${esc(b.env)}</p>
    <p class="fw-semibold mb-1 small">Steps to reproduce</p><ol class="small">${li(b.steps)}</ol>
    <p class="small mb-1"><strong>Expected:</strong> ${esc(b.exp)}</p>
    <p class="small"><strong>Observed:</strong> ${esc(b.obs)}</p>
    <pre class="log mb-3">${esc(b.log)}</pre>
    <div class="panel small text-secondary text-center"><i class="bi bi-paperclip me-1"></i>Screenshots and log attachments go here</div>`);
}
const rowOpen = (sel, fn, data) => { const h = e => { const r = e.target.closest('tr[data-i]'); if(r && (e.type==='click' || e.key==='Enter')) fn(data[r.dataset.i]); };
  $(sel).addEventListener('click', h); $(sel).addEventListener('keydown', h); };
rowOpen('#caseBody', caseDetail, cases);
rowOpen('#bugBody', bugDetail, bugs);
/* Bug links inside the case study modal */
$('#modalBody').addEventListener('click', e => { const b = e.target.closest('[data-bug]'); if(b) bugDetail(bugs.find(x=>x.id===b.dataset.bug)); });

/* ===== Contact ===== */
document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); toast('Email address copied'); } catch { toast('Copy failed. Please copy it manually.'); }
}));
/* Opens the visitor's email app, so no backend is required */
$('#contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = encodeURIComponent($('#n').value), msg = encodeURIComponent($('#m').value + '\n\nFrom: ' + $('#e').value);
  location.href = `mailto:jenmaeilao@gmail.com?subject=Portfolio message from ${name}&body=${msg}`;
});

renderProjects();
