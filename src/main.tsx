import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import './style.css';

type Meal = { idMeal: string; strMeal: string; strCategory: string; strArea: string | null; strMealThumb: string; strInstructions: string };

function App() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'strMeal' | 'strArea'>('strMeal');
  const [descending, setDescending] = useState(false);
  const [category, setCategory] = useState('');
  async function load() {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get<{ meals: Meal[] | null }>('https://www.themealdb.com/api/json/v1/1/search.php?s=', { timeout: 15000 });
      setMeals(data.meals ?? []);
    } catch { setError(true); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const list = meals.filter(m => m.strMeal.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => ((a[sort] ?? '').localeCompare(b[sort] ?? '') || a.strMeal.localeCompare(b.strMeal)) * (descending ? -1 : 1));
  const gallery = meals.filter(m => !category || m.strCategory === category);
  const link = (m: Meal, items: Meal[]) => <Link to={`/meal/${m.idMeal}`} state={{ ids: items.map(item => item.idMeal) }}>{m.strMeal}</Link>;
  return <>
    <header><h1>Meal Browser</h1><p>A small collection of recipes from TheMealDB.</p><nav><NavLink to="/" end>List</NavLink><NavLink to="/gallery">Gallery</NavLink></nav></header>
    <main>
      {loading ? <p role="status">Loading recipes…</p> : error ? <div role="alert"><p>Could not load recipes. Please try again.</p><button onClick={load}>Retry</button></div> : <Routes>
        <Route path="/" element={<><h2>Recipe list</h2><div className="controls"><label>Search recipes<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name" /></label><label>Sort by<select value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="strMeal">Name</option><option value="strArea">Region</option></select></label><label>Order<select value={descending ? 'desc' : 'asc'} onChange={e => setDescending(e.target.value === 'desc')}><option value="asc">Ascending</option><option value="desc">Descending</option></select></label></div><p>{list.length} recipes</p><ul className="list">{list.map(m => <li key={m.idMeal}>{link(m, list)}<span>{m.strCategory} · {m.strArea || 'Unknown region'}</span></li>)}</ul>{!list.length && <p>No recipes match your search.</p>}</>} />
        <Route path="/gallery" element={<><h2>Recipe gallery</h2><label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{[...new Set(meals.map(m => m.strCategory))].sort().map(c => <option key={c}>{c}</option>)}</select></label><p>{gallery.length} recipes</p><div className="gallery">{gallery.map(m => <article key={m.idMeal}><Link to={`/meal/${m.idMeal}`} state={{ ids: gallery.map(item => item.idMeal) }}><img src={m.strMealThumb} alt={m.strMeal} loading="lazy" /><h3>{m.strMeal}</h3></Link><p>{m.strCategory}</p></article>)}</div>{!gallery.length && <p>No recipes in this category.</p>}</>} />
        <Route path="/meal/:id" element={<Details meals={meals} />} />
        <Route path="*" element={<><h2>Page not found</h2><Link to="/">Back to recipes</Link></>} />
      </Routes>}
    </main><footer>Recipes and photos: <a href="https://www.themealdb.com/">TheMealDB</a></footer>
  </>;
}

function Details({ meals }: { meals: Meal[] }) {
  const { id } = useParams();
  const location = useLocation();
  const meal = meals.find(m => m.idMeal === id);
  const selectedIds: string[] = location.state?.ids ?? meals.map(m => m.idMeal);
  const ids = selectedIds.filter(item => meals.some(m => m.idMeal === item));
  const index = ids.indexOf(id ?? '');
  if (!meal) return <><h2>Recipe not found</h2><Link to="/">Back to recipes</Link></>;
  return <><nav className="pager"><Link to={`/meal/${ids[(index - 1 + ids.length) % ids.length]}`} state={{ ids }}>← Previous</Link><Link to={`/meal/${ids[(index + 1) % ids.length]}`} state={{ ids }}>Next →</Link></nav><h2>{meal.strMeal}</h2><p>{meal.strCategory} · {meal.strArea || 'Unknown region'}</p><img className="detail-image" src={meal.strMealThumb} alt={meal.strMeal} /><h3>Instructions</h3><p className="instructions">{meal.strInstructions || 'No instructions available.'}</p></>;
}

createRoot(document.getElementById('root')!).render(<BrowserRouter basename={import.meta.env.BASE_URL}><App /></BrowserRouter>);
