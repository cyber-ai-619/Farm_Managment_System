function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer" aria-label="Site footer">
      <p>© AgriHub @ {year}</p>
    </footer>
  );
}

export default Footer;
