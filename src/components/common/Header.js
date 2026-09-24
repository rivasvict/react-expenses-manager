// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import { connect } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import GlyphIcon from "./GlyphIcon";
import BrandMark from "./BrandMark";
import AccountChip from "./AccountChip";
import SyncStatusRing from "./SyncStatusRing";
import SettingsChip from "./SettingsChip";
import { useTranslation } from "../../i18n";
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
  { to: "/", labelKey: "nav.home", icon: "home", isActive: isHomeActive },
  { to: "/categories", labelKey: "nav.categories", icon: "grid" },
  { to: "/buckets", labelKey: "nav.buckets", icon: "bucket" },
  { to: "/fixed-entries", labelKey: "nav.fixedEntries", icon: "repeat" },
  {
    to: "/data-management",
    labelKey: "nav.data",
    ariaLabelKey: "nav.dataManagement",
    icon: "database",
  },
];

/**
 * App bar with a single nav that adapts by viewport: an inline icon+label nav
 * on wide screens, a fixed bottom tab bar on narrow ones. The same links stay
 * in the DOM in both layouts.
 */
const Header = ({ session }) => {
  const { t } = useTranslation();
  return (
    <header className="app-header">
      <div className="app-header__bar">
        <Link to="/" className="app-header__brand">
          <BrandMark size={40} className="logo" title={t("header.logoTitle")} />
          <span className="app-header__name">{t("header.appName")}</span>
        </Link>
        <nav className="app-nav" aria-label={t("nav.ariaLabel")}>
          {NAV_ITEMS.map(({ to, labelKey, ariaLabelKey, icon, isActive }) => (
            <NavLink
              key={to}
              to={to}
              exact={to === "/"}
              isActive={isActive}
              className="app-nav__item"
              activeClassName="app-nav__item--active"
              aria-label={ariaLabelKey && t(ariaLabelKey)}
            >
              {/* The active indicator sits behind the icon only (candidate 7),
                so "you are here" reads at a glance without tinting the whole
                tab. */}
              <span className="app-nav__glyph">
                <GlyphIcon name={icon} size={20} className="app-nav__icon" />
              </span>
              <span className="app-nav__label">{t(labelKey)}</span>
            </NavLink>
          ))}
          {/**
           * TODO:
           * Reinstate the sign-out button
           * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
           */}
          {/* <Button block type='submit' variant='secondary' onClick={onLogOut}>Sign out</Button> */}
        </nav>
        <div className="app-header__account">
          <SettingsChip />
          <SyncStatusRing />
          <AccountChip session={session} />
        </div>
      </div>
    </header>
  );
};

const mapStateToProps = (state) => ({
  session: state.syncManager.session,
});

export default connect(mapStateToProps)(Header);
