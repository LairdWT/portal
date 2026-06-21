// Bundle the token :root custom properties into the published stylesheet via the
// theme entry (not the main entry - importing CSS there makes portal.js self-
// reference portal.css and breaks `portal/styles.css` subpath resolution).
import './tokens.css';

export * from './tokens';
