import { useNavigate } from "react-router-dom";
import SharedResourcesSection from "./SharedResourcesSection";
import logo from "../assets/logo.png";
import "../pages/Home.css";

const userNavItems = [
  { label: "Profile", path: "/profile" },
  { label: "Resources", path: "/resources" },
  { label: "Support", path: "/SupportUser" },
  { label: "Review", path: "/Review" },
  { label: "Tasks", path: "/taskPage" },
];

export default function Resources() {
  const navigate = useNavigate();

  return (
    <div className="modern-home-page">
      <div className="light-bg-gradient" />
      <div className="grain-overlay" />
      <div className="color-ribbon color-ribbon-1" />
      <div className="color-ribbon color-ribbon-2" />
      <div className="color-ribbon color-ribbon-3" />
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />

      <main className="site-shell pt-6 pb-8 min-h-screen flex flex-col gap-8 animate-in" style={{ animationDelay: "100ms" }}>
        <header className="premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => navigate("/home")}>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#5f3920]/20 transition-all duration-300">
              <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                Uni Learn Hub
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest">
                Resource Center
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
            {userNavItems.map((item) => (
              <button
                key={item.label}
                className="nav-pill text-xs sm:text-sm"
                onClick={() => navigate(item.path)}
                type="button"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </header>

        <div className="premium-glass rounded-3xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-3xl font-extrabold text-[#2d2926] flex items-center gap-3 relative">
                <svg className="w-8 h-8 text-[#b49060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Shared Resource Library
              </h2>
              <p className="text-[#5c544d] mt-2 max-w-2xl">
                This page now shows only user shared videos, PDFs, and notes. Instructor uploaded learning videos are available on a separate page.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/learning-resources")}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-transform"
              >
                View Instructor Resources
              </button>
              <button
                onClick={() => navigate("/home")}
                className="px-5 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:text-[#b49060] transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>

        <SharedResourcesSection />
      </main>
    </div>
  );
}
