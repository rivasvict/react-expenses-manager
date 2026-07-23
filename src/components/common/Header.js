import React from "react";
import { Link, NavLink } from "react-router-dom";
import GlyphIcon from "./GlyphIcon";
import BrandMark from "./BrandMark";
/**
 * TODO:
 * Reinstate the log-out action
 * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
 */
// import { logOut } from "../../redux/userManager/actionCreators";
import "./Header.scss";

// The dashboard lives on both "/" and "/dashboard".
const isHomeActive = (match, location) =>
  location.pathname === "/" || location.pathname.startsWith("/dashboard");

// Destination-specific glyphs (candidate 7): the shape says what the tab is.
// `grid` for Categories and a `bucket` for Buckets (a spending-limit container,
// the feature's own metaphor) read truer than the old tag/pie-chart icons.
const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "home", isActive: isHomeActive },
  { to: "/categories", label: "Categories", icon: "grid" },
  { to: "/buckets", label: "Buckets", icon: "bucket" },
  { to: "/fixed-entries", label: "Fixed Entries", icon: "repeat" },
  {
    to: "/data-management",
    label: "Data",
    ariaLabel: "Data Management",
    icon: "database",
  },
];

/**
 * App bar with a single nav that adapts by viewport: an inline icon+label nav
 * on wide screens, a fixed bottom tab bar on narrow ones. The same links stay
 * in the DOM in both layouts.
 */
const Header = () => (
  <header className="app-header">
    <div className="app-header__bar">
      <Link to="/" className="app-header__brand">
        <BrandMark size={40} className="logo" title="Expenses Tracker logo" />
        <span className="app-header__name">Expenses Tracker</span>
      </Link>
      <nav className="app-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, ariaLabel, icon, isActive }) => (
          <NavLink
            key={to}
            to={to}
            exact={to === "/"}
            isActive={isActive}
            className="app-nav__item"
            activeClassName="app-nav__item--active"
            aria-label={ariaLabel}
          >
            {/* The active indicator sits behind the icon only (candidate 7),
                so "you are here" reads at a glance without tinting the whole
                tab. */}
            <span className="app-nav__glyph">
              <GlyphIcon name={icon} size={20} className="app-nav__icon" />
            </span>
            <span className="app-nav__label">{label}</span>
          </NavLink>
        ))}
        {/**
         * TODO:
         * Reinstate the sign-out button
         * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
         */}
        {/* <Button block type='submit' variant='secondary' onClick={onLogOut}>Sign out</Button> */}
      </nav>
    </div>
  </header>
);

export default Header;
