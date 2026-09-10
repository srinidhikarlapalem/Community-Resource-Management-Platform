import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, HeartHandshake, MapPin, Search, ShieldCheck } from "lucide-react";

type Resource = {id:number; name:string; category:string; description:string; city:string; state:string; quantity_available:number; eligibility:string; organization_name?:string};
const API = import.meta.env.VITE_API_URL ?? "/api";

export default function App() {
  const [resources,setResources]=useState<Resource[]>([]);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("All");
  const [loading,setLoading]=useState(true);
  const [notice,setNotice]=useState("");
  useEffect(()=>{fetch(`${API}/resources`).then(r=>r.json()).then(setResources).catch(()=>setNotice("The resource service is temporarily unavailable")).finally(()=>setLoading(false));},[]);
  const categories=useMemo(()=>["All",...Array.from(new Set(resources.map(r=>r.category)))],[resources]);
  const filtered=resources.filter(r=>(category==="All"||r.category===category)&&`${r.name} ${r.description} ${r.city}`.toLowerCase().includes(query.toLowerCase()));
  function search(event:FormEvent){event.preventDefault();document.getElementById("results")?.scrollIntoView({behavior:"smooth"});}
  return <main>
    <header><a className="brand" href="#"><HeartHandshake/> CommonGround</a><nav><a href="#results">Find support</a><a href="#how">How it works</a><button className="outline">Organization access</button></nav></header>
    <section className="hero">
      <div><span className="eyebrow"><ShieldCheck size={16}/> Verified community resources</span><h1>Find the right support without the runaround</h1><p>Search current food housing transportation and legal resources from trusted organizations across Greater Boston</p>
      <form onSubmit={search}><div className="search"><Search/><input aria-label="Search resources" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search food housing rides or legal help"/><button>Search <ArrowRight size={18}/></button></div></form></div>
      <aside><strong>31</strong><span>resources available today</span><div><CheckCircle2/> Availability is updated by participating organizations</div></aside>
    </section>
    <section className="results" id="results"><div className="section-title"><div><span className="eyebrow">Available now</span><h2>Community support near you</h2></div><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div>
      {notice&&<p className="notice">{notice}</p>}{loading?<div className="loading">Loading current availability</div>:<div className="grid">{filtered.map(resource=><article key={resource.id}><div className="card-top"><span>{resource.category}</span><b>{resource.quantity_available} available</b></div><h3>{resource.name}</h3><p>{resource.description}</p><div className="location"><MapPin size={17}/>{resource.city} {resource.state}</div><small>{resource.organization_name}</small><button onClick={()=>setNotice(`Sign in to request ${resource.name}`)}>View availability <ArrowRight size={17}/></button></article>)}</div>}
    </section>
    <section className="how" id="how"><span className="eyebrow">How it works</span><h2>Clear information at every step</h2><div><article><b>01</b><h3>Search</h3><p>Find services by need and location</p></article><article><b>02</b><h3>Check eligibility</h3><p>Review requirements before requesting support</p></article><article><b>03</b><h3>Reserve</h3><p>Receive confirmation without duplicate bookings</p></article></div></section>
    <footer><HeartHandshake/> CommonGround <span>Built for reliable access to community support</span></footer>
  </main>;
}
