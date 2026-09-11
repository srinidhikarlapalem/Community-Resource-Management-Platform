import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  HeartHandshake,
  Languages,
  ListFilter,
  MapPin,
  Navigation,
  Phone,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DirectoryResource, directoryResources } from "./resources";

const categories = [
  "All services",
  ...Array.from(new Set(directoryResources.map((r) => r.category))),
];
const locations = [
  "All locations",
  "Boston",
  "Cambridge",
  "Somerville",
  "Chelsea",
  "Greater Boston",
];

export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All services");
  const [location, setLocation] = useState("All locations");
  const [format, setFormat] = useState("Any format");
  const [selected, setSelected] = useState<DirectoryResource | null>(null);
  const [saved, setSaved] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("saved_boston_resources") || "[]"),
  );
  const [savedOnly, setSavedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(
    () =>
      directoryResources.filter((resource) => {
        const text =
          `${resource.name} ${resource.organization} ${resource.category} ${resource.location} ${resource.summary} ${resource.services.join(" ")}`.toLowerCase();
        return (
          text.includes(query.toLowerCase()) &&
          (category === "All services" || resource.category === category) &&
          (location === "All locations" ||
            resource.location === location ||
            resource.serviceArea.includes(location)) &&
          (format === "Any format" || resource.format.includes(format)) &&
          (!savedOnly || saved.includes(resource.id))
        );
      }),
    [query, category, location, format, savedOnly, saved],
  );

  function search(event: FormEvent) {
    event.preventDefault();
    document
      .getElementById("directory")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  function toggleSaved(id: string) {
    const next = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    setSaved(next);
    localStorage.setItem("saved_boston_resources", JSON.stringify(next));
  }
  async function share(resource: DirectoryResource) {
    const url = `${window.location.origin}${window.location.pathname}#${resource.id}`;
    if (navigator.share)
      await navigator.share({
        title: resource.name,
        text: `${resource.name} from ${resource.organization}`,
        url,
      });
    else {
      await navigator.clipboard.writeText(url);
      alert("Resource link copied");
    }
  }
  function clearFilters() {
    setQuery("");
    setCategory("All services");
    setLocation("All locations");
    setFormat("Any format");
    setSavedOnly(false);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top">
          <span>
            <HeartHandshake />
          </span>
          <span>
            Community Resource <b>Platform</b>
          </span>
        </a>
        <nav>
          <a href="#directory">Find resources</a>
          <a href="#about">About</a>
          <button
            className="saved-nav"
            onClick={() => {
              setSavedOnly(!savedOnly);
              document
                .getElementById("directory")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Bookmark size={17} /> Saved <span>{saved.length}</span>
          </button>
        </nav>
      </header>

      <section className="emergency-bar">
        <CircleAlert size={18} />
        <span>
          <b>Need help right now?</b> Call 911 for immediate danger, 988 for a
          mental health crisis, or 211 for local services.
        </span>
        <a href="tel:211">Call 211</a>
      </section>

      <section className="finder" id="top">
        <div className="finder-copy">
          <span className="kicker">
            <ShieldCheck size={16} /> Greater Boston resource guide
          </span>
          <h1>Find trusted help near you</h1>
          <p>
            Search verified organizations for food, housing, healthcare, legal
            assistance, transportation, and family support across Greater
            Boston.
          </p>
        </div>
        <form className="finder-box" onSubmit={search}>
          <label className="main-search">
            <Search />
            <span>
              <small>What do you need?</small>
              <input
                aria-label="Search resources"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Food, housing, legal help, an organization…"
              />
            </span>
          </label>
          <label className="location-search">
            <MapPin />
            <span>
              <small>Where?</small>
              <select
                aria-label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {locations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </span>
          </label>
          <button>
            Search <ArrowRight size={18} />
          </button>
        </form>
        <div className="quick-links">
          <span>Browse by need</span>
          {["Food", "Housing", "Healthcare", "Legal"].map((item) => (
            <button
              key={item}
              onClick={() => {
                setCategory(item);
                document
                  .getElementById("directory")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="trust-strip">
        <div>
          <CheckCircle2 />
          <span>
            <b>Verified organizations</b>
            <small>Every listing links to an official provider</small>
          </span>
        </div>
        <div>
          <Navigation />
          <span>
            <b>Boston-area coverage</b>
            <small>Boston, Cambridge, Somerville, Chelsea, and beyond</small>
          </span>
        </div>
        <div>
          <Languages />
          <span>
            <b>Inclusive navigation</b>
            <small>Language information shown when available</small>
          </span>
        </div>
      </section>

      <section className="directory" id="directory">
        <div className="directory-head">
          <div>
            <span className="kicker">Resource directory</span>
            <h2>Support across Greater Boston</h2>
            <p>
              {filtered.length} verified{" "}
              {filtered.length === 1 ? "resource" : "resources"} matching your
              search
            </p>
          </div>
          <button
            className="mobile-filter"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal /> Filters
          </button>
        </div>
        <div className="directory-layout">
          <aside className={showFilters ? "filters open" : "filters"}>
            <div className="filter-title">
              <ListFilter />
              <b>Filter results</b>
            </div>
            <label>
              Service type
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Location
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {locations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              How to access
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option>Any format</option>
                <option>In person</option>
                <option>Phone</option>
                <option>Online</option>
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={savedOnly}
                onChange={(e) => setSavedOnly(e.target.checked)}
              />{" "}
              Saved resources only
            </label>
            <button className="clear" onClick={clearFilters}>
              Clear all filters
            </button>
            <div className="verification-note">
              <ShieldCheck />
              <div>
                <b>Information reviewed</b>
                <p>September 2026</p>
                <small>
                  Schedules and eligibility can change. Confirm details with the
                  provider.
                </small>
              </div>
            </div>
          </aside>
          <div className="resource-list">
            {filtered.length === 0 ? (
              <div className="empty">
                <Search />
                <h3>No resources matched</h3>
                <p>Try broadening the location or service type.</p>
                <button onClick={clearFilters}>Clear filters</button>
              </div>
            ) : (
              filtered.map((resource) => (
                <article
                  className="resource-card"
                  id={resource.id}
                  key={resource.id}
                >
                  <div className="card-main">
                    <div className="card-labels">
                      <span>{resource.category}</span>
                      {resource.featured && (
                        <em>
                          <CheckCircle2 /> Featured
                        </em>
                      )}
                    </div>
                    <h3>{resource.name}</h3>
                    <p className="organization">{resource.organization}</p>
                    <p>{resource.summary}</p>
                    <div className="meta">
                      <span>
                        <MapPin /> {resource.location}
                      </span>
                      <span>
                        <Navigation /> Serves {resource.serviceArea}
                      </span>
                    </div>
                    <div className="format-tags">
                      {resource.format.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      className="save"
                      aria-label="Save resource"
                      onClick={() => toggleSaved(resource.id)}
                    >
                      {saved.includes(resource.id) ? (
                        <BookmarkCheck />
                      ) : (
                        <Bookmark />
                      )}
                    </button>
                    <button
                      className="details"
                      onClick={() => setSelected(resource)}
                    >
                      View details <ChevronRight />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="how" id="about">
        <div>
          <span className="kicker">How to use this guide</span>
          <h2>Start here, then connect directly</h2>
        </div>
        <ol>
          <li>
            <b>1</b>
            <span>
              <strong>Search for support</strong>
              <small>
                Use your need, location, and preferred way to connect.
              </small>
            </span>
          </li>
          <li>
            <b>2</b>
            <span>
              <strong>Review the details</strong>
              <small>
                Check services, eligibility, location, and suggested next steps.
              </small>
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              <strong>Contact the provider</strong>
              <small>
                Call or continue to the organization’s official website.
              </small>
            </span>
          </li>
        </ol>
      </section>
      <footer>
        <div className="brand light">
          <span>
            <HeartHandshake />
          </span>
          <span>
            Community Resource <b>Platform</b>
          </span>
        </div>
        <p>
          Independent Greater Boston resource navigation project. Information
          should be confirmed directly with each provider.
        </p>
        <a href="https://mass211.org/" target="_blank" rel="noreferrer">
          Massachusetts 211 <ExternalLink />
        </a>
      </footer>

      {selected && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <section
            className="resource-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <button
              className="modal-close"
              aria-label="Close details"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <div className="modal-top">
              <span className="category">{selected.category}</span>
              <span className="verified">
                <CheckCircle2 /> Official provider
              </span>
            </div>
            <h2 id="detail-title">{selected.name}</h2>
            <p className="modal-org">{selected.organization}</p>
            <p className="modal-summary">{selected.summary}</p>
            <div className="detail-meta">
              <div>
                <MapPin />
                <span>
                  <small>Location</small>
                  <b>{selected.location}</b>
                  {selected.address && <em>{selected.address}</em>}
                </span>
              </div>
              <div>
                <Navigation />
                <span>
                  <small>Service area</small>
                  <b>{selected.serviceArea}</b>
                </span>
              </div>
            </div>
            <div className="modal-section">
              <h3>Services offered</h3>
              <ul>
                {selected.services.map((item) => (
                  <li key={item}>
                    <CheckCircle2 /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-section">
              <h3>Who may qualify</h3>
              <p>{selected.eligibility}</p>
            </div>
            {selected.languages && (
              <div className="language-box">
                <Languages />
                <span>
                  <b>Language access</b>
                  <small>{selected.languages}</small>
                </span>
              </div>
            )}
            <div className="next-step">
              <h3>Recommended next step</h3>
              <p>{selected.nextStep}</p>
            </div>
            <div className="modal-actions">
              <button className="share" onClick={() => share(selected)}>
                <Share2 /> Share
              </button>
              <button
                className="share"
                onClick={() => toggleSaved(selected.id)}
              >
                {saved.includes(selected.id) ? <BookmarkCheck /> : <Bookmark />}
                {saved.includes(selected.id) ? "Saved" : "Save"}
              </button>
              {selected.phone && (
                <a className="call" href={`tel:${selected.phone}`}>
                  <Phone /> Call {selected.phone}
                </a>
              )}
              <a
                className="official"
                href={selected.website}
                target="_blank"
                rel="noreferrer"
              >
                Visit official website <ExternalLink />
              </a>
            </div>
            <p className="source-note">
              <ShieldCheck /> Information reviewed September 2026. Confirm
              current hours, eligibility, and availability with the
              organization.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
