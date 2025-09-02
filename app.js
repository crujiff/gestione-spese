// Expense Tracker PWA - plain JS
(function(){
  // Categories
  const expenseCategories = ['Cibo','Affitto','Trasporti','Utenze','Intrattenimento','Salute','Shopping','Istruzione','Viaggi','Altro'];
  const incomeCategories = ['Stipendio','Freelance','Regali','Investimenti','Altro'];

  // Storage key
  const STORE_KEY = 'expense_tracker_data_v1';

  // DOM
  const entriesList = document.getElementById('entries-list');
  const emptyEl = document.getElementById('empty');
  const btnAdd = document.getElementById('btn-add');
  const modal = document.getElementById('modal');
  const form = document.getElementById('entry-form');
  const amountInput = document.getElementById('amount');
  const dateInput = document.getElementById('date');
  const categorySelect = document.getElementById('category');
  const noteInput = document.getElementById('note');
  const modalTitle = document.getElementById('modal-title');
  const btnCancel = document.getElementById('btn-cancel');
  const filterFrom = document.getElementById('filter-from');
  const filterTo = document.getElementById('filter-to');
  const filterCat = document.getElementById('filter-category');
  const btnExport = document.getElementById('btn-export');
  const btnSetBudget = document.getElementById('btn-set-budget');
  const btnClearFilters = document.getElementById('btn-clear-filters');

  // Charts
  const barCtx = document.getElementById('barChart').getContext('2d');
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  let barChart, pieChart;

  // App state
  let state = { monthlyBudget:0, entries: [] };
  let editingId = null;
  let focusedCategory = null;

  // Utilities
  function uid(){return 'id_'+Math.random().toString(36).slice(2,9)}
  function load(){
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){ try{ state = JSON.parse(raw); } catch(e){ state = {monthlyBudget:0, entries:[]}; } }
    renderAll();
  }
  function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  function addEntry(e){ state.entries.push(e); save(); renderAll(); }
  function updateEntry(e){ const idx = state.entries.findIndex(x=>x.id===e.id); if(idx!==-1) state.entries[idx]=e; save(); renderAll(); }
  function deleteEntry(id){ state.entries = state.entries.filter(x=>x.id!==id); save(); renderAll(); }

  // Filters
  function getFiltered(){
    let list = state.entries.slice();
    if(filterFrom.value){ const f = new Date(filterFrom.value); list = list.filter(e=>new Date(e.date) >= f); }
    if(filterTo.value){ const t = new Date(filterTo.value); t.setHours(23,59,59,999); list = list.filter(e=>new Date(e.date) <= t); }
    const selectedCats = Array.from(filterCat.selectedOptions).map(o=>o.value);
    if(selectedCats.length>0) list = list.filter(e=>selectedCats.includes(e.category));
    if(focusedCategory) list = list.filter(e=>e.category===focusedCategory);
    list.sort((a,b)=> new Date(b.date)-new Date(a.date));
    return list;
  }

  // Render
  function renderAll(){
    renderBudget();
    renderCategoryFilters();
    renderEntries();
    renderCharts();
  }

  function renderBudget(){
    const budgetText = document.getElementById('budget-text');
    const bar = document.getElementById('budget-bar');
    if(!state.monthlyBudget || state.monthlyBudget<=0){ budgetText.textContent='Nessun budget impostato'; bar.style.width='0%'; return; }
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(),1);
    const used = state.entries.filter(e=>e.type==='expense' && new Date(e.date)>=monthStart).reduce((s,x)=>s+Number(x.amount),0);
    budgetText.textContent = `Usato: €${used.toFixed(2)} / €${state.monthlyBudget.toFixed(2)}`;
    const pct = Math.min(100, Math.round((used/state.monthlyBudget)*100));
    bar.style.width = pct+'%';
    bar.style.background = pct>100? 'linear-gradient(90deg,#ff7a7a,#ff3b30)' : 'linear-gradient(90deg,var(--accent),#60a5fa)';
  }

  function renderCategoryFilters(){
    // populate multi-select
    filterCat.innerHTML = '';
    const cats = [...expenseCategories, ...incomeCategories];
    cats.forEach(c=>{ const opt = document.createElement('option'); opt.value=c; opt.textContent=c; filterCat.appendChild(opt); });
  }

  function renderEntries(){
    const list = getFiltered();
    entriesList.innerHTML = '';
    if(list.length===0){ emptyEl.style.display='block'; return; } else { emptyEl.style.display='none'; }
    list.forEach(e=>{
      const li = document.createElement('li');
      const left = document.createElement('div'); left.style.flex='1';
      left.innerHTML = `<strong>${e.category}</strong><div class="muted">${new Date(e.date).toLocaleDateString('it-IT')}${e.note? ' • '+e.note : ''}</div>`;
      const right = document.createElement('div');
      right.innerHTML = `<div style="text-align:right"><span style="font-weight:600;color:${e.type==='expense'? '#d32f2f':'#059669'}">${e.type==='expense'? '-':'+'} €${Number(e.amount).toFixed(2)}</span><div class="muted">${e.type}</div></div>`;
      const actions = document.createElement('div');
      const editBtn = document.createElement('button'); editBtn.className='btn'; editBtn.textContent='Modifica'; editBtn.onclick=()=>openEdit(e.id);
      const delBtn = document.createElement('button'); delBtn.className='btn'; delBtn.textContent='Elimina'; delBtn.onclick=()=>{ if(confirm('Eliminare?')) deleteEntry(e.id); };
      actions.appendChild(editBtn); actions.appendChild(delBtn);
      actions.style.display='flex'; actions.style.flexDirection='column'; actions.style.gap='6px';
      li.appendChild(left); li.appendChild(right); li.appendChild(actions);
      li.style.display='flex'; li.style.gap='12px'; li.style.alignItems='center';
      entriesList.appendChild(li);
    });
  }

  function renderCharts(){
    const list = getFiltered();
    // Monthly grouped
    const map = {};
    list.forEach(e=>{
      const d = new Date(e.date); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if(!map[key]) map[key] = {expense:0, income:0};
      map[key][e.type === 'expense' ? 'expense' : 'income'] += Number(e.amount);
    });
    const keys = Object.keys(map).sort();
    const labels = keys.map(k=>{ const [y,m]=k.split('-'); return `${m}/${y.slice(2)}`; });
    const expenseData = keys.map(k=>map[k].expense);
    const incomeData = keys.map(k=>map[k].income);

    // Bar chart
    if(barChart) barChart.destroy();
    barChart = new Chart(barCtx, {
      type:'bar',
      data:{ labels, datasets:[{label:'Spese', data:expenseData, stack:'s'},{label:'Entrate', data:incomeData, stack:'s'}] },
      options:{ responsive:true, plugins:{legend:{position:'top'}}, scales:{y:{beginAtZero:true}} }
    });

    // Pie by category (expenses only)
    const byCat = {};
    list.filter(e=>e.type==='expense').forEach(e=> byCat[e.category] = (byCat[e.category]||0)+Number(e.amount));
    const catLabels = Object.keys(byCat);
    const catValues = catLabels.map(l=>byCat[l]);
    if(pieChart) pieChart.destroy();
    pieChart = new Chart(pieCtx, {
      type:'pie', data:{labels:catLabels, datasets:[{data:catValues}]},
      options:{ responsive:true, plugins:{legend:{position:'bottom'}}, onClick(evt, item){ if(item.length){ const idx = item[0].index; focusedCategory = catLabels[idx]===focusedCategory? null: catLabels[idx]; renderAll(); } } }
    });
  }

  // Modal handlers
  btnAdd.addEventListener('click', ()=>{
    editingId = null; modalTitle.textContent='Nuovo movimento'; form.reset(); dateInput.valueAsDate = new Date(); populateCategory('expense'); openModal();
  });
  btnCancel.addEventListener('click', closeModal);
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const type = form.type.value;
    const amount = Number(amountInput.value);
    const date = dateInput.value;
    const category = categorySelect.value;
    const note = noteInput.value.trim();
    if(!amount || !date || !category){ alert('Compila i campi obbligatori'); return; }
    const entry = { id: editingId || uid(), type, amount: amount.toFixed(2), date, category, note };
    if(editingId) updateEntry(entry); else addEntry(entry);
    closeModal();
  });

  function openModal(){ modal.classList.remove('hidden'); }
  function closeModal(){ modal.classList.add('hidden'); }

  function openEdit(id){ const e = state.entries.find(x=>x.id===id); if(!e) return; editingId = id; modalTitle.textContent='Modifica movimento'; form.type.value = e.type; amountInput.value = e.amount; dateInput.value = e.date; populateCategory(e.type, e.category); noteInput.value = e.note||''; openModal(); }

  function populateCategory(type, selected){
    const cats = type==='expense'? expenseCategories : incomeCategories;
    categorySelect.innerHTML = '';
    cats.forEach(c=>{ const opt=document.createElement('option'); opt.value=c; opt.textContent=c; if(c===selected) opt.selected=true; categorySelect.appendChild(opt); });
  }

  // change categories when toggling expense/income
  form.type?.forEach?.(el=> el.addEventListener('change', ()=> populateCategory(form.type.value)));

  // Filters events
  filterFrom.addEventListener('change', renderAll);
  filterTo.addEventListener('change', renderAll);
  filterCat.addEventListener('change', renderAll);
  btnClearFilters.addEventListener('click', ()=>{ filterFrom.value=''; filterTo.value=''; filterCat.selectedIndex=-1; focusedCategory=null; renderAll(); });

  // Export CSV
  btnExport.addEventListener('click', ()=>{
    const rows = [['id','date','amount','category','type','note']];
    getFiltered().forEach(e=> rows.push([e.id,e.date,e.amount,e.category,e.type,e.note||'']));
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.csv`; a.click(); URL.revokeObjectURL(url);
  });

  // Set budget
  btnSetBudget.addEventListener('click', ()=>{
    const val = prompt('Inserisci budget mensile (EUR)', state.monthlyBudget? state.monthlyBudget : '');
    const v = parseFloat(String(val).replace(',','.'));
    if(!isNaN(v)) { state.monthlyBudget = v; save(); renderAll(); }
  });

  // initial setup
  // ensure categories in filter
  (function initFilters(){ const cats = [...expenseCategories, ...incomeCategories]; filterCat.innerHTML=''; cats.forEach(c=>{ const opt=document.createElement('option'); opt.value=c; opt.textContent=c; filterCat.appendChild(opt); }); })();

  // load
  load();
})();
