function Header({ currentPath, onNavigate }) {
  const primaryNavigation = "\uae30\ubcf8 \ud0d0\uc0c9";
  const links = [
    { path: "/image", label: "Image" },
    { path: "/video", label: "Video" },
    { path: "/text", label: "Text" },
  ];

  const handleNavigation = (event, path) => {
    event.preventDefault();
    onNavigate(path);
  };

  return (
    <header className="site-header">
      <a href="/image" className="brand" aria-label="AI Detector home" onClick={(event) => handleNavigation(event, "/image")}>
        <span className="brand-logo-wrap" aria-hidden="true">
          <img src="/adam-logo-header.png" alt="" className="brand-logo" />
        </span>
        <span className="brand-text">
          <span className="brand-name">ADAM</span>
          <span className="brand-subtitle">Synthetic Media Lab</span>
        </span>
      </a>

      <nav className="nav-menu" aria-label={primaryNavigation}>
        {links.map((link) => (
          <a
            href={link.path}
            className={currentPath === link.path ? "is-active" : undefined}
            key={link.path}
            onClick={(event) => handleNavigation(event, link.path)}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export default Header;
