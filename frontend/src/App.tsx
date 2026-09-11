import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  HeartHandshake,
  Info,
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
type RequestRecord = {
  id: number;
  resource_id: number;
  resource_name?: string;
  status: string;
  created_at: string;
};
type FlowStage = "details" | "confirm" | "success";
type Completion = { kind: "reservation" | "waitlist"; id: number };
const API = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "community_resource_token";

export default function App() {
  const [resources, setResources] = useState<Resource[]>([]),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true),
    [notice, setNotice] = useState("");
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) ?? ""),
    [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false),
    [accountOpen, setAccountOpen] = useState(false),
    [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@example.com"),
    [password, setPassword] = useState("demo-password"),
    [fullName, setFullName] = useState("");
  const [reservations, setReservations] = useState<RequestRecord[]>([]),
    [waitlist, setWaitlist] = useState<RequestRecord[]>([]),
    [managed, setManaged] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
      null,
    ),
    [flowStage, setFlowStage] = useState<FlowStage>("details"),
    [completion, setCompletion] = useState<Completion | null>(null),
    [submitting, setSubmitting] = useState(false);
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
      setNotice("The resource service is temporarily unavailable.");
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
      `${r.name} ${r.description} ${r.city} ${r.organization_name ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function search(event: FormEvent) {
    event.preventDefault();
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  }
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setAccountOpen(false);
  }
  async function authenticate(event: FormEvent) {
    event.preventDefault();
    try {
      if (authMode === "register")
        await request("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: fullName }),
        });
      const form = new URLSearchParams({ username: email, password });
      const data = await request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setAuthOpen(false);
      if (selectedResource) setFlowStage("confirm");
      setNotice("You are signed in.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign in failed");
    }
  }
  function openDetails(resource: Resource) {
    setSelectedResource(resource);
    setFlowStage("details");
    setCompletion(null);
  }
  function continueRequest() {
    if (!token) {
      setAuthOpen(true);
      return;
    }
    setFlowStage("confirm");
  }
  async function completeRequest() {
    if (!selectedResource) return;
    setSubmitting(true);
    try {
      if (selectedResource.quantity_available > 0) {
        const result = await request("/reservations", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            resource_id: selectedResource.id,
            idempotency_key: crypto.randomUUID(),
          }),
        });
        setCompletion({ kind: "reservation", id: result.id });
      } else {
        const result = await request("/waitlist", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ resource_id: selectedResource.id }),
        });
        setCompletion({ kind: "waitlist", id: result.id });
      }
      setFlowStage("success");
      await loadResources();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }
  async function openAccount() {
    setAccountOpen(true);
    try {
      const [rs, ws] = await Promise.all([
        request("/reservations/me", { headers: authHeaders }),
        request("/waitlist/me", { headers: authHeaders }),
      ]);
      setReservations(rs);
      setWaitlist(ws);
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
  function showRequests() {
    setSelectedResource(null);
    openAccount();
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
                <UserRound size={17} /> My requests
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
            Search current food, housing, transportation, and legal resources
            from trusted organizations across Greater Boston.
          </p>
          <form onSubmit={search}>
            <div className="search">
              <Search />
              <input
                aria-label="Search resources"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search food, housing, rides, or legal help"
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
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {loading ? (
          <div className="loading">Loading current availability</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Search />
            <h3>No matching resources</h3>
            <p>Try a different search term or choose another category.</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((resource) => (
              <article key={resource.id}>
                <div className="card-top">
                  <span>{resource.category}</span>
                  <b
                    className={
                      resource.quantity_available === 0 ? "unavailable" : ""
                    }
                  >
                    {resource.quantity_available > 0
                      ? `${resource.quantity_available} available`
                      : "Waitlist open"}
                  </b>
                </div>
                <h3>{resource.name}</h3>
                <p>{resource.description}</p>
                <div className="location">
                  <MapPin size={17} /> {resource.city}, {resource.state}
                </div>
                <small>{resource.organization_name}</small>
                <small className="eligibility">
                  <b>Eligibility:</b> {resource.eligibility}
                </small>
                <button onClick={() => openDetails(resource)}>
                  View details <ArrowRight size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
        <p className="disclaimer">
          <Info size={16} /> Portfolio demonstration using synthetic
          organizations and resources. No real service requests are submitted.
        </p>
      </section>
      <section className="how" id="how">
        <span className="eyebrow">How it works</span>
        <h2>Clear information at every step</h2>
        <div>
          <article>
            <b>01</b>
            <h3>Search</h3>
            <p>Find services by need and location.</p>
          </article>
          <article>
            <b>02</b>
            <h3>Review</h3>
            <p>See eligibility, availability, and what happens next.</p>
          </article>
          <article>
            <b>03</b>
            <h3>Request</h3>
            <p>Confirm a reservation or join the waitlist and track it.</p>
          </article>
        </div>
      </section>
      <footer>
        <HeartHandshake /> Community Resource Platform{" "}
        <span>Built for reliable access to community support</span>
      </footer>

      {selectedResource && (
        <div className="overlay resource-overlay">
          <section
            className="modal resource-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-title"
          >
            <button
              className="close"
              aria-label="Close"
              onClick={() => setSelectedResource(null)}
            >
              <X />
            </button>
            {flowStage === "details" && (
              <>
                <span className="eyebrow">{selectedResource.category}</span>
                <h2 id="resource-title">{selectedResource.name}</h2>
                <p className="provider">
                  Provided by {selectedResource.organization_name}
                </p>
                <div className="availability-panel">
                  <b>
                    {selectedResource.quantity_available > 0
                      ? `${selectedResource.quantity_available} spots available`
                      : "Currently full"}
                  </b>
                  <span>
                    {selectedResource.quantity_available > 0
                      ? "You can request one spot now."
                      : "You can join the waitlist for updates."}
                  </span>
                </div>
                <div className="detail-section">
                  <h3>What this service provides</h3>
                  <p>{selectedResource.description}</p>
                </div>
                <div className="detail-grid">
                  <div>
                    <h3>Eligibility</h3>
                    <p>{selectedResource.eligibility}</p>
                  </div>
                  <div>
                    <h3>Location</h3>
                    <p>
                      <MapPin size={17} /> {selectedResource.city},{" "}
                      {selectedResource.state}
                    </p>
                  </div>
                </div>
                <div className="detail-section">
                  <h3>What happens next</h3>
                  <p>
                    After you confirm, this request will appear under My
                    requests. In a real service, the participating organization
                    would contact you with scheduling or intake instructions.
                  </p>
                </div>
                <div className="flow-actions">
                  <button
                    className="secondary"
                    onClick={() => setSelectedResource(null)}
                  >
                    Close
                  </button>
                  <button onClick={continueRequest}>
                    {selectedResource.quantity_available > 0
                      ? "Continue to request"
                      : "Continue to waitlist"}
                    <ArrowRight size={17} />
                  </button>
                </div>
              </>
            )}
            {flowStage === "confirm" && (
              <>
                <button
                  className="back-button"
                  onClick={() => setFlowStage("details")}
                >
                  <ArrowLeft size={16} /> Back to details
                </button>
                <span className="eyebrow">Final step</span>
                <h2 id="resource-title">
                  Confirm your{" "}
                  {selectedResource.quantity_available > 0
                    ? "request"
                    : "waitlist spot"}
                </h2>
                <div className="request-summary">
                  <h3>{selectedResource.name}</h3>
                  <p>{selectedResource.organization_name}</p>
                  <span>
                    <MapPin size={16} /> {selectedResource.city},{" "}
                    {selectedResource.state}
                  </span>
                </div>
                <div className="detail-section">
                  <h3>You are confirming</h3>
                  <p>
                    {selectedResource.quantity_available > 0
                      ? "One available spot will be reserved for this demonstration account."
                      : "Your demonstration account will be added to the waitlist."}
                  </p>
                </div>
                <p className="privacy-note">
                  <ShieldCheck size={18} /> Only the information needed to
                  manage this demonstration request is stored.
                </p>
                <div className="flow-actions">
                  <button
                    className="secondary"
                    onClick={() => setFlowStage("details")}
                  >
                    Go back
                  </button>
                  <button disabled={submitting} onClick={completeRequest}>
                    {submitting
                      ? "Submitting…"
                      : selectedResource.quantity_available > 0
                        ? "Confirm reservation"
                        : "Join waitlist"}
                    <Check size={17} />
                  </button>
                </div>
              </>
            )}
            {flowStage === "success" && completion && (
              <div className="success-state">
                <div className="success-mark">
                  <Check />
                </div>
                <span className="eyebrow">Request recorded</span>
                <h2 id="resource-title">
                  {completion.kind === "reservation"
                    ? "Your reservation is confirmed"
                    : "You joined the waitlist"}
                </h2>
                <p>{selectedResource.name} is now saved to your account.</p>
                <div className="reference">
                  <span>Reference number</span>
                  <b>
                    CRP-{completion.kind === "reservation" ? "R" : "W"}-
                    {completion.id.toString().padStart(5, "0")}
                  </b>
                </div>
                <div className="detail-section">
                  <h3>What happens next</h3>
                  <p>
                    This is a portfolio demonstration, so no organization will
                    contact you. Use My requests to view this entry
                    {completion.kind === "reservation"
                      ? " or cancel the reservation"
                      : " and check its status"}
                    .
                  </p>
                </div>
                <div className="flow-actions single">
                  <button onClick={showRequests}>
                    View my requests <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {authOpen && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              className="close"
              aria-label="Close"
              onClick={() => setAuthOpen(false)}
            >
              <X />
            </button>
            <span className="eyebrow">Secure access</span>
            <h2 id="auth-title">
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
              Seeker demo: demo@example.com / demo-password
              <br />
              Partner demo: partner@example.com / partner-password
            </p>
          </section>
        </div>
      )}

      {accountOpen && (
        <div className="overlay">
          <section
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-title"
          >
            <button
              className="close"
              aria-label="Close"
              onClick={() => setAccountOpen(false)}
            >
              <X />
            </button>
            <span className="eyebrow">My requests</span>
            <h2 id="account-title">{user?.full_name}</h2>
            <p>{user?.email}</p>
            <div className="history-group">
              <h3>Reservations</h3>
              {reservations.length === 0 ? (
                <p className="empty-copy">
                  No reservations yet. Browse resources to start a request.
                </p>
              ) : (
                reservations.map((item) => (
                  <div className="reservation" key={item.id}>
                    <div>
                      <b>
                        {item.resource_name || `Resource ${item.resource_id}`}
                      </b>
                      <small>
                        <span className="status-pill">{item.status}</span>
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
            </div>
            <div className="history-group">
              <h3>Waitlist</h3>
              {waitlist.length === 0 ? (
                <p className="empty-copy">You have not joined a waitlist.</p>
              ) : (
                waitlist.map((item) => (
                  <div className="reservation" key={item.id}>
                    <div>
                      <b>
                        {item.resource_name || `Resource ${item.resource_id}`}
                      </b>
                      <small>
                        <span className="status-pill waitlist-pill">
                          {item.status}
                        </span>
                        {new Date(item.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                ))
              )}
            </div>
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
