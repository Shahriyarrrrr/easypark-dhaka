/* ========= Utilities ========= */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const fmtBDT = v => '৳' + Number(v).toLocaleString('en-BD');

/* ====== Price calculation settings ======
 - Plan price used when a plan is selected
 - Default rate (per day) used when no plan
*/
let selectedPlan = null;
let basePlanPrice = 0;
let promoApplied = null;

// Elements
const pricePreview = $('#pricePreview');
const checkinDate = $('#checkin-date');
const checkinTime = $('#checkin-time');
const checkoutDate = $('#checkout-date');
const checkoutTime = $('#checkout-time');
const promoInput = $('#promo');

/* Initialize dates */
(function initDates(){
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24*60*60*1000);
  const iso = d => d.toISOString().slice(0,10);
  if (!checkinDate.value) checkinDate.value = iso(today);
  if (!checkoutDate.value) checkoutDate.value = iso(tomorrow);
  if (!checkinTime.value) checkinTime.value = '09:00';
  if (!checkoutTime.value) checkoutTime.value = '09:00';
})();

/* Recalculate price */
function recalcPrice(){
  const ci = checkinDate.value;
  const ciT = checkinTime.value;
  const co = checkoutDate.value;
  const coT = checkoutTime.value;

  if (!ci || !co || !ciT || !coT) { pricePreview.textContent = fmtBDT(0); return 0; }

  const start = new Date(ci + 'T' + ciT);
  const end = new Date(co + 'T' + coT);
  let ms = end - start;
  if (isNaN(ms) || ms <= 0) { pricePreview.textContent = fmtBDT(0); return 0; }

  const days = Math.ceil(ms / (1000*60*60*24));
  // if a plan selected, use its price (per month equivalent approximated by price)
  let cost = basePlanPrice > 0 ? basePlanPrice * Math.max(1, days/30) : 150 * days; // default 150 BDT/day
  if (promoApplied === 'SAVE10') cost = cost * 0.9;
  pricePreview.textContent = fmtBDT(cost);
  return cost;
}

/* attach date/time change */
[checkinDate, checkoutDate, checkinTime, checkoutTime].forEach(el => {
  el.addEventListener('change', recalcPrice);
});

/* Plan selection */
$$('.select-plan').forEach(btn=>{
  btn.addEventListener('click', () => {
    const card = btn.closest('.plan-card');
    selectedPlan = card.dataset.plan;
    basePlanPrice = Number(card.dataset.price || 0);
    // visual highlight
    $$('.plan-card').forEach(c=>c.classList.remove('active-plan'));
    card.classList.add('active-plan');
    // show small toast / preview
    if (!$('#selectedPlanNote')){
      const note = document.createElement('div');
      note.id = 'selectedPlanNote';
      note.style.marginTop = '8px';
      note.style.fontSize = '13px';
      note.style.color = '#cfcfcf';
      note.innerHTML = `Selected plan: <strong style="color:${'#ffb800'}">${selectedPlan}</strong>`;
      document.querySelector('.booking-card form').insertBefore(note, document.querySelector('.booking-card form').children[7]);
    } else {
      $('#selectedPlanNote').innerHTML = `Selected plan: <strong style="color:${'#ffb800'}">${selectedPlan}</strong>`;
    }
    recalcPrice();
  });
});

/* Promo apply */
$('#applyPromo').addEventListener('click', ()=>{
  const code = promoInput.value.trim().toUpperCase();
  if (!code) { alert('Enter a promo code'); return; }
  if (code === 'SAVE10') {
    promoApplied = 'SAVE10';
    alert('Promo applied: 10% discount');
  } else {
    promoApplied = null;
    alert('Promo code is not valid');
  }
  recalcPrice();
});

/* Clear booking */
$('#clearBtn').addEventListener('click', ()=>{
  $('#bookingForm').reset();
  promoInput.value = '';
  promoApplied = null;
  selectedPlan = null;
  basePlanPrice = 0;
  pricePreview.textContent = fmtBDT(0);
  const note = $('#selectedPlanNote'); if (note) note.remove();
  $$('.plan-card').forEach(c=>c.classList.remove('active-plan'));
  // reset dates
  (function(){ const today=new Date(); const t=new Date(today.getTime()+24*60*60*1000); const iso=d=>d.toISOString().slice(0,10); checkinDate.value=iso(today); checkoutDate.value=iso(t); })();
});

/* Booking submit -> show summary */
$('#bookingForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const loc = $('#location').value;
  const ci = checkinDate.value;
  const ciT = checkinTime.value;
  const co = checkoutDate.value;
  const coT = checkoutTime.value;
  const price = recalcPrice();

  if (!loc || !ci || !co || price === 0) {
    alert('Please complete all booking fields and ensure checkout is after checkin.');
    return;
  }

  const summary = `Booking Details:\nLocation: ${loc}\nCheck-in: ${ci} ${ciT}\nCheck-out: ${co} ${coT}\nPlan: ${selectedPlan || 'Pay-as-you-go'}\nTotal: ${fmtBDT(price)}\n\nProceed to payment? (simulated)`;
  if (confirm(summary)) {
    alert('✅ Booking confirmed! A confirmation SMS/email will be sent.');
    // reset form lightly
    $('#bookingForm').reset();
    recalcPrice();
    const note = $('#selectedPlanNote'); if (note) note.remove();
    $$('.plan-card').forEach(c=>c.classList.remove('active-plan'));
    selectedPlan = null; basePlanPrice = 0; promoApplied = null;
  }
});

/* ===== Testimonial carousel ===== */
(function testimonialCarousel(){
  const slides = $$('#testimonialCarousel .slide');
  const dotsContainer = $('#dots');
  let idx = 0;
  let timer = null;

  function show(i){
    slides.forEach(s=>s.classList.add('hidden'));
    slides[i].classList.remove('hidden');
    // dots
    dotsContainer.innerHTML = '';
    slides.forEach((_,j)=>{
      const d = document.createElement('div');
      d.style.opacity = j===i ? '1' : '0.35';
      d.addEventListener('click', ()=>{ show(j); reset(); });
      dotsContainer.appendChild(d);
    });
    idx = i;
  }
  $('#prevTest').addEventListener('click', ()=>{ show((idx-1+slides.length)%slides.length); reset(); });
  $('#nextTest').addEventListener('click', ()=>{ show((idx+1)%slides.length); reset(); });

  function autoplay(){ timer = setInterval(()=> show((idx+1)%slides.length), 4200); }
  function reset(){ clearInterval(timer); autoplay(); }

  show(0);
  autoplay();
})();

/* ===== Login modal ===== */
const loginBtn = $('#loginBtn');
const modalBackdrop = $('#modalBackdrop');
const closeModal = $('#closeModal');
const cancelLogin = $('#cancelLogin');
const loginForm = $('#loginForm');

loginBtn.addEventListener('click', ()=> openModal());
function openModal(){
  modalBackdrop.classList.remove('hidden');
  modalBackdrop.style.display = 'flex';
  modalBackdrop.setAttribute('aria-hidden','false');
  $('#loginEmail').focus();
}
function closeModalFn(){
  modalBackdrop.classList.add('hidden');
  modalBackdrop.style.display = 'none';
  modalBackdrop.setAttribute('aria-hidden','true');
}
closeModal.addEventListener('click', closeModalFn);
cancelLogin.addEventListener('click', closeModalFn);
modalBackdrop.addEventListener('click', (e)=> { if (e.target === modalBackdrop) closeModalFn(); });

loginForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const pwd = $('#loginPassword').value.trim();
  if (!email || !pwd) { alert('Please enter email and password'); return; }
  // simulation: accept any non-empty credentials
  alert(`Logged in as ${email}`);
  closeModalFn();
});

/* small niceties */
document.getElementById('year').textContent = new Date().getFullYear();

// location button quick list
$('#locationBtn').addEventListener('click', ()=>{
  alert('Dhaka locations: Gulshan, Banani, Dhanmondi, Uttara, Mohakhali, Mirpur');
});
