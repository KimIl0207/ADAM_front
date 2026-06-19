function Footer() {
  const description = "\uc774\ubbf8\uc9c0, \ub3d9\uc601\uc0c1, \ud14d\uc2a4\ud2b8 \u0041\u0049 \ud0d0\uc9c0\ub97c \uc704\ud55c \uc791\uc5c5 \uacf5\uac04\uc785\ub2c8\ub2e4.";
  const location = "\uc11c\uc6b8, \ub300\ud55c\ubbfc\uad6d";

  return (
    <footer className="site-footer">
      <div>
        <strong>ADAM</strong>
        <p>{description}</p>
      </div>

      <address className="footer-contact">
        <a href="mailto:so0214n2@gmail.com">so0214n2@gmail.com</a>
        <span>{location}</span>
      </address>
    </footer>
  );
}

export default Footer;
