// js/app.js
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const J=async f=>(await fetch('data/'+f+'.json')).json();
const D=d=>new Date(d+'T12:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const st={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const at=i=>{const d=new Date(Date.now()+i*864e5);return{date:d.toLocaleDateString('sv-SE',{timeZone:'Europe/Paris'}),day:d.toLocaleDateString('fr-FR',{timeZone:'Europe/Paris',weekday:'long'})}};
const T=at(0).date,mm=h=>{const[a,b]=h.split(':');return a*60+ +b};
const NAV=[['accueil','Accueil','🏠'],['actus','Actualités','📰'],['agenda','Agenda','📅'],['elus','Élus','🏛️'],['guide','Nouveaux habitants','📦'],['horaires','Horaires','🕘'],['assos','Associations','🤝'],['contact','Contact','✉️'],['signaler','Signaler','📣'],['meteo','Météo','⛅']];
let ELUS=[];
async function feries(){const c=st.get('feries',null);if(c&&c.d===T)return c.v;try{const v=await(await fetch('https://calendrier.api.gouv.fr/jours-feries/metropole.json')).json();st.set('feries',{d:T,v});return v}catch{return c?.v||{}}}
async function statut(m){const f=await feries(),now=new Date().toLocaleTimeString('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}),n=mm(now);
const closed=d=>f[d]?'Jour férié : '+f[d]:(m.fermetures||[]).find(x=>d>=x.du&&d<=x.au)?.motif;
const x=at(0),why=closed(x.date),open=!why&&(m.horaires[x.day]||[]).some(([a,b])=>n>=mm(a)&&n<mm(b));let next='';
for(let i=0;i<15&&!next;i++){const y=at(i);if(closed(y.date))continue;const s=(m.horaires[y.day]||[]).find(([a])=>i>0||mm(a)>n);if(s)next=(i?y.day+' ':'aujourd’hui ')+'à '+s[0]}
return{open,why,next,ferie:f[T]}}
const stHtml=s=>`<p class="${s.open?'ok':'ko'}">${s.open?'Mairie ouverte maintenant':'Mairie fermée'}${s.why?' ('+esc(s.why)+')':''}</p>${s.open?'':'<p>Prochaine ouverture : '+esc(s.next||'à venir')+'</p>'}`;
const WM=c=>c==0?'☀️':c<4?'⛅':c<50?'🌫️':c<70?'🌧️':c<80?'❄️':c<95?'🌦️':'⛈️';
async function meteo(m){if(!(+m.lat&&+m.lon))return'<p>Météo indisponible : coordonnées GPS à compléter dans <code>data/mairie.json</code>.</p>';
let c=st.get('meteo',null);if(!c||Date.now()-c.t>9e5){const v=await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.lat}&longitude=${m.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis&forecast_days=3`)).json();c={t:Date.now(),v};st.set('meteo',c)}
const v=c.v;return`<p style="font-size:2rem">${WM(v.current.weather_code)} ${Math.round(v.current.temperature_2m)} °C</p><ul>${v.daily.time.map((d,i)=>`<li>${new Date(d+'T12:00').toLocaleDateString('fr-FR',{weekday:'long'})} ${WM(v.daily.weather_code[i])} ${Math.round(v.daily.temperature_2m_min[i])}° / ${Math.round(v.daily.temperature_2m_max[i])}°</li>`).join('')}</ul>`}
const ics=e=>'data:text/calendar;charset=utf-8,'+encodeURIComponent(['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Villiersfox//FR','BEGIN:VEVENT','UID:'+e.id+'@villiersfox','DTSTAMP:'+new Date().toISOString().replace(/[-:]|\.\d+/g,''),'DTSTART;TZID=Europe/Paris:'+e.date.replace(/-/g,'')+'T'+(e.debut||'00:00').replace(':','')+'00','SUMMARY:'+e.titre,'LOCATION:'+e.lieu,'DESCRIPTION:'+e.description,'END:VEVENT','END:VCALENDAR'].join('\r\n'));
const newsCard=a=>`<article class="card"><span class="tag">${esc(a.categorie)}</span><h3>${esc(a.titre)}</h3><p><small>${D(a.date.slice(0,10))}</small></p>${a.photo?`<img src="${esc(a.photo)}" alt="" loading="lazy" style="max-width:100%;border-radius:12px">`:''}<p>${esc(a.excerpt)}</p><details><summary>Lire la suite</summary><p>${esc(a.body)}</p></details><a class="btn alt" href="mailto:?subject=${encodeURIComponent(a.titre)}&body=${encodeURIComponent(a.excerpt+' — '+location.origin)}">Partager</a></article>`;
const evCard=e=>`<article class="card ${e.date<T?'past':''}" data-m="${e.date.slice(0,7)}"><h3>${esc(e.titre)}</h3><p>${D(e.date)} à ${esc(e.debut)}<br>${esc(e.lieu)}</p><p>${esc(e.description)}</p>${e.date<T?'<p>Événement passé</p>':`<a class="btn alt" download="evenement.ics" href="${ics(e)}">Ajouter à mon calendrier</a>`}</article>`;
