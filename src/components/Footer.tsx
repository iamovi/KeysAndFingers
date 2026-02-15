const Footer = () => (
  <footer className="border-t border-border py-2 px-6">
    <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground font-mono">
      <span>Keys&Fingers © {new Date().getFullYear()}</span>
      <span className="hidden sm:inline">press esc to reset</span>
    </div>
  </footer>
);

export default Footer;
