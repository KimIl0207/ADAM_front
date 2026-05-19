function Header() {
  return (
    <header className="site-header">
      <a href="#top" className="brand" aria-label="AI Detector home">
        <span className="brand-mark">AD</span>
        <span className="brand-name">AI Detector</span>
      </a>

      <nav className="nav-menu" aria-label="Primary navigation">
        <a href="#image-detection">Image</a>
        <a href="#video-detection">Video</a>
        <a href="#text-detection">Text</a>
      </nav>
    </header>
  );
}

export default Header;
