const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const db = {
  teams: [
    { id: 'team_01', nom: 'Phoenix Squad', jeu_nom: 'Valorant', niveau: 'Pro',     region: 'MENA', nombre_joueurs: 2 },
    { id: 'team_02', nom: 'Shadow Wolves', jeu_nom: 'Valorant', niveau: 'Amateur', region: 'MENA', nombre_joueurs: 1 },
  ],
  joueurs: [
    { id:'jou_01', pseudo:'PhoenixX', email:'phoenix@mail.com', niveau:'Gold', team_id:'team_01', fullname:'Ali Ben Amor', country:'TN', game:'Valorant', rank:'Diamond', role:'Duelist', image_url:'https://i.pravatar.cc/150?u=jou_01', age:22, score:1450, wins:34, losses:12, matches:46, winrate:73.9, password:'hashed1' },
    { id:'jou_02', pseudo:'ShadowK',  email:'shadowk@mail.com',  niveau:'Gold', team_id:'team_01', fullname:'Khaled Mrad',  country:'TN', game:'Valorant', rank:'Platinum', role:'Controller', image_url:'https://i.pravatar.cc/150?u=jou_02', age:20, score:1390, wins:28, losses:14, matches:42, winrate:66.7, password:'hashed2' },
    { id:'jou_03', pseudo:'WolfByte', email:'wolf@mail.com',     niveau:'Silver', team_id:'team_02', fullname:'Sami Kacem', country:'DZ', game:'Valorant', rank:'Gold', role:'Initiator', image_url:'https://i.pravatar.cc/150?u=jou_03', age:19, score:980, wins:18, losses:20, matches:38, winrate:47.4, password:'hashed3' },
  ],
  managers: [
    { id:'mgr_01', nom:'Karim Mansour', email:'karim@arenax.com', team_id:'team_01', user_ref:'usr_99' },
    { id:'mgr_02', nom:'Ines Trabelsi', email:'ines@arenax.com',  team_id:'team_02', user_ref:'usr_88' },
  ],
  tournois: [
    { id:'tour_01', nom:'AreNaX Cup 2026', jeu:'Valorant', description:'Tournoi open MENA', location:'Tunis', max_teams:16, prize_pool:5000, equipes:['team_01','team_02'], teamImage:'https://i.pravatar.cc/80?u=tour01' },
  ],
  matches: [
    { id:'match_01', team1_id:'team_01', team2_id:'team_02', team1_image:'https://i.pravatar.cc/80?u=t1', team2_image:'https://i.pravatar.cc/80?u=t2', date:'2026-06-01T18:00:00', status:'live', score_team1:2, score_team2:1, event_name:'AreNaX Cup 2026', game_title:'Valorant', streamer:'AreNaXTV', stream_url:'https://twitch.tv/arenax', viewers:1240 },
  ],
};

const safeJoueur = j => { const {password,...s}=j; return s; };
const calcWinrate = (w,m) => m===0 ? 0 : parseFloat(((w/m)*100).toFixed(1));

app.get('/', (_,res)=>res.json({ message:'AreNaX API v1', routes:['teams','joueurs','managers','tournois','matches'] }));

// TEAMS
app.get('/teams', (req,res)=>{ let r=[...db.teams]; if(req.query.jeu_nom)r=r.filter(t=>t.jeu_nom===req.query.jeu_nom); if(req.query.niveau)r=r.filter(t=>t.niveau===req.query.niveau); if(req.query.region)r=r.filter(t=>t.region===req.query.region); res.json(r); });
app.get('/teams/:id', (req,res)=>{ const t=db.teams.find(t=>t.id===req.params.id); if(!t)return res.status(404).json({error:'Team introuvable'}); res.json(t); });
app.get('/teams/:id/joueurs', (req,res)=>{ const t=db.teams.find(t=>t.id===req.params.id); if(!t)return res.status(404).json({error:'Team introuvable'}); res.json({team:t,joueurs:db.joueurs.filter(j=>j.team_id===req.params.id).map(safeJoueur)}); });
app.get('/teams/:id/manager', (req,res)=>{ const m=db.managers.find(m=>m.team_id===req.params.id); if(!m)return res.status(404).json({error:'Aucun manager assigné'}); res.json(m); });
app.post('/teams', (req,res)=>{ const {nom,jeu_nom,niveau,region}=req.body; if(!nom||!jeu_nom)return res.status(400).json({error:'nom et jeu_nom requis'}); const t={id:'team_'+uuidv4().slice(0,6),nom,jeu_nom,niveau:niveau||'Amateur',region:region||'',nombre_joueurs:0}; db.teams.push(t); res.status(201).json(t); });
app.put('/teams/:id', (req,res)=>{ const i=db.teams.findIndex(t=>t.id===req.params.id); if(i===-1)return res.status(404).json({error:'Team introuvable'}); db.teams[i]={...db.teams[i],...req.body,id:req.params.id}; res.json(db.teams[i]); });
app.delete('/teams/:id', (req,res)=>{ const i=db.teams.findIndex(t=>t.id===req.params.id); if(i===-1)return res.status(404).json({error:'Team introuvable'}); db.teams.splice(i,1); res.status(204).send(); });

// JOUEURS
app.get('/joueurs/classement', (req,res)=>{ let r=db.joueurs.map(safeJoueur); if(req.query.game)r=r.filter(j=>j.game===req.query.game); const by=req.query.sort_by||'score'; if(['score','winrate','wins'].includes(by))r.sort((a,b)=>b[by]-a[by]); r=r.slice(0,parseInt(req.query.limit)||10); res.json(r.map((j,i)=>({rank:i+1,pseudo:j.pseudo,fullname:j.fullname,game:j.game,score:j.score,winrate:j.winrate,wins:j.wins,image_url:j.image_url}))); });
app.get('/joueurs', (req,res)=>{ let r=db.joueurs.map(safeJoueur); if(req.query.team_id)r=r.filter(j=>j.team_id===req.query.team_id); if(req.query.game)r=r.filter(j=>j.game===req.query.game); if(req.query.role)r=r.filter(j=>j.role===req.query.role); if(req.query.niveau)r=r.filter(j=>j.niveau===req.query.niveau); if(req.query.country)r=r.filter(j=>j.country===req.query.country); const s=req.query.sort||'score'; if(['score','winrate','wins'].includes(s))r.sort((a,b)=>b[s]-a[s]); res.json(r); });
app.get('/joueurs/:id', (req,res)=>{ const j=db.joueurs.find(j=>j.id===req.params.id); if(!j)return res.status(404).json({error:'Joueur introuvable'}); res.json(safeJoueur(j)); });
app.post('/joueurs', (req,res)=>{ const {pseudo,email,fullname,password,niveau,team_id,country,game,rank,role,image_url,age}=req.body; if(!pseudo||!email||!password)return res.status(400).json({error:'pseudo, email et password requis'}); const j={id:'jou_'+uuidv4().slice(0,6),pseudo,email,fullname:fullname||'',niveau:niveau||'Bronze',team_id:team_id||null,country:country||'',game:game||'',rank:rank||'',role:role||'',image_url:image_url||'',age:age||0,score:0,wins:0,losses:0,matches:0,winrate:0,password}; db.joueurs.push(j); if(team_id){const t=db.teams.find(t=>t.id===team_id);if(t)t.nombre_joueurs++;} res.status(201).json(safeJoueur(j)); });
app.put('/joueurs/:id', (req,res)=>{ const i=db.joueurs.findIndex(j=>j.id===req.params.id); if(i===-1)return res.status(404).json({error:'Joueur introuvable'}); const {password,id,score,wins,losses,matches,winrate,...ed}=req.body; db.joueurs[i]={...db.joueurs[i],...ed}; res.json(safeJoueur(db.joueurs[i])); });
app.patch('/joueurs/:id/stats', (req,res)=>{ const j=db.joueurs.find(j=>j.id===req.params.id); if(!j)return res.status(404).json({error:'Joueur introuvable'}); const {result,score_delta=0}=req.body; if(!['win','loss'].includes(result))return res.status(400).json({error:'result doit être win ou loss'}); j.matches++;j.score+=score_delta;if(result==='win')j.wins++;else j.losses++;j.winrate=calcWinrate(j.wins,j.matches); res.json(safeJoueur(j)); });
app.delete('/joueurs/:id', (req,res)=>{ const i=db.joueurs.findIndex(j=>j.id===req.params.id); if(i===-1)return res.status(404).json({error:'Joueur introuvable'}); db.joueurs.splice(i,1); res.status(204).send(); });

// MANAGERS
app.get('/managers', (req,res)=>{ let r=[...db.managers]; if(req.query.team_id)r=r.filter(m=>m.team_id===req.query.team_id); res.json(r); });
app.get('/managers/:id', (req,res)=>{ const m=db.managers.find(m=>m.id===req.params.id); if(!m)return res.status(404).json({error:'Manager introuvable'}); const t=db.teams.find(t=>t.id===m.team_id); res.json({...m,team:t||null}); });
app.post('/managers', (req,res)=>{ const {nom,email,team_id,user_ref}=req.body; if(!nom||!email)return res.status(400).json({error:'nom et email requis'}); const m={id:'mgr_'+uuidv4().slice(0,6),nom,email,team_id:team_id||null,user_ref:user_ref||null}; db.managers.push(m); res.status(201).json(m); });
app.put('/managers/:id', (req,res)=>{ const i=db.managers.findIndex(m=>m.id===req.params.id); if(i===-1)return res.status(404).json({error:'Manager introuvable'}); db.managers[i]={...db.managers[i],...req.body,id:req.params.id}; res.json(db.managers[i]); });
app.delete('/managers/:id', (req,res)=>{ const i=db.managers.findIndex(m=>m.id===req.params.id); if(i===-1)return res.status(404).json({error:'Manager introuvable'}); db.managers.splice(i,1); res.status(204).send(); });
app.post('/managers/:id/report', (req,res)=>{ const m=db.managers.find(m=>m.id===req.params.id); if(!m)return res.status(404).json({error:'Manager introuvable'}); const {period='weekly',email,format='pdf'}=req.body; res.status(202).json({message:'Rapport en cours de génération',recipient:email||m.email,period,format,estimated_delivery:'< 2 minutes'}); setTimeout(()=>console.log(`Rapport ${period} envoyé à ${email||m.email}`),2000); });

// TOURNOIS
app.get('/tournois', (req,res)=>{ let r=[...db.tournois]; if(req.query.jeu)r=r.filter(t=>t.jeu===req.query.jeu); if(req.query.location)r=r.filter(t=>t.location===req.query.location); res.json(r); });
app.get('/tournois/:id', (req,res)=>{ const t=db.tournois.find(t=>t.id===req.params.id); if(!t)return res.status(404).json({error:'Tournoi introuvable'}); res.json(t); });
app.get('/tournois/:id/matches', (req,res)=>{ const t=db.tournois.find(t=>t.id===req.params.id); if(!t)return res.status(404).json({error:'Tournoi introuvable'}); res.json(db.matches.filter(m=>m.event_name===t.nom)); });
app.post('/tournois', (req,res)=>{ const {nom,jeu,description,location,max_teams,prize_pool,equipes,teamImage}=req.body; if(!nom||!jeu)return res.status(400).json({error:'nom et jeu requis'}); const t={id:'tour_'+uuidv4().slice(0,6),nom,jeu,description:description||'',location:location||'',max_teams:max_teams||16,prize_pool:prize_pool||0,equipes:equipes||[],teamImage:teamImage||''}; db.tournois.push(t); res.status(201).json(t); });
app.post('/tournois/:id/inscrire', (req,res)=>{ const t=db.tournois.find(t=>t.id===req.params.id); if(!t)return res.status(404).json({error:'Tournoi introuvable'}); const {team_id}=req.body; if(!team_id)return res.status(400).json({error:'team_id requis'}); if(t.equipes.includes(team_id))return res.status(409).json({error:'Équipe déjà inscrite'}); if(t.equipes.length>=t.max_teams)return res.status(409).json({error:`Tournoi complet (${t.max_teams} max)`}); t.equipes.push(team_id); res.json({id:t.id,equipes:t.equipes,places_restantes:t.max_teams-t.equipes.length}); });
app.put('/tournois/:id', (req,res)=>{ const i=db.tournois.findIndex(t=>t.id===req.params.id); if(i===-1)return res.status(404).json({error:'Tournoi introuvable'}); db.tournois[i]={...db.tournois[i],...req.body,id:req.params.id}; res.json(db.tournois[i]); });
app.delete('/tournois/:id', (req,res)=>{ const i=db.tournois.findIndex(t=>t.id===req.params.id); if(i===-1)return res.status(404).json({error:'Tournoi introuvable'}); db.tournois.splice(i,1); res.status(204).send(); });

// MATCHES
app.get('/matches/live', (_,res)=>res.json(db.matches.filter(m=>m.status==='live')));
app.get('/matches', (req,res)=>{ let r=[...db.matches]; if(req.query.status)r=r.filter(m=>m.status===req.query.status); if(req.query.team_id)r=r.filter(m=>m.team1_id===req.query.team_id||m.team2_id===req.query.team_id); if(req.query.game_title)r=r.filter(m=>m.game_title===req.query.game_title); if(req.query.event_name)r=r.filter(m=>m.event_name===req.query.event_name); res.json(r); });
app.get('/matches/:id', (req,res)=>{ const m=db.matches.find(m=>m.id===req.params.id); if(!m)return res.status(404).json({error:'Match introuvable'}); res.json(m); });
app.post('/matches', (req,res)=>{ const {team1_id,team2_id,team1_image,team2_image,date,event_name,game_title,streamer,stream_url}=req.body; if(!team1_id||!team2_id)return res.status(400).json({error:'team1_id et team2_id requis'}); const m={id:'match_'+uuidv4().slice(0,6),team1_id,team2_id,team1_image:team1_image||'',team2_image:team2_image||'',date:date||new Date().toISOString(),status:'upcoming',score_team1:0,score_team2:0,event_name:event_name||'',game_title:game_title||'',streamer:streamer||'',stream_url:stream_url||'',viewers:0}; db.matches.push(m); res.status(201).json(m); });
app.patch('/matches/:id/score', (req,res)=>{ const m=db.matches.find(m=>m.id===req.params.id); if(!m)return res.status(404).json({error:'Match introuvable'}); const {score_team1,score_team2,viewers}=req.body; if(score_team1!==undefined)m.score_team1=score_team1; if(score_team2!==undefined)m.score_team2=score_team2; if(viewers!==undefined)m.viewers=viewers; m.status='live'; res.json(m); });
app.patch('/matches/:id/terminer', (req,res)=>{ const m=db.matches.find(m=>m.id===req.params.id); if(!m)return res.status(404).json({error:'Match introuvable'}); const {score_team1,score_team2}=req.body; m.score_team1=score_team1;m.score_team2=score_team2;m.status='finished'; const winner=score_team1>score_team2?m.team1_id:m.team2_id; db.joueurs.forEach(j=>{ if(j.team_id===m.team1_id||j.team_id===m.team2_id){const won=j.team_id===winner;j.matches++;if(won)j.wins++;else j.losses++;j.winrate=calcWinrate(j.wins,j.matches);} }); res.json({...m,winner_team_id:winner}); });
app.put('/matches/:id', (req,res)=>{ const i=db.matches.findIndex(m=>m.id===req.params.id); if(i===-1)return res.status(404).json({error:'Match introuvable'}); db.matches[i]={...db.matches[i],...req.body,id:req.params.id}; res.json(db.matches[i]); });
app.delete('/matches/:id', (req,res)=>{ const i=db.matches.findIndex(m=>m.id===req.params.id); if(i===-1)return res.status(404).json({error:'Match introuvable'}); db.matches.splice(i,1); res.status(204).send(); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AreNaX API sur http://localhost:${PORT}`));
