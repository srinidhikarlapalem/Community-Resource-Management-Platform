import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

type Resource = {
  id: number;
  name: string;
  category: string;
  description: string;
  city: string;
  state: string;
  quantity_available: number;
  eligibility: string;
  organization_name?: string;
};
type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization_id?: number;
};
type Reservation = {
  id: number;
  resource_id: number;
  resource_name?: string;
  status: string;
  created_at: string;
};
const API = import.meta.env.VITE_API_URL ?? "/api";

export default function App() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [token, setToken] = useState(
    localStorage.getItem("community_resource_token") ?? "",
  );
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo-password");
  const [fullName, setFullName] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [managed, setManaged] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState({
    name: "",
    category: "Food",
    description: "",
    city: "Boston",
    state: "MA",
    quantity_available: 1,
    eligibility: "",
  });

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  async function request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API}${path}`, options);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || "Request failed");
    }
    return response.status === 204 ? null : response.json();
  }
  async function loadResources() {
    setLoading(true);
    try {
      setResources(await request("/resources?available_only=false"));
    } catch {
      setNotice("The resource service is temporarily unavailable");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadResources();
  }, []);
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    request("/me", { headers: authHeaders }).then(setUser).catch(logout);
  }, [token]);
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(resources.map((r) => r.category)))],
    [resources],
  );
  const filtered = resources.filter(
    (r) =>
      (category === "All" || r.category === category) &&
      `${r.name} ${r.description} ${r.city}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function search(event: FormEvent) {
    event.preventDefault();
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  }
  function logout() {
    localStorage.removeItem("community_resource_token");
    setToken("");
    setUser(null);
    setAccountOpen(false);
  }
  async function authenticate(event: FormEvent) {
    event.preventDefault();
    try {
      let data;
      if (authMode === "register") {
        data = await request("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: fullName }),
        });
      } else {
        const form = new URLSearchParams({ username: email, password });
        data = await request("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form,
        });
      }
      localStorage.setItem("community_resource_token", data.access_token);
      setToken(data.access_token);
      setAuthOpen(false);
      setNotice("You are signed in");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign in failed");
    }
  }
  async function reserve(resource: Resource) {
    if (!token) {
      setAuthOpen(true);
      return;
    }
    try {
      await request("/reservations", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          resource_id: resource.id,
          idempotency_key: crypto.randomUUID(),
        }),
      });
      setNotice(`${resource.name} is reserved`);
      await loadResources();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Reservation failed");
    }
  }
  async function joinWaitlist(resource: Resource) {
    if (!token) {
      setAuthOpen(true);
      return;
    }
    try {
      await request("/waitlist", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ resource_id: resource.id }),
      });
      setNotice(`You joined the waitlist for ${resource.name}`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Waitlist request failed",
      );
    }
  }
  async function openAccount() {
    setAccountOpen(true);
    try {
      setReservations(
        await request("/reservations/me", { headers: authHeaders }),
      );
      if (user?.role !== "seeker")
        setManaged(
          await request("/organization/resources", { headers: authHeaders }),
        );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Account data failed to load",
      );
    }
  }
  async function cancelReservation(id: number) {
    try {
      await request(`/reservations/${id}/cancel`, {
        method: "POST",
        headers: authHeaders,
      });
      await openAccount();
      await loadResources();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Cancellation failed");
    }
  }
  async function createResource(event: FormEvent) {
    event.preventDefault();
    try {
      await request("/resources", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(newResource),
      });
      setNewResource({
        ...newResource,
        name: "",
        description: "",
        eligibility: "",
        quantity_available: 1,
      });
      setManaged(
        await request("/organization/resources", { headers: authHeaders }),
      );
      await loadResources();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Resource creation failed",
      );
    }
  }
  async function changeQuantity(resource: Resource, quantity: number) {
    try {
      await request(`/resources/${resource.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ quantity_available: Math.max(0, quantity) }),
      });
      setManaged(
        await request("/organization/resources", { headers: authHeaders }),
      );
      await loadResources();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Inventory update failed",
      );
    }
  }

  return (
    <main>
      <header>
        <a className="brand" href="#">
          <HeartHandshake /> Community Resource Platform
        </a>
        <nav>
          <a href="#results">Find support</a>
          <a href="#how">How it works</a>
          {user ? (
            <>
              <button className="outline user-button" onClick={openAccount}>
                <UserRound size={17} />
                {user.full_name}
              </button>
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={logout}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button className="outline" onClick={() => setAuthOpen(true)}>
              Sign in
            </button>
          )}
        </nav>
      </header>
      <section className="hero">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={16} /> Verified community resources
          </span>
          <h1>Find the right support without the runaround</h1>
          <p>
            Search current food housing transportation and legal resources from
            trusted organizations across Greater Boston
          </p>
          <form onSubmit={search}>
            <div className="search">
              <Search />
              <input
                aria-label="Search resources"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search food housing rides or legal help"
              />
              <button>
                Search <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
        <aside>
          <strong>
            {resources.reduce((sum, r) => sum + r.quantity_available, 0)}
          </strong>
          <span>services available today</span>
          <div>
            <CheckCircle2 /> Availability is updated by participating
            organizations
          </div>
        </aside>
      </section>
      <section className="results" id="results">
        <div className="section-title">
          <div>
            <span className="eyebrow">Available now</span>
            <h2>Community support near you</h2>
          </div>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        {notice && <p className="notice">{notice}</p>}
        {loading ? (
          <div className="loading">Loading current availability</div>
        ) : (
          <div className="grid">
            {filtered.map((resource) => (
              <article key={resource.id}>
                <div className="card-top">
                  <span>{resource.category}</span>
                  <b>{resource.quantity_available} available</b>
                </div>
                <h3>{resource.name}</h3>
                <p>{resource.description}</p>
                <div className="location">
                  <MapPin size={17} />
                  {resource.city} {resource.state}
                </div>
                <small>{resource.organization_name}</small>
                <small className="eligibility">
                  Eligibility {resource.eligibility}
                </small>
                <button
                  onClick={() =>
                    resource.quantity_available
                      ? reserve(resource)
                      : joinWaitlist(resource)
                  }
                >
                  {resource.quantity_available
                    ? "Reserve support"
                    : "Join waitlist"}
                  <ArrowRight size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="how" id="how">
        <span className="eyebrow">How it works</span>
        <h2>Clear information at every step</h2>
        <div>
          <article>
            <b>01</b>
            <h3>Search</h3>
            <p>Find services by need and location</p>
          </article>
          <article>
            <b>02</b>
            <h3>Check eligibility</h3>
            <p>Review requirements before requesting support</p>
          </article>
          <article>
            <b>03</b>
            <h3>Reserve</h3>
            <p>Receive confirmation without duplicate bookings</p>
          </article>
        </div>
      </section>
      <footer>
        <HeartHandshake /> Community Resource Platform{" "}
        <span>Built for reliable access to community support</span>
      </footer>
      {authOpen && (
        <div className="overlay">
          <section className="modal">
            <button className="close" onClick={() => setAuthOpen(false)}>
              <X />
            </button>
            <span className="eyebrow">Secure access</span>
            <h2>
              {authMode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <form className="stack" onSubmit={authenticate}>
              {authMode === "register" && (
                <label>
                  Full name
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>
              )}
              <label>
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button>{authMode === "login" ? "Sign in" : "Register"}</button>
            </form>
            <button
              className="text-button"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
            >
              {authMode === "login"
                ? "Create a new account"
                : "Use an existing account"}
            </button>
            <p className="demo">
              Seeker demo uses demo@example.com and demo-password
              <br />
              Partner demo uses partner@example.com and partner-password
            </p>
          </section>
        </div>
      )}
      {accountOpen && (
        <div className="overlay">
          <section className="drawer">
            <button className="close" onClick={() => setAccountOpen(false)}>
              <X />
            </button>
            <span className="eyebrow">Account</span>
            <h2>{user?.full_name}</h2>
            <p>{user?.email}</p>
            <h3>Reservation history</h3>
            {reservations.length === 0 ? (
              <p>No reservations yet</p>
            ) : (
              reservations.map((item) => (
                <div className="reservation" key={item.id}>
                  <div>
                    <b>
                      {item.resource_name || `Resource ${item.resource_id}`}
                    </b>
                    <small>
                      {item.status}{" "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  {item.status === "confirmed" && (
                    <button onClick={() => cancelReservation(item.id)}>
                      Cancel
                    </button>
                  )}
                </div>
              ))
            )}
            {user?.role !== "seeker" && (
              <>
                <h3>Organization inventory</h3>
                {managed.map((item) => (
                  <div className="inventory" key={item.id}>
                    <span>{item.name}</span>
                    <input
                      aria-label={`${item.name} quantity`}
                      type="number"
                      min="0"
                      value={item.quantity_available}
                      onChange={(e) =>
                        changeQuantity(item, Number(e.target.value))
                      }
                    />
                  </div>
                ))}
                <h3>Add a resource</h3>
                <form className="stack compact" onSubmit={createResource}>
                  <input
                    required
                    placeholder="Resource name"
                    value={newResource.name}
                    onChange={(e) =>
                      setNewResource({ ...newResource, name: e.target.value })
                    }
                  />
                  <select
                    value={newResource.category}
                    onChange={(e) =>
                      setNewResource({
                        ...newResource,
                        category: e.target.value,
                      })
                    }
                  >
                    <option>Food</option>
                    <option>Housing</option>
                    <option>Transportation</option>
                    <option>Legal</option>
                    <option>Health</option>
                  </select>
                  <input
                    required
                    placeholder="Description"
                    value={newResource.description}
                    onChange={(e) =>
                      setNewResource({
                        ...newResource,
                        description: e.target.value,
                      })
                    }
                  />
                  <input
                    required
                    placeholder="Eligibility"
                    value={newResource.eligibility}
                    onChange={(e) =>
                      setNewResource({
                        ...newResource,
                        eligibility: e.target.value,
                      })
                    }
                  />
                  <input
                    required
                    type="number"
                    min="0"
                    value={newResource.quantity_available}
                    onChange={(e) =>
                      setNewResource({
                        ...newResource,
                        quantity_available: Number(e.target.value),
                      })
                    }
                  />
                  <button>Add resource</button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
