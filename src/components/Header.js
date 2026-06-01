function Header() {
  const primaryNavigation = "\uae30\ubcf8 \ud0d0\uc0c9";

  return (
    <header className="site-header">
      <a href="#top" className="brand" aria-label="AI Detector home">
        <span className="brand-mark" aria-hidden="true">AD</span>
        <span className="brand-text">
          <span className="brand-name">AI Detector</span>
          <span className="brand-subtitle">Synthetic Media Lab</span>
        </span>
      </a>

      <nav className="nav-menu" aria-label={primaryNavigation}>
        <a href="#image-detection">Image</a>
        <a href="#video-detection">Video</a>
        <a href="#text-detection">Text</a>
      </nav>
    </header>
  );
}

export default Header;
